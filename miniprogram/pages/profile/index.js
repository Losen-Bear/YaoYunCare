Page({
  data: {
    profile: { nickName: '', avatarUrl: '' },
    defaultAvatar: 'https://res.wx.qq.com/op_res/Y3uW5mC3E-placeholder-avatar.png',
    archive: { main: '', timeText: '' },
    favorites: [],
    history: []
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      })
    }
    try {
      const logged = !!wx.getStorageSync('isLoggedIn')
      if (!logged) {
        wx.navigateTo({ url: '/pkg-user/pages/login/index?redirect=%2Fpages%2Fprofile%2Findex&tab=1' })
        return
      }
    } catch (_) { return }
    let p = {}
    try { p = wx.getStorageSync('userProfile') || {} } catch (_) {}
    const profile = { nickName: p.nickName || '', avatarUrl: p.avatarUrl || '' }
    let archive = { main: '', timeText: '' }
    try {
      const last = wx.getStorageSync('lastJudgeResult') || {}
      if (last.result && last.result.mainConstitution) {
        const t = last.time || Date.now()
        archive = { main: last.result.mainConstitution, timeText: this.formatTime(t) }
      }
    } catch (_) {}
    let favorites = []
    try { favorites = wx.getStorageSync('favorites') || [] } catch (_) {}
    let history = []
    try {
      const his = wx.getStorageSync('judgeHistory') || []
      history = his.map((x) => ({ main: x.result?.mainConstitution || '', timeText: this.formatTime(x.time || Date.now()) }))
    } catch (_) {}
    this.setData({ profile, archive, favorites, history })
  },
  formatTime(ts) {
    const d = new Date(ts)
    const m = d.getMonth() + 1
    const day = d.getDate()
    const hh = d.getHours()
    const mm = d.getMinutes()
    return `${m}/${day} ${hh}:${mm < 10 ? '0' + mm : mm}`
  },
  viewReport() {
    try {
      const last = wx.getStorageSync('lastJudgeResult') || {}
      const result = last.result || {}
      const recipes = last.recipes || []
      const main = result.mainConstitution || ''
      const types = Array.isArray(result.primary) && result.primary.length ? result.primary : (main ? main.split('+') : [])
      wx.navigateTo({
        url: `/pkg-user/pages/constitution/index?main=${encodeURIComponent(main)}&types=${encodeURIComponent(types.join(','))}`,
        success: (nav) => { if (nav && nav.eventChannel && nav.eventChannel.emit) nav.eventChannel.emit('judge', { result, recipes }) }
      })
    } catch (_) { wx.showToast({ title: '无报告', icon: 'none' }) }
  },
  retest() {
    wx.navigateTo({ url: '/pkg-assessment/pages/notice/index' })
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pkg-detail/pages/recipe-detail/index?id=${id}` })
  },
  menu(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'feedback') { wx.showToast({ title: '请在意见反馈中填写', icon: 'none' }); return }
    wx.showToast({ title: '内容准备中', icon: 'none' })
  }
})
