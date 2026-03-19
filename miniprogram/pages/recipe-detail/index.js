const { getRecipeImage, defaultCover, normalizeImageUrl } = require('../../utils/image')
Page({
  data: {
    id: '',
    recipe: { name: '', constitution: '', ingredients: [], steps: [], effect: '', taboo: '', suitable: '', unsuitable: '' },
    fav: false,
    defaultCover
  },
  onLoad(options) {
    const id = options && options.id ? String(options.id) : ''
    this.setData({ id })
    this.loadFromCache()
    this.fetchIfNeeded()
  },
  loadFromCache() {
    let source = []
    try {
      source = wx.getStorageSync('allRecipes') || []
      if (!Array.isArray(source) || source.length === 0) source = wx.getStorageSync('lastJudgeResult')?.recipes || []
    } catch (_) {}
    let recipe = source.find((x) => String(x.id) === this.data.id)
    if (!recipe) {
      recipe = { id: this.data.id, name: '药膳', constitution: '', ingredients: [], steps: [], effect: '', difficulty: '中', time: '30min' }
    }
    if (!recipe.image_url || String(recipe.image_url).length === 0) {
      recipe.image_url = getRecipeImage(recipe.name)
    } else {
      recipe.image_url = normalizeImageUrl(recipe.image_url)
    }
    this.setData({ recipe })
    this.syncFav()
  },
  fetchIfNeeded() {
    const recipe = this.data.recipe
    if (!recipe || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      const { request } = require('../../utils/request')
      request({ url: '/api/constitution/judge-with-recipes', method: 'POST', data: { listAll: true }, showLoading: false })
        .then((res) => {
          const arr = (Array.isArray(res && res.merged) ? res.merged : Array.isArray(res) ? res : []).map((item) => ({
            ...item,
            image_url: normalizeImageUrl(item && item.image_url ? item.image_url : '')
          }))
          if (arr.length > 0) {
            try { wx.setStorageSync('allRecipes', arr) } catch (_) {}
            this.loadFromCache()
          }
        })
        .catch(() => {})
    }
  },
  syncFav() {
    try {
      const favs = wx.getStorageSync('favorites') || []
      const exists = favs.some((x) => String(x.id) === String(this.data.id))
      this.setData({ fav: !!exists })
    } catch (_) {}
  },
  toggleFav() {
    try {
      const favs = wx.getStorageSync('favorites') || []
      const idx = favs.findIndex((x) => String(x.id) === String(this.data.id))
      if (idx > -1) {
        favs.splice(idx, 1)
        wx.setStorageSync('favorites', favs)
        this.setData({ fav: false })
        wx.showToast({ title: '已取消收藏', icon: 'none' })
      } else {
        favs.unshift(this.data.recipe)
        wx.setStorageSync('favorites', favs.slice(0, 50))
        this.setData({ fav: true })
        wx.showToast({ title: '已收藏', icon: 'success' })
      }
    } catch (_) {}
  },
  onShareAppMessage() {
    const title = this.data.recipe.name || '药膳详情'
    return { title }
  },
  onDetailImageError() {
    const cur = this.data.recipe.image_url || ''
    const name = this.data.recipe.name || ''
    if (!cur || cur === this.data.defaultCover) {
      return
    }
    if (cur.endsWith('.png') && !cur.startsWith('http') && !cur.startsWith('cloud://')) {
      this.setData({ 'recipe.image_url': `/assets/recipes/${name}.jpg` })
      return
    }
    this.setData({ 'recipe.image_url': this.data.defaultCover })
  }
})
