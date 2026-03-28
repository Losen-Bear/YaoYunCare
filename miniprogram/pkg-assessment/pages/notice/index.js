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
      url: '/pkg-assessment/pages/assessment/index',
      success: (nav) => {
        if (this.profile && nav && nav.eventChannel && nav.eventChannel.emit) {
          nav.eventChannel.emit('profile', this.profile)
        }
      }
    })
  }
})
