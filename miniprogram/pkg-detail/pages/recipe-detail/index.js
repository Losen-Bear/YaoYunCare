const { getRecipeImage, getRecipeCloudWebpByName, defaultCover, isSignedCloudTempUrl, normalizeImageUrl, resolveImageUrl, toCloudFileID } = require('../../../utils/image')
const { request, getStorage, setStorage } = require('../../../api/request')
const { API_ROUTES, STORAGE_KEYS } = require('../../../constants/index')
Page({
  data: {
    id: '',
    recipe: { name: '', constitution: '', ingredients: [], steps: [], effect: '', taboo: '', suitable: '', unsuitable: '' },
    fav: false,
    defaultCover
  },
  normalizeDetailImage(url, name) {
    const u = normalizeImageUrl(url || '')
    if (isSignedCloudTempUrl(u)) {
      const cloudID = toCloudFileID(u)
      if (cloudID && cloudID.startsWith('cloud://')) return cloudID
      return getRecipeImage(name || '')
    }
    if (u && typeof u === 'string' && u.length > 0) return u
    return getRecipeImage(name || '')
  },
  onLoad(options) {
    const id = options && options.id ? String(options.id) : ''
    this.setData({ id })
    this.loadFromCache()
    this.fetchIfNeeded()
  },
  async loadFromCache() {
    let source = getStorage(STORAGE_KEYS.ALL_RECIPES) || []
    if (!Array.isArray(source) || source.length === 0) source = getStorage(STORAGE_KEYS.LAST_JUDGE_RESULT)?.recipes || []
    let recipe = source.find((x) => String(x.id) === this.data.id)
    if (!recipe) {
      recipe = { id: this.data.id, name: '药膳', constitution: '', ingredients: [], steps: [], effect: '', difficulty: '中', time: '30min' }
    }
    recipe.image_url = await resolveImageUrl(this.normalizeDetailImage(recipe.image_url, recipe.name))
    this.setData({ recipe })
    this.syncFav()
  },
  fetchIfNeeded() {
    const recipe = this.data.recipe
    if (!recipe || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      request({ url: API_ROUTES.CONSTITUTION_JUDGE_WITH_RECIPES, method: 'POST', data: { listAll: true }, showLoading: false })
        .then((res) => {
          const arr = (Array.isArray(res && res.merged) ? res.merged : Array.isArray(res) ? res : []).map((item) => ({
            ...item,
            image_url: this.normalizeDetailImage(item && item.image_url ? item.image_url : '', item && item.name ? item.name : '')
          }))
          if (arr.length > 0) {
            setStorage(STORAGE_KEYS.ALL_RECIPES, arr)
            this.loadFromCache()
          }
        })
        .catch(() => {})
    }
  },
  syncFav() {
    const favs = getStorage(STORAGE_KEYS.FAVORITES) || []
    const exists = favs.some((x) => String(x.id) === String(this.data.id))
    this.setData({ fav: !!exists })
  },
  toggleFav() {
    const favs = getStorage(STORAGE_KEYS.FAVORITES) || []
    const idx = favs.findIndex((x) => String(x.id) === String(this.data.id))
    if (idx > -1) {
      favs.splice(idx, 1)
      setStorage(STORAGE_KEYS.FAVORITES, favs)
      this.setData({ fav: false })
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      favs.unshift(this.data.recipe)
      setStorage(STORAGE_KEYS.FAVORITES, favs.slice(0, 50))
      this.setData({ fav: true })
      wx.showToast({ title: '已收藏', icon: 'success' })
    }
  },
  onShareAppMessage() {
    const title = this.data.recipe.name || '药膳详情'
    return { title }
  },
  async onDetailImageError() {
    const cur = this.data.recipe.image_url || ''
    const name = this.data.recipe.name || ''
    if (!cur || cur === this.data.defaultCover) {
      return
    }
    if (cur.endsWith('.png') && !cur.startsWith('http') && !cur.startsWith('cloud://')) {
      const fallback = getRecipeCloudWebpByName(name)
      const resolved = await resolveImageUrl(fallback || this.data.defaultCover)
      this.setData({ 'recipe.image_url': resolved || this.data.defaultCover })
      return
    }
    const resolved = await resolveImageUrl(this.data.defaultCover)
    this.setData({ 'recipe.image_url': resolved || this.data.defaultCover })
  }
})
