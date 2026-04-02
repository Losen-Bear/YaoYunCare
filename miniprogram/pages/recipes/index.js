const { getRecipeImage, getRecipeCloudWebpByName, defaultCover, isSignedCloudTempUrl, normalizeImageUrl, resolveImageUrl, resolveImageUrls, toCloudFileID } = require('../../utils/image')
const { request, ensureOpenid, getStorage, setStorage } = require('../../api/request')
const { API_ROUTES, STORAGE_KEYS, PAGES } = require('../../constants/index')
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
  normalizeCardImage(url, name) {
    const u = normalizeImageUrl(url || '')
    if (isSignedCloudTempUrl(u)) {
      const cloudID = toCloudFileID(u)
      if (cloudID && cloudID.startsWith('cloud://')) return cloudID
      return getRecipeImage(name || '')
    }
    if (u && typeof u === 'string' && u.length > 0) return u
    return getRecipeImage(name || '')
  },
  ensureDisplayableImage(url) {
    const u = normalizeImageUrl(url || '')
    if (!u || typeof u !== 'string') return ''
    if (u.startsWith('cloud://')) return ''
    return u
  },
  async refreshAllRecipeImages() {
    const all = Array.isArray(this.data.allRecipes) ? this.data.allRecipes : []
    if (all.length === 0) return
    const normalized = all.map((it) => this.normalizeCardImage(it && it.image_url ? it.image_url : '', it && it.name ? it.name : ''))
    const resolved = await resolveImageUrls(normalized)
    const next = all.map((it, index) => {
      const preferred = this.ensureDisplayableImage(resolved[index] || '')
      const fallback = this.ensureDisplayableImage(normalized[index] || '')
      return { ...it, image_url: preferred || fallback || this.data.defaultCover }
    })
    this.setData({ allRecipes: next })
    setStorage(STORAGE_KEYS.ALL_RECIPES, next)
    this.applyFilter()
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
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
      const last = getStorage(STORAGE_KEYS.LAST_JUDGE_RESULT) || {}
      const list = Array.isArray(last.recipes) ? last.recipes : []
      const merged = list.map((x, i) => ({
        id: x.id || `m${i}`,
        name: x.name || '',
        constitution: x.constitution || '',
        effect: x.effect || '',
        difficulty: x.difficulty || '中',
        time: x.time || '30min',
        image_url: this.normalizeCardImage(x.image_url, x.name || '')
      }))
      const all = [...merged, ...base].filter((item) => !REMOVED_RECIPE_NAMES.has(item && item.name ? item.name : ''))
      this.setData({ allRecipes: all })
      setStorage(STORAGE_KEYS.ALL_RECIPES, all)
    } catch (_) {
      this.setData({ allRecipes: base })
      setStorage(STORAGE_KEYS.ALL_RECIPES, base)
    }
    this.refreshAllRecipeImages()
    const loadCloud = () => {
      request({ url: API_ROUTES.CONSTITUTION_JUDGE_WITH_RECIPES, method: 'POST', data: { listAll: true }, showLoading: false })
        .then((res) => {
          const arr = (Array.isArray(res && res.merged) ? res.merged : Array.isArray(res) ? res : []).filter((item) => !REMOVED_RECIPE_NAMES.has(item && item.name ? item.name : ''))
          const map = {}
          arr.forEach((it) => { if (it && it.name) map[it.name] = it })
          
          const updated = (this.data.allRecipes || []).map((it) => {
            const cloudItem = map[it.name]
            if (cloudItem) {
              const url = this.normalizeCardImage(cloudItem.image_url, cloudItem.name || '')
              map[it.name] = null
              return { 
                ...it, 
                ...cloudItem,
                image_url: (url && typeof url === 'string' && url.length > 0) ? url : this.normalizeCardImage(it.image_url, it.name || '')
              }
            }
            return it
          })

          const newItems = []
          Object.values(map).forEach(cloudItem => {
            if (cloudItem) {
              const url = this.normalizeCardImage(cloudItem.image_url, cloudItem.name || '')
              newItems.push({
                ...cloudItem,
                image_url: (url && typeof url === 'string' && url.length > 0) ? url : this.normalizeCardImage('', cloudItem.name || '')
              })
            }
          })

          const finalRecipes = [...updated, ...newItems].filter((item) => !REMOVED_RECIPE_NAMES.has(item && item.name ? item.name : ''))
          this.setData({ allRecipes: finalRecipes })
          setStorage(STORAGE_KEYS.ALL_RECIPES, finalRecipes)
          this.refreshAllRecipeImages()
        })
        .catch(() => {})
    }
    const openid = getStorage(STORAGE_KEYS.OPENID) || ''
    if (openid) loadCloud()
    else ensureOpenid({ showLoading: false }).finally(loadCloud)
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
    this.setData({
      list: list.map((x) => ({
        ...x,
        image_url: this.ensureDisplayableImage(x && x.image_url ? x.image_url : '') || this.data.defaultCover
      }))
    })
  },
  async onImageError(e) {
    const idx = Number(e.currentTarget.dataset.index || 0)
    const item = this.data.list[idx] || {}
    const cur = item.image_url || ''
    const name = item.name || ''
    if (!cur || cur === this.data.defaultCover) {
      return
    }
    if (cur.endsWith('.png') && !cur.startsWith('http') && !cur.startsWith('cloud://')) {
      const fallback = getRecipeCloudWebpByName(name)
      const resolved = await resolveImageUrl(fallback || this.data.defaultCover)
      this.setData({ [`list[${idx}].image_url`]: resolved || this.data.defaultCover })
      return
    }
    const resolved = await resolveImageUrl(this.data.defaultCover)
    this.setData({ [`list[${idx}].image_url`]: resolved || this.data.defaultCover })
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `${PAGES.RECIPE_DETAIL}?id=${id}` })
  }
})
