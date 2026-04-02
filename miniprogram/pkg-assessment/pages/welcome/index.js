const { request, ensureOpenid, setStorage } = require('../../../api/request')
const { API_ROUTES, STORAGE_KEYS, PAGES } = require('../../../constants/index')
Page({
  data: { gender: '', age: '', openid: '' },
  onLoad() {
    request({ url: API_ROUTES.HEALTH_CHECK }).catch(() => { wx.showToast({ title: '云服务不可用', icon: 'none' }) })
  },
  onProfileRadio(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [field]: value })
  },
  onStart() {
    const { gender, age } = this.data
    if (!gender || !age) { wx.showToast({ title: '请完善基础信息', icon: 'none' }); return }
    ensureOpenid()
      .then((openid) => {
        if (!openid) { wx.showToast({ title: '登录失败', icon: 'none' }); return }
        this.setData({ openid })
        const navToAssess = () => {
          wx.navigateTo({
            url: PAGES.ASSESSMENT_NOTICE,
            success: (nav) => { nav.eventChannel.emit('profile', { gender, age, openid }) }
          })
        }
        if (wx.getUserProfile) {
          wx.getUserProfile({
            desc: '用于完善资料',
            success: (info) => { setStorage(STORAGE_KEYS.USER_PROFILE, info.userInfo) },
            complete: navToAssess
          })
        } else { navToAssess() }
      })
      .catch(() => { wx.showToast({ title: '登录失败', icon: 'none' }) })
  }
})
