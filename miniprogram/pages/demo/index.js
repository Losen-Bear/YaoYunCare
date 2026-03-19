const { request } = require('../../utils/request')
Page({
  data: { result: {}, recipesList: [] },
  onLoad() {
    request({ url: '/api/health/check' })
      .then(() => { console.log('[demo] health ok') })
      .catch((e) => { console.error('[demo] health fail', e); wx.showToast({ title: '连通性异常', icon: 'none' }) })
  },
  runDemo() {
    console.log('[demo] runDemo clicked')
    const payload = { answers: { 8: 1, 9: 1, 11: 1 } }
    request({ url: '/api/constitution/judge-with-recipes', method: 'POST', data: payload })
      .then((res) => {
        console.log('[demo] judge-with-recipes res', res)
        const result = res && res.result ? res.result : {}
        const recipes = Array.isArray(res && res.merged) ? res.merged : []
        this.setData({ result, recipesList: recipes })
        if (Array.isArray(recipes) && recipes.length > 0) {
          wx.showToast({ title: '获取成功', icon: 'success' })
        } else {
          wx.showToast({ title: '无推荐数据', icon: 'none' })
        }
      })
      .catch((err) => { console.error('[demo] judge-with-recipes error', err); wx.showToast({ title: '请求失败', icon: 'none' }) })
  }
})
