const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const REMOVED_RECIPE_NAMES = new Set(['冬瓜排骨海带汤'])

function normalizeFileID(v) {
  if (typeof v !== 'string') return ''
  let id = v.trim()
  if ((id.startsWith('"') && id.endsWith('"')) || (id.startsWith("'") && id.endsWith("'"))) {
    id = id.slice(1, -1).trim()
  }
  if (/^cloud:\/[^/]/i.test(id)) {
    id = id.replace(/^cloud:\//i, 'cloud://')
  }
  if (id.startsWith('cloud://')) {
    id = id.replace(/\s+/g, '')
  }
  return id
}

function pickFileID(doc) {
  if (!doc || typeof doc !== 'object') return ''
  const raw = doc.imageFileID || doc.fileID || doc.FileID || doc.image_url || ''
  return normalizeFileID(raw)
}

function normalizeAnswers(answers) {
  const map = {}
  if (Array.isArray(answers)) { answers.forEach((v, i) => { const idx = i + 1; map[idx] = v }) }
  else if (answers && typeof answers === 'object') { Object.keys(answers).forEach((k) => { const idx = Number(k); if (idx > 0) map[idx] = answers[k] }) }
  const toBool = (v) => {
    if (typeof v === 'boolean') return v
    if (typeof v === 'number') return v > 0
    if (typeof v === 'string') { const s = v.trim().toLowerCase(); return s === '是' || s === 'yes' || s === 'true' || s === '1' }
    if (v && typeof v === 'object') {
      let val
      if (Object.prototype.hasOwnProperty.call(v, 'answer')) val = v.answer
      else if (Object.prototype.hasOwnProperty.call(v, 'value')) val = v.value
      else if (Object.prototype.hasOwnProperty.call(v, 'v')) val = v.v
      else if (Object.prototype.hasOwnProperty.call(v, 'checked')) val = v.checked
      return toBool(val)
    }
    return false
  }
  const boolMap = {}
  Object.keys(map).forEach((k) => { const v = map[k]; boolMap[Number(k)] = toBool(v) })
  return boolMap
}

function scoreByQuestionnaire(answers) {
  const a = normalizeAnswers(answers)
  const groups = [
    { name: '气虚质', q: [5, 6, 7] }, { name: '阳虚质', q: [8, 9, 10] }, { name: '阴虚质', q: [11, 12, 13] },
    { name: '痰湿质', q: [14, 15, 16] }, { name: '湿热质', q: [17, 18, 19] }, { name: '血瘀质', q: [20, 21, 22] },
    { name: '气郁质', q: [23, 24, 25] }, { name: '特禀质', q: [26, 27, 28] }
  ]
  const detail = groups.map((g) => {
    const present = g.q.filter((q) => Object.prototype.hasOwnProperty.call(a, q))
    const denom = present.length
    const t = present.reduce((sum, q) => sum + (a[q] ? 1 : 0), 0)
    const count = denom > 0 ? Math.round((t / denom) * 3) : 0
    return { constitution: g.name, count }
  })
  const allZero = detail.every((d) => d.count === 0)
  if (allZero) return { mainConstitution: '平和质', matchDetail: detail, decision: { type: 'neutral', topGap: 0 }, primary: [] }
  const sorted = [...detail].sort((x, y) => y.count - x.count)
  const top = sorted[0], second = sorted[1] || { count: 0 }, gap = top.count - second.count
  const topTies = sorted.filter((d) => d.count === top.count).map((d) => d.constitution)
  if (topTies.length >= 3) return { mainConstitution: '复合兼夹体质', matchDetail: detail, decision: { type: 'complex', topGap: 0 }, primary: topTies }
  if (topTies.length === 2) return { mainConstitution: `${topTies[0]}+${topTies[1]}`, matchDetail: detail, decision: { type: 'dual', topGap: 0 }, primary: topTies }
  if (gap >= 2) return { mainConstitution: top.constitution, matchDetail: detail, decision: { type: 'single', topGap: gap }, primary: [top.constitution] }
  return { mainConstitution: `${top.constitution}+${second.constitution}`, matchDetail: detail, decision: { type: 'mixed', topGap: gap }, primary: [top.constitution, second.constitution] }
}

async function buildImageUrlMap(fileIDs) {
  let urlMap = {}
  if (Array.isArray(fileIDs) && fileIDs.length > 0) {
    try {
      const clean = fileIDs.map((id) => normalizeFileID(id)).filter(Boolean)
      const resp = await cloud.getTempFileURL({ fileList: clean })
      const arr = resp && Array.isArray(resp.fileList) ? resp.fileList : []
      urlMap = arr.reduce((m, it) => {
        const id = normalizeFileID(it && it.fileID ? it.fileID : '')
        const url = it && it.tempFileURL ? it.tempFileURL : ''
        if (id && url) m[id] = url
        return m
      }, {})
    } catch (err) { void err }
  }
  return urlMap
}

async function fetchAllRecipes() {
  const list = []
  try {
    const total = (await db.collection('recipe').count()).total || 0
    const pageSize = 100
    let skip = 0
    while (skip < total) {
      const r = await db.collection('recipe').skip(skip).limit(pageSize).get()
      const docs = r.data || []
      docs.forEach((doc) => list.push(doc))
      skip += pageSize
    }
  } catch (err) { void err }
  const fileIDs = list
    .map((doc) => {
      const id = pickFileID(doc)
      return typeof id === 'string' && id.startsWith('cloud://') ? id : ''
    })
    .filter((id) => typeof id === 'string' && id.length > 0)
  const urlMap = await buildImageUrlMap(fileIDs)
  const mapped = list.map((doc) => {
    let ingredients = []
     if (Array.isArray(doc.ingredients)) ingredients = doc.ingredients
     else if (typeof doc.ingredients === 'string') { 
       try { ingredients = JSON.parse(doc.ingredients.replace(/'/g, '"')) } 
       catch(_) { ingredients = doc.ingredients.split(/[,，\n]+/).map(s => s.trim()).filter(Boolean) } 
     }
     
     let steps = []
     if (Array.isArray(doc.steps)) steps = doc.steps
     else if (typeof doc.steps === 'string') { 
       try { steps = JSON.parse(doc.steps.replace(/'/g, '"')) } 
       catch(_) { steps = doc.steps.split(/[\n]+/).map(s => s.trim()).filter(Boolean) } 
     }

    const video_url = doc.video_url || doc.videoUrl || ''
    const idToMap = pickFileID(doc)
    let image_url = idToMap && urlMap[idToMap] ? urlMap[idToMap] : (doc.image_url || idToMap || '')
    return { 
      id: doc.id || doc._id || '', 
      name: doc.name || '', 
      constitution: doc.constitution || '', 
      ingredients, 
      steps, 
      video_url, 
      image_url,
      effect: doc.effect || '',
      taboo: doc.taboo || '',
      suitable: doc.suitable || '',
      unsuitable: doc.unsuitable || ''
    }
  }).filter((item) => !REMOVED_RECIPE_NAMES.has(item && item.name ? item.name : ''))
  return mapped
}

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const passedOpenid = event && event.openid ? String(event.openid) : ''
    if (event && event.listAll) {
      const all = await fetchAllRecipes()
      return { code: 200, message: '成功', data: { result: null, recipes: { all }, merged: all } }
    }
    if (!passedOpenid || !wxContext || !wxContext.OPENID || passedOpenid !== wxContext.OPENID) {
      return { code: 401, message: '未授权或身份不一致', data: null }
    }
    const { symptoms, answers } = event || {}
    let result = null
    if (answers !== undefined) result = scoreByQuestionnaire(answers)
    else if (Array.isArray(symptoms)) result = { mainConstitution: '', matchDetail: [], decision: { type: 'na', topGap: 0 }, primary: [] }
    else return { code: 400, message: '参数错误', data: null }
    let targets = []
    if (result && Array.isArray(result.primary) && result.primary.length > 0) targets = result.primary
    else if (result && typeof result.mainConstitution === 'string' && result.mainConstitution.length > 0) targets = result.mainConstitution.split('+').map((s) => s.trim()).filter(Boolean)
    const recipes = {}
    for (const t of targets) {
      try {
        const r = await db.collection('recipe').where({ constitution: t }).get()
        const docs = (r.data || []).filter((doc) => !REMOVED_RECIPE_NAMES.has(doc && doc.name ? doc.name : ''))
        const fileIDs = docs
          .map((doc) => {
            const id = pickFileID(doc)
            return typeof id === 'string' && id.startsWith('cloud://') ? id : ''
          })
          .filter((id) => typeof id === 'string' && id.length > 0)
        const urlMap = await buildImageUrlMap(fileIDs)
        const list = docs.map((doc) => {
          let ingredients = []
           if (Array.isArray(doc.ingredients)) ingredients = doc.ingredients
           else if (typeof doc.ingredients === 'string') { 
             try { ingredients = JSON.parse(doc.ingredients.replace(/'/g, '"')) } 
             catch(_) { ingredients = doc.ingredients.split(/[,，\n]+/).map(s => s.trim()).filter(Boolean) } 
           }
           
           let steps = []
           if (Array.isArray(doc.steps)) steps = doc.steps
           else if (typeof doc.steps === 'string') { 
             try { steps = JSON.parse(doc.steps.replace(/'/g, '"')) } 
             catch(_) { steps = doc.steps.split(/[\n]+/).map(s => s.trim()).filter(Boolean) } 
           }

          const video_url = doc.video_url || doc.videoUrl || ''
          const idToMap = pickFileID(doc)
          let image_url = idToMap && urlMap[idToMap] ? urlMap[idToMap] : (doc.image_url || idToMap || '')
          return { 
            id: doc.id || doc._id || '', 
            name: doc.name || '', 
            constitution: t, 
            ingredients, 
            steps, 
            video_url, 
            image_url,
            effect: doc.effect || '',
            taboo: doc.taboo || '',
            suitable: doc.suitable || '',
            unsuitable: doc.unsuitable || ''
          }
        })
        recipes[t] = list
      } catch { recipes[t] = [] }
    }
    const merged = Object.values(recipes).flat()
    return { code: 200, message: '成功', data: { result, recipes, merged } }
  } catch (e) { return { code: 500, message: '服务异常', data: null } }
}
