const { getRecipeImage, defaultCover, normalizeImageUrl } = require('../../utils/image')
const { request } = require('../../api/request')
Page({
  data: {
    banners: [
      { src: '/assets/home/main-assessment.png', text: '测体质，领你的专属药膳' },
      { src: '/assets/home/main-season.png', text: '春季养肝 · 祛湿健脾' },
      { src: '/assets/home/main-today.png', text: '今日宜吃：山药、红枣、茯苓' }
    ],
    swiperHeight: 420,
    todayRecommend: [],
    constitutions: ['气虚', '阴虚', '阳虚', '痰湿', '湿热', '血瘀', '气郁', '特禀', '平和'],
    hotCategories: ['补气', '补血', '祛湿', '清热', '安神', '美容', '养胃'],
    defaultCover
  },
  onLoad() {
    this.loadTodayRecommend()
  },
  onLogoError() {
    this.setData({ logoError: true })
  },
  onBannerTap(e) {
    const idx = Number(e.currentTarget.dataset.index || 0)
    if (idx === 0) { this.goAssessment(); return }
    if (idx === 1) { this.goSeasonGuide(); return }
    this.goMyRecipes()
  },
  onBannerError(e) {
    const idx = Number(e.currentTarget.dataset.index || 0)
    this.setData({ [`banners[${idx}].error`]: true })
  },
  onBannerLoad(e) {
    const w = Number(e && e.detail && e.detail.width) || 0
    const h = Number(e && e.detail && e.detail.height) || 0
    if (w > 0 && h > 0) {
      const ratio = h / w
      const heightRpx = Math.round(750 * ratio)
      this.setData({ swiperHeight: heightRpx })
    }
  },
  loadTodayRecommend() {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const key = `${y}-${m}-${d}`
    const isSignedTempUrl = (url) => {
      if (!url || typeof url !== 'string') return false
      return /^https?:\/\//i.test(url) && (url.indexOf('qcloud.la') > -1 || url.indexOf('tcb.qcloud.la') > -1) && /[?&](sign|t)=/i.test(url)
    }
    const pickOne = (source) => {
      const list = Array.isArray(source) ? source.filter((it) => it && it.name) : []
      if (list.length === 0) {
        this.setData({ todayRecommend: [] })
        return
      }
      const idx = Math.floor(Math.random() * list.length)
      const item = { ...list[idx] }
      const url = normalizeImageUrl(item.image_url || '')
      item.image_url = url && typeof url === 'string' && url.length > 0 ? url : getRecipeImage(item.name || '')
      this.setData({ todayRecommend: [item] })
      try { wx.setStorageSync('dailyRecommendRecipe', { date: key, item }) } catch (_) { return }
    }
    try {
      const cached = wx.getStorageSync('dailyRecommendRecipe') || {}
      if (cached && cached.date === key && cached.item) {
        const item = { ...cached.item }
        const url = normalizeImageUrl(item.image_url || '')
        if (!isSignedTempUrl(url)) {
          item.image_url = url && typeof url === 'string' && url.length > 0 ? url : getRecipeImage(item.name || '')
          this.setData({ todayRecommend: [item] })
          return
        }
      }
    } catch (_) {}
    request({ url: '/api/constitution/judge-with-recipes', method: 'POST', data: { listAll: true }, showLoading: false })
      .then((res) => {
        const arr = Array.isArray(res && res.merged) ? res.merged : Array.isArray(res) ? res : []
        if (arr.length > 0) {
          try { wx.setStorageSync('allRecipes', arr) } catch (_) { return }
        }
        pickOne(arr)
      })
      .catch(() => {
        let source = []
        try { source = wx.getStorageSync('allRecipes') || [] } catch (_) { source = [] }
        if (Array.isArray(source) && source.length > 0) {
          pickOne(source)
          return
        }
        this.setData({ todayRecommend: [] })
      })
  },
  onRecipeImageError(e) {
    const idx = Number(e.currentTarget.dataset.index || 0)
    const item = this.data.todayRecommend[idx] || {}
    const cur = item.image_url || ''
    const name = item.name || ''
    if (!cur || cur === this.data.defaultCover) {
      return
    }
    if (cur.endsWith('.png') && !cur.startsWith('http') && !cur.startsWith('cloud://')) {
      this.setData({ [`todayRecommend[${idx}].image_url`]: `/assets/recipes/${name}.jpg` })
      return
    }
    this.setData({ [`todayRecommend[${idx}].image_url`]: this.data.defaultCover })
  },
  goAssessment() {
    wx.navigateTo({ url: '/pkg-assessment/pages/notice/index' })
  },
  goMyRecipes() {
    let logged = false
    try { logged = !!wx.getStorageSync('isLoggedIn') } catch (_) { logged = false }
    if (!logged) {
      wx.navigateTo({ url: '/pkg-user/pages/login/index?redirect=%2Fpages%2Frecipes%2Findex&tab=1' })
      return
    }
    wx.switchTab({ url: '/pages/recipes/index' })
  },
  goSeasonGuide() {
    wx.showToast({ title: '敬请期待', icon: 'none' })
  },
  goMessages() {
    wx.showToast({ title: '暂无消息', icon: 'none' })
  },
  goProfile() {
    let logged = false
    try { logged = !!wx.getStorageSync('isLoggedIn') } catch (_) { logged = false }
    if (!logged) {
      wx.navigateTo({ url: '/pkg-user/pages/login/index?redirect=%2Fpages%2Fprofile%2Findex&tab=1' })
      return
    }
    wx.switchTab({ url: '/pages/profile/index' })
  },
  goConstitution(e) {
    const t = e.currentTarget.dataset.type || ''
    wx.switchTab({
      url: '/pages/recipes/index',
      success: (nav) => {
        if (nav && nav.eventChannel && nav.eventChannel.emit) nav.eventChannel.emit('filter', { constitution: t })
      }
    })
  },
  goCategory(e) {
    const tag = e.currentTarget.dataset.tag || ''
    wx.switchTab({
      url: '/pages/recipes/index',
      success: (nav) => {
        if (nav && nav.eventChannel && nav.eventChannel.emit) nav.eventChannel.emit('filter', { tag })
      }
    })
  },
  goRecipeDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pkg-detail/pages/recipe-detail/index?id=${id}` })
  }
})
