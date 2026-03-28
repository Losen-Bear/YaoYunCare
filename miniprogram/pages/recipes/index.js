const { getRecipeImage, defaultCover, normalizeImageUrl } = require('../../utils/image')
const { request } = require('../../api/request')
const REMOVED_RECIPE_NAMES = new Set(['冬瓜排骨海带汤'])
Page({
  data: {
    keyword: '',
    tags: ['补气', '补血', '祛湿', '清热', '安神', '美容', '养胃'],
    activeTag: '',
    constitutionFilter: '',
    allRecipes: [],
    list: [],
    defaultCover
  },
  onLoad() {
    const base = [
      { id: 'r7', name: '杂粮养生粥', constitution: '平和', effect: '均衡饮食', difficulty: '易', time: '40min', image_url: getRecipeImage('杂粮养生粥') },
      { id: 'r8', name: '清蒸鲈鱼', constitution: '平和', effect: '清淡营养', difficulty: '中', time: '20min', image_url: getRecipeImage('清蒸鲈鱼') },
      { id: 'r9', name: '清炒时蔬', constitution: '平和', effect: '清淡营养', difficulty: '易', time: '15min', image_url: getRecipeImage('清炒时蔬') },
      { id: 'r10', name: '黄芪当归鸡汤', constitution: '气虚', effect: '益气养血', difficulty: '中', time: '90min', image_url: getRecipeImage('黄芪当归鸡汤') },
      { id: 'r11', name: '党参炒山药', constitution: '气虚', effect: '健脾益气', difficulty: '易', time: '20min', image_url: getRecipeImage('党参炒山药') },
      { id: 'r12', name: '羊肉萝卜汤', constitution: '阳虚', effect: '温阳祛寒', difficulty: '中', time: '90min', image_url: getRecipeImage('羊肉萝卜汤') },
      { id: 'r13', name: '桂圆红枣姜茶', constitution: '阳虚', effect: '温补安神', difficulty: '易', time: '20min', image_url: getRecipeImage('桂圆红枣姜茶') },
      { id: 'r14', name: '韭菜炒虾仁', constitution: '阳虚', effect: '温补肾阳', difficulty: '易', time: '15min', image_url: getRecipeImage('韭菜炒虾仁') },
      { id: 'r15', name: '百合莲子粥', constitution: '阴虚', effect: '滋阴润燥', difficulty: '易', time: '40min', image_url: getRecipeImage('百合莲子粥') },
      { id: 'r16', name: '凉拌藕', constitution: '阴虚', effect: '清热润燥', difficulty: '易', time: '10min', image_url: getRecipeImage('凉拌藕') },
      { id: 'r17', name: '薏米红豆粥', constitution: '痰湿', effect: '健脾祛湿', difficulty: '易', time: '40min', image_url: getRecipeImage('薏米红豆粥') },
      { id: 'r19', name: '炒冬瓜', constitution: '痰湿', effect: '清热利湿', difficulty: '易', time: '15min', image_url: getRecipeImage('炒冬瓜') },
      { id: 'r20', name: '绿豆汤', constitution: '湿热', effect: '清热解暑', difficulty: '易', time: '40min', image_url: getRecipeImage('绿豆汤') },
      { id: 'r21', name: '苦瓜炒蛋', constitution: '湿热', effect: '清热解暑', difficulty: '易', time: '15min', image_url: getRecipeImage('苦瓜炒蛋') },
      { id: 'r22', name: '赤小豆冬瓜汤', constitution: '湿热', effect: '淡渗利湿', difficulty: '易', time: '50min', image_url: getRecipeImage('赤小豆冬瓜汤') }
    ]
    try {
      const last = wx.getStorageSync('lastJudgeResult') || {}
      const list = Array.isArray(last.recipes) ? last.recipes : []
      const merged = list.map((x, i) => ({
        id: x.id || `m${i}`,
        name: x.name || '',
        constitution: x.constitution || '',
        effect: x.effect || '',
        difficulty: x.difficulty || '中',
        time: x.time || '30min',
        image_url: (x.image_url && String(x.image_url).length > 0) ? normalizeImageUrl(x.image_url) : getRecipeImage(x.name || '')
      }))
      const all = [...merged, ...base].filter((item) => !REMOVED_RECIPE_NAMES.has(item && item.name ? item.name : ''))
      this.setData({ allRecipes: all })
      try { wx.setStorageSync('allRecipes', all) } catch (_) {}
    } catch (_) {
      this.setData({ allRecipes: base })
      try { wx.setStorageSync('allRecipes', base) } catch (_) {}
    }
    const loadCloud = () => {
      request({ url: '/api/constitution/judge-with-recipes', method: 'POST', data: { listAll: true }, showLoading: false })
        .then((res) => {
          const arr = (Array.isArray(res && res.merged) ? res.merged : Array.isArray(res) ? res : []).filter((item) => !REMOVED_RECIPE_NAMES.has(item && item.name ? item.name : ''))
          const map = {}
          arr.forEach((it) => { if (it && it.name) map[it.name] = it })
          
          // First, update existing items with cloud data
          const updated = (this.data.allRecipes || []).map((it) => {
            const cloudItem = map[it.name]
            if (cloudItem) {
              const url = normalizeImageUrl(cloudItem.image_url || '')
              map[it.name] = null // Mark as processed
              return { 
                ...it, 
                ...cloudItem,
                image_url: (url && typeof url === 'string' && url.length > 0) ? url : it.image_url 
              }
            }
            return it
          })

          // Then, append any new items from the cloud that weren't in the local list
          const newItems = []
          Object.values(map).forEach(cloudItem => {
            if (cloudItem) {
              const url = normalizeImageUrl(cloudItem.image_url || '')
              newItems.push({
                ...cloudItem,
                image_url: (url && typeof url === 'string' && url.length > 0) ? url : getRecipeImage(cloudItem.name || '')
              })
            }
          })

          const finalRecipes = [...updated, ...newItems].filter((item) => !REMOVED_RECIPE_NAMES.has(item && item.name ? item.name : ''))
          this.setData({ allRecipes: finalRecipes })
          try { wx.setStorageSync('allRecipes', finalRecipes) } catch (_) {}
          this.applyFilter()
        })
        .catch(() => {})
    }
    try {
      const openid = wx.getStorageSync('openid') || ''
      if (openid) loadCloud()
      else if (wx && wx.login) {
        wx.login({
          success: (resp) => {
            const code = resp && resp.code ? resp.code : ''
            if (code) {
              const { request } = require('../../api/request')
              request({ url: '/api/auth/wx-login', method: 'POST', data: { code }, showLoading: false })
                .then((r) => {
                  const oid = r && r.openid ? r.openid : r && r.data && r.data.openid ? r.data.openid : ''
                  if (oid) { try { wx.setStorageSync('openid', oid) } catch (_) {} }
                  loadCloud()
                })
                .catch(() => { loadCloud() })
            } else { loadCloud() }
          },
          fail: () => { loadCloud() }
        })
      } else { loadCloud() }
    } catch (_) { loadCloud() }
    if (this.getOpenerEventChannel) {
      const ec = this.getOpenerEventChannel()
      if (ec && ec.on) {
        ec.on('filter', (f) => {
          const c = f && f.constitution ? f.constitution : ''
          const tag = f && f.tag ? f.tag : ''
          this.setData({ constitutionFilter: c, activeTag: tag })
          this.applyFilter()
        })
      }
    }
    this.applyFilter()
  },
  onKeyword(e) {
    this.setData({ keyword: e.detail.value || '' })
    this.applyFilter()
  },
  onTag(e) {
    const tag = e.currentTarget.dataset.tag || ''
    this.setData({ activeTag: tag })
    this.applyFilter()
  },
  clearConstitution() {
    this.setData({ constitutionFilter: '' })
    this.applyFilter()
  },
  applyFilter() {
    const kw = (this.data.keyword || '').trim()
    const tag = this.data.activeTag || ''
    const c = this.data.constitutionFilter || ''
    let list = (this.data.allRecipes || []).filter((x) => !REMOVED_RECIPE_NAMES.has(x && x.name ? x.name : ''))
    if (kw) list = list.filter((x) => (x.name && x.name.indexOf(kw) > -1) || (x.effect && x.effect.indexOf(kw) > -1) || (x.constitution && x.constitution.indexOf(kw) > -1))
    if (tag) list = list.filter((x) => {
      if (tag === '补气') return x.effect && x.effect.indexOf('气') > -1
      if (tag === '补血') return x.effect && (x.effect.indexOf('血') > -1 || x.constitution === '血瘀')
      if (tag === '祛湿') return x.effect && (x.effect.indexOf('湿') > -1)
      if (tag === '清热') return x.effect && (x.effect.indexOf('清热') > -1 || x.constitution === '湿热')
      if (tag === '安神') return x.effect && (x.effect.indexOf('安神') > -1)
      if (tag === '美容') return x.effect && (x.effect.indexOf('美容') > -1 || x.effect.indexOf('养颜') > -1)
      if (tag === '养胃') return x.effect && (x.effect.indexOf('健脾') > -1 || x.effect.indexOf('养胃') > -1)
      return true
    })
    if (c) list = list.filter((x) => (x.constitution || '').indexOf(c) > -1)
    this.setData({ list })
  },
  onImageError(e) {
    const idx = Number(e.currentTarget.dataset.index || 0)
    const item = this.data.list[idx] || {}
    const cur = item.image_url || ''
    const name = item.name || ''
    if (!cur || cur === this.data.defaultCover) {
      return
    }
    if (cur.endsWith('.png') && !cur.startsWith('http') && !cur.startsWith('cloud://')) {
      this.setData({ [`list[${idx}].image_url`]: `/assets/recipes/${name}.jpg` })
      return
    }
    this.setData({ [`list[${idx}].image_url`]: this.data.defaultCover })
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pkg-detail/pages/recipe-detail/index?id=${id}` })
  }
})
