const { request } = require('../../utils/request')
Page({
  data: {
    banners: ['测体质，领你的专属药膳', '春季养肝 · 祛湿健脾', '今日宜吃：山药、红枣、茯苓'],
    todayRecommend: [],
    constitutions: ['气虚', '阴虚', '阳虚', '痰湿', '湿热', '血瘀', '气郁', '特禀', '平和'],
    hotCategories: ['补气', '补血', '祛湿', '清热', '安神', '美容', '养胃']
  },
  onLoad() {
    this.loadTodayRecommend()
  },
  loadTodayRecommend() {
    let payload = {}
    try {
      const lastAnswers = wx.getStorageSync('lastAnswers') || {}
      if (lastAnswers && typeof lastAnswers === 'object') payload = { answers: lastAnswers }
    } catch (_) {}
    request({ url: '/api/constitution/judge-with-recipes', method: 'POST', data: payload, showLoading: false })
      .then((res) => {
        const merged = Array.isArray(res && res.merged) ? res.merged : []
        const list = merged.map((x, i) => ({ id: x.id || i, name: x.name || '', constitution: x.constitution || '', effect: x.effect || '', video_url: x.video_url || '' }))
        const top3 = list.slice(0, 3)
        this.setData({ todayRecommend: top3 })
      })
      .catch(() => {
        const demo = [
          { id: 'd1', name: '黄芪党参鸡汤', constitution: '气虚', effect: '益气健脾' },
          { id: 'd2', name: '薏米赤小豆粥', constitution: '痰湿', effect: '健脾祛湿' },
          { id: 'd3', name: '百合莲子羹', constitution: '阴虚', effect: '养阴安神' }
        ]
        this.setData({ todayRecommend: demo })
      })
  },
  goAssessment() {
    wx.navigateTo({ url: '/pages/assessment/index' })
  },
  goMyRecipes() {
    wx.switchTab({ url: '/pages/recipes/index' })
  },
  goSeasonGuide() {
    wx.showToast({ title: '敬请期待', icon: 'none' })
  },
  goMessages() {
    wx.showToast({ title: '暂无消息', icon: 'none' })
  },
  goProfile() {
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
    wx.navigateTo({ url: `/pages/recipe-detail/index?id=${id}` })
  }
})
