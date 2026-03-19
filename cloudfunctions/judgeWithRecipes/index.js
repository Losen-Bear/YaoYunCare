const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
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
exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const passedOpenid = event && event.openid ? String(event.openid) : ''
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
        const list = (r.data || []).map((doc) => {
          const ingredients = Array.isArray(doc.ingredients) ? doc.ingredients : []
          const steps = Array.isArray(doc.steps) ? doc.steps : []
          const video_url = doc.video_url || doc.videoUrl || ''
          return { id: doc.id || doc._id || '', name: doc.name || '', constitution: t, ingredients, steps, video_url }
        })
        recipes[t] = list
      } catch { recipes[t] = [] }
    }
    const merged = Object.values(recipes).flat()
    return { code: 200, message: '成功', data: { result, recipes, merged } }
  } catch (e) { return { code: 500, message: '服务异常', data: null } }
}
