const { getStorage } = require('../../api/request')
const { STORAGE_KEYS, PAGES } = require('../../constants/index')
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
      const logged = !!getStorage(STORAGE_KEYS.IS_LOGGED_IN)
      if (!logged) {
        wx.navigateTo({ url: `${PAGES.LOGIN}?redirect=${encodeURIComponent(PAGES.PROFILE)}&tab=1` })
        return
      }
    } catch (_) { return }
    const p = getStorage(STORAGE_KEYS.USER_PROFILE) || {}
    const profile = { nickName: p.nickName || '', avatarUrl: p.avatarUrl || '' }
    let archive = { main: '', timeText: '' }
    try {
      const last = getStorage(STORAGE_KEYS.LAST_JUDGE_RESULT) || {}
      if (last.result && last.result.mainConstitution) {
        const t = last.time || Date.now()
        archive = { main: last.result.mainConstitution, timeText: this.formatTime(t) }
      }
    } catch (err) { void err }
    const favorites = getStorage(STORAGE_KEYS.FAVORITES) || []
    let history = []
    try {
      const his = getStorage(STORAGE_KEYS.JUDGE_HISTORY) || []
      history = his.map((x) => ({ main: x.result?.mainConstitution || '', timeText: this.formatTime(x.time || Date.now()) }))
    } catch (err) { void err }
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
      const last = getStorage(STORAGE_KEYS.LAST_JUDGE_RESULT) || {}
      const result = last.result || {}
      const recipes = last.recipes || []
      const main = result.mainConstitution || ''
      const types = Array.isArray(result.primary) && result.primary.length ? result.primary : (main ? main.split('+') : [])
      wx.navigateTo({
        url: `${PAGES.CONSTITUTION}?main=${encodeURIComponent(main)}&types=${encodeURIComponent(types.join(','))}`,
        success: (nav) => { if (nav && nav.eventChannel && nav.eventChannel.emit) nav.eventChannel.emit('judge', { result, recipes }) }
      })
    } catch (_) { wx.showToast({ title: '无报告', icon: 'none' }) }
  },
  retest() {
    wx.navigateTo({ url: PAGES.ASSESSMENT_NOTICE })
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `${PAGES.RECIPE_DETAIL}?id=${id}` })
  },
  menu(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'feedback') { wx.showToast({ title: '请在意见反馈中填写', icon: 'none' }); return }
    wx.showToast({ title: '内容准备中', icon: 'none' })
  }
})
