const { PAGES } = require('../../../constants/index')
Page({
  data: {},
  onLoad() {
    if (this.getOpenerEventChannel) {
      const ec = this.getOpenerEventChannel()
      if (ec && ec.on) {
        ec.on('profile', (data) => { this.profile = data })
      }
    }
  },
  onAck() {
    wx.navigateTo({
      url: PAGES.ASSESSMENT,
      success: (nav) => {
        if (this.profile && nav && nav.eventChannel && nav.eventChannel.emit) {
          nav.eventChannel.emit('profile', this.profile)
        }
      }
    })
  }
})
