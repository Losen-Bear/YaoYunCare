const { getRecipeImage, getRecipeCloudWebpByName, defaultCover, normalizeImageUrl, resolveImageUrl, resolveImageUrls, isSignedCloudTempUrl, toCloudFileID } = require('../../utils/image')
const { request } = require('../../api/request')
const HOME_LOGO_FILE_ID = 'cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/icons/logo-yy.webp'
const HOME_BANNERS = [
  { fileID: 'cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/home/main-assessment.webp', text: '测体质，领你的专属药膳' },
  { fileID: 'cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/home/main-season.webp', text: '春季养肝 · 祛湿健脾' },
  { fileID: 'cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/home/main-today.webp', text: '今日宜吃：山药、红枣、茯苓' }
]
Page({
  data: {
    logoSrc: '',
    logoError: false,
    banners: HOME_BANNERS.map((it) => ({ src: '', text: it.text })),
    swiperHeight: 420,
    todayRecommend: [],
    constitutions: ['气虚', '阴虚', '阳虚', '痰湿', '湿热', '血瘀', '气郁', '特禀', '平和'],
    hotCategories: ['补气', '补血', '祛湿', '清热', '安神', '美容', '养胃'],
    defaultCover
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
  },
  onLoad() {
    this.resolveStaticImages()
    this.loadTodayRecommend()
  },
  async resolveStaticImages() {
    const urls = [HOME_LOGO_FILE_ID].concat(HOME_BANNERS.map((item) => item.fileID))
    const resolved = await resolveImageUrls(urls)
    const logoSrc = resolved[0] || ''
    const nextBanners = HOME_BANNERS.map((item, index) => ({
      ...item,
      src: resolved[index + 1] || ''
    }))
    this.setData({ logoSrc, logoError: !logoSrc, banners: nextBanners })
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
  async loadTodayRecommend() {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const key = `${y}-${m}-${d}`
    const pickOne = async (source) => {
      const list = Array.isArray(source) ? source.filter((it) => it && it.name) : []
      if (list.length === 0) {
        this.setData({ todayRecommend: [] })
        return
      }
      const idx = Math.floor(Math.random() * list.length)
      const item = { ...list[idx] }
      const rawUrl = normalizeImageUrl(item.image_url || '')
      const normalizedUrl = isSignedCloudTempUrl(rawUrl)
        ? (() => {
          const cloudID = toCloudFileID(rawUrl)
          return (cloudID && cloudID.startsWith('cloud://')) ? cloudID : getRecipeImage(item.name || '')
        })()
        : (rawUrl && typeof rawUrl === 'string' && rawUrl.length > 0 ? rawUrl : getRecipeImage(item.name || ''))
      item.image_url = await resolveImageUrl(normalizedUrl)
      this.setData({ todayRecommend: [item] })
      try { wx.setStorageSync('dailyRecommendRecipe', { date: key, item }) } catch (_) { return }
    }
    try {
      const cached = wx.getStorageSync('dailyRecommendRecipe') || {}
      if (cached && cached.date === key && cached.item) {
        const item = { ...cached.item }
        const url = normalizeImageUrl(item.image_url || '')
        item.image_url = await resolveImageUrl(
          isSignedCloudTempUrl(url)
            ? (() => {
              const cloudID = toCloudFileID(url)
              return (cloudID && cloudID.startsWith('cloud://')) ? cloudID : getRecipeImage(item.name || '')
            })()
            : (url && typeof url === 'string' && url.length > 0 ? url : getRecipeImage(item.name || ''))
        )
        this.setData({ todayRecommend: [item] })
        return
      }
    } catch (_) { void 0 }
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
  async onRecipeImageError(e) {
    const idx = Number(e.currentTarget.dataset.index || 0)
    const item = this.data.todayRecommend[idx] || {}
    const cur = item.image_url || ''
    const name = item.name || ''
    if (!cur || cur === this.data.defaultCover) {
      return
    }
    if (cur.endsWith('.png') && !cur.startsWith('http') && !cur.startsWith('cloud://')) {
      const fallback = getRecipeCloudWebpByName(name)
      const resolved = await resolveImageUrl(fallback || this.data.defaultCover)
      this.setData({ [`todayRecommend[${idx}].image_url`]: resolved || this.data.defaultCover })
      return
    }
    const resolved = await resolveImageUrl(this.data.defaultCover)
    this.setData({ [`todayRecommend[${idx}].image_url`]: resolved || this.data.defaultCover })
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
