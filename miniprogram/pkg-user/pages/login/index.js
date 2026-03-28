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
            wx.getUserProfile({
              desc: '用于完善个人资料',
              success: (res) => {
                const profile = res && res.userInfo ? res.userInfo : {}
                try {
                  if (openid) wx.setStorageSync('openid', openid)
                  wx.setStorageSync('userProfile', profile)
                  wx.setStorageSync('isLoggedIn', true)
                } catch (_) { void 0 }
                if (openid && wx && wx.cloud && wx.cloud.database) {
                  try {
                    const db = wx.cloud.database()
                    db.collection('users').doc(openid).set({
                      data: {
                        openid,
                        nickName: profile.nickName || '',
                        avatarUrl: profile.avatarUrl || '',
                        updatedAt: Date.now()
                      }
                    }).catch(() => { void 0 })
                  } catch (_) { void 0 }
                }
                wx.hideLoading()
                wx.showToast({ title: '登录成功', icon: 'success' })
                const url = this._redirect || ''
                if (this._isTab && url) { wx.switchTab({ url }); return }
                if (url) { wx.navigateTo({ url }); return }
                wx.switchTab({ url: '/pages/home/index' })
              },
              fail: () => { wx.hideLoading(); wx.showToast({ title: '已取消授权', icon: 'none' }) }
            })
          })
          .catch(() => { wx.hideLoading(); wx.showToast({ title: '云登录失败', icon: 'none' }) })
      },
      fail: () => { wx.hideLoading(); wx.showToast({ title: '系统登录失败', icon: 'none' }) }
    })
  }
})
