const { request } = require('../../utils/request')
const QUESTION_TEXTS = [
  { id: 5, text: '您是否经常神疲乏力，少气懒言，稍动即累？' },
  { id: 6, text: '您是否容易自汗，活动后出汗明显增多？' },
  { id: 7, text: '您是否经常头晕心悸，食欲不振，大便偶有稀溏？' },
  { id: 8, text: '您是否畏寒怕冷，手脚冰凉，秋冬季节更明显？' },
  { id: 9, text: '您是否大便溏薄，小便清长，夜尿次数偏多？' },
  { id: 10, text: '您是否腰膝冷痛、面色苍白，喜欢喝热水，吃温热食物？' },
  { id: 11, text: '您是否经常口干咽燥，唇舌发干，总想喝水？' },
  { id: 12, text: '您是否手足心热，夜间潮热，偶尔盗汗？' },
  { id: 13, text: '您是否头晕耳鸣，大便干结，睡眠时容易口干？' },
  { id: 14, text: '您是否身体沉重，容易困倦，晨起浑身发懒不想动？' },
  { id: 15, text: '您是否口中黏腻、舌苔厚腻，偶尔痰多且黏稠？' },
  { id: 16, text: '您是否胸闷腹胀，大便黏滞粘马桶，体型偏胖？' },
  { id: 17, text: '您是否面部/皮肤出油多，容易长痘、长痤疮？' },
  { id: 18, text: '您是否口苦口臭、小便黄赤，排尿时有轻微灼热感？' },
  { id: 19, text: '您是否大便黏滞不畅，解不尽，夏季身体更易闷热？' },
  { id: 20, text: '您是否面色暗沉，有黑眼圈，面部易长色斑？' },
  { id: 21, text: '您是否身体某处有固定刺痛感，按压后痛感加重？' },
  { id: 22, text: '您的对应症状是否符合（女性：痛经、经血有血块；男性：身体局部瘀青难消）？' },
  { id: 23, text: '您是否情绪低落，容易焦虑烦躁，多愁善感？' },
  { id: 24, text: '您是否经常胸闷不舒，总喜欢叹气来缓解？' },
  { id: 25, text: '您是否胁肋胀痛、失眠多梦，情绪差时食欲不振？' },
  { id: 26, text: '您是否容易过敏（花粉、尘螨、食物、药物等）？' },
  { id: 27, text: '您是否皮肤容易瘙痒，起荨麻疹或湿疹，换季时加重？' },
  { id: 28, text: '您是否经常打喷嚏、鼻流清涕，无感冒时也会发生？' }
]
Page({
  data: {
    qList: [],
    answers: {},
    result: {},
    recipesList: [],
    openid: '',
    profile: { gender: '', age: '', diet: [], exercise: '' }
  },
  onLoad() {
    this.setData({ qList: QUESTION_TEXTS })
    try {
      const storedOpenid = wx.getStorageSync('openid') || ''
      if (storedOpenid) this.setData({ openid: storedOpenid })
    } catch (_) {}
    if (this.getOpenerEventChannel) {
      const ec = this.getOpenerEventChannel()
      if (ec && ec.on) {
        ec.on('profile', (data) => {
          const p = data || {}
          const profile = {
            gender: p.gender || '',
            age: p.age || '',
            diet: Array.isArray(p.diet) ? p.diet : [],
            exercise: p.exercise || ''
          }
          this.setData({ profile, openid: p.openid || '' })
        })
      }
    }
    request({ url: '/api/health/check' }).catch(() => { wx.showToast({ title: '云服务不可用', icon: 'none' }) })
  },
  onRadioChange(e) {
    const qid = Number(e.currentTarget.dataset.qid)
    const val = e.detail.value
    const map = { ...this.data.answers, [qid]: val === '1' }
    this.setData({ answers: map })
  },
  onProfileRadio(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    const p = { ...this.data.profile, [field]: value }
    this.setData({ profile: p })
  },
  onProfileCheckbox(e) {
    const value = e.detail.value || []
    const p = { ...this.data.profile, diet: value }
    this.setData({ profile: p })
  },
  onReset() {
    this.setData({ answers: {}, result: {}, recipesList: [], profile: { gender: '', age: '', diet: [], exercise: '' } })
  },
  onSubmit() {
    if (!this.data.openid) { wx.showToast({ title: '请先登录', icon: 'none' }); return }
    const payload = { answers: this.data.answers }
    request({ url: '/api/constitution/judge-with-recipes', method: 'POST', data: payload })
      .then((res) => {
        const result = res && res.result ? res.result : {}
        const recipes = Array.isArray(res && res.merged) ? res.merged : []
        this.setData({ result, recipesList: recipes })
        const main = result && result.mainConstitution ? result.mainConstitution : ''
        const types = Array.isArray(result && result.primary) && result.primary.length > 0 ? result.primary : (main ? main.split('+') : [])
        const to = `/pages/constitution/index?main=${encodeURIComponent(main)}&types=${encodeURIComponent(types.join(','))}`
        if (Array.isArray(recipes) && recipes.length > 0) wx.showToast({ title: '获取成功', icon: 'success' })
        else wx.showToast({ title: '暂无推荐', icon: 'none' })
        wx.navigateTo({
          url: to,
          success: (nav) => {
            if (nav && nav.eventChannel && nav.eventChannel.emit) {
              nav.eventChannel.emit('judge', { result, recipes })
            }
          }
        })
      })
      .catch(() => { wx.showToast({ title: '评估失败', icon: 'none' }) })
  }
})
