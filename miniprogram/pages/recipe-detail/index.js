Page({
  data: {
    id: '',
    recipe: { name: '', constitution: '', ingredients: [], steps: [], effect: '', taboo: '', suitable: '', unsuitable: '' },
    fav: false
  },
  onLoad(options) {
    const id = options && options.id ? String(options.id) : ''
    this.setData({ id })
    let source = []
    try {
      source = wx.getStorageSync('allRecipes') || []
      if (!Array.isArray(source) || source.length === 0) source = wx.getStorageSync('lastJudgeResult')?.recipes || []
    } catch (_) {}
    let recipe = source.find((x) => String(x.id) === id)
    if (!recipe) {
      recipe = { id, name: '药膳', constitution: '', ingredients: [], steps: [], effect: '', difficulty: '中', time: '30min' }
    }
    this.setData({ recipe })
    this.syncFav()
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
  }
})
