const { request } = require('../../utils/request')
Page({
  data: { gender: '', age: '', openid: '' },
  onLoad() {
    request({ url: '/api/health/check' }).catch(() => { wx.showToast({ title: '云服务不可用', icon: 'none' }) })
  },
  onProfileRadio(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [field]: value })
  },
  onStart() {
    const { gender, age } = this.data
    if (!gender || !age) { wx.showToast({ title: '请完善基础信息', icon: 'none' }); return }
    const go = (code) => {
      const data = code ? { code } : {}
      request({ url: '/api/auth/wx-login', method: 'POST', data })
        .then((res) => {
          const openid = res && res.openid ? res.openid : res && res.data && res.data.openid ? res.data.openid : ''
          if (!openid) { wx.showToast({ title: '登录失败', icon: 'none' }); return }
          this.setData({ openid })
          wx.setStorageSync('openid', openid)
          const navToAssess = () => {
            wx.navigateTo({
              url: '/pages/assessment/index',
              success: (nav) => { nav.eventChannel.emit('profile', { gender, age, openid }) }
            })
          }
          if (wx.getUserProfile) {
            wx.getUserProfile({
              desc: '用于完善资料',
              success: (info) => { try { wx.setStorageSync('userProfile', info.userInfo) } catch (_) {} },
              complete: navToAssess
            })
          } else { navToAssess() }
        })
        .catch(() => { wx.showToast({ title: '登录失败', icon: 'none' }) })
    }
    if (wx && wx.login) {
      wx.login({
        success: (resp) => { const code = resp && resp.code ? resp.code : ''; go(code) },
        fail: () => { go('') }
      })
    } else { go('') }
  }
})
