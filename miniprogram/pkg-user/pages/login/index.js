const { request } = require('../../../api/request')
const { resolveImageUrl } = require('../../../utils/image')
const LOGIN_LOGO_FILE_ID = 'cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/icons/logo-yy.webp'
Page({
  data: {
    defaultAvatar: 'https://res.wx.qq.com/op_res/Y3uW5mC3E-placeholder-avatar.png',
    logoError: false,
    logoSrc: ''
  },
  async onLoad(options) {
    const redirect = decodeURIComponent(options && options.redirect ? options.redirect : '')
    const isTab = options && options.tab === '1'
    this._redirect = redirect
    this._isTab = isTab
    const logoSrc = await resolveImageUrl(LOGIN_LOGO_FILE_ID)
    this.setData({ logoSrc: logoSrc || '' })
  },
  onLogoError() {
    this.setData({ logoError: true })
  },
  doLogin() {
    wx.showLoading({ title: '登录中' })
    wx.login({
      success: (loginRes) => {
        const code = loginRes && loginRes.code ? loginRes.code : ''
        if (!code) { wx.hideLoading(); wx.showToast({ title: '登录凭证获取失败', icon: 'none' }); return }
        request({ url: '/api/auth/wx-login', method: 'POST', data: { code } })
          .then((auth) => {
            const openid = auth && auth.openid ? auth.openid : ''
            const syncUserToCloud = (userDoc) => {
              if (!openid || !wx || !wx.cloud || !wx.cloud.database) return
              try {
                const db = wx.cloud.database()
                db.collection('users').doc(openid).update({ data: userDoc })
                  .catch(() => db.collection('users').doc(openid).set({ data: userDoc }).catch(() => { void 0 }))
              } catch (_) { void 0 }
            }
            const finishLogin = (profile, syncProfile) => {
              const userProfile = profile && typeof profile === 'object' ? profile : {}
              try {
                if (openid) wx.setStorageSync('openid', openid)
                wx.setStorageSync('isLoggedIn', true)
                if (syncProfile) wx.setStorageSync('userProfile', userProfile)
              } catch (_) { void 0 }
              const userDoc = { openid, updatedAt: Date.now() }
              if (syncProfile) {
                userDoc.nickName = userProfile.nickName || ''
                userDoc.avatarUrl = userProfile.avatarUrl || ''
              }
              syncUserToCloud(userDoc)
              wx.hideLoading()
              wx.showToast({ title: '登录成功', icon: 'success' })
              const url = this._redirect || ''
              if (this._isTab && url) { wx.switchTab({ url }); return }
              if (url) { wx.navigateTo({ url }); return }
              wx.switchTab({ url: '/pages/home/index' })
            }
            wx.hideLoading()
            wx.showModal({
              title: '授权提示',
              content: '是否同意授权昵称和头像，用于完善个人资料展示？',
              confirmText: '同意',
              cancelText: '不同意',
              success: (modalRes) => {
                if (modalRes && modalRes.confirm && wx && wx.getUserProfile) {
                  wx.showLoading({ title: '登录中' })
                  wx.getUserProfile({
                    desc: '用于完善个人资料',
                    success: (res) => {
                      const profile = res && res.userInfo ? res.userInfo : {}
                      finishLogin(profile, true)
                    },
                    fail: () => { finishLogin({}, false) }
                  })
                  return
                }
                finishLogin({}, false)
              },
              fail: () => { finishLogin({}, false) }
            })
          })
          .catch(() => { wx.hideLoading(); wx.showToast({ title: '云登录失败', icon: 'none' }) })
      },
      fail: () => { wx.hideLoading(); wx.showToast({ title: '系统登录失败', icon: 'none' }) }
    })
  }
})
