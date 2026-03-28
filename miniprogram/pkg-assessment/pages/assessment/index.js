const { request } = require('../../api/request')
const BANK = [
  { id: 3, type: 'multi', text: '请问您的日常饮食习惯（可多选）？', options: ['偏辛辣', '偏油腻', '偏生冷', '偏甜腻', '无明显偏好'] },
  { id: 4, type: 'single', text: '请问您的每周运动频率？', options: ['几乎不运动', '1-2次', '3-5次', '每天运动'] },
  { id: 5, type: 'yn', text: '您是否经常神疲乏力，少气懒言，稍动即累？' },
  { id: 6, type: 'yn', text: '您是否容易自汗，活动后出汗明显增多？' },
  { id: 7, type: 'yn', text: '您是否经常头晕心悸，食欲不振，大便偶有稀溏？' },
  { id: 8, type: 'yn', text: '您是否畏寒怕冷，手脚冰凉，秋冬季节更明显？' },
  { id: 9, type: 'yn', text: '您是否大便溏薄，小便清长，夜尿次数偏多？' },
  { id: 10, type: 'yn', text: '您是否腰膝冷痛、面色苍白，喜欢喝热水，吃温热食物？' },
  { id: 11, type: 'yn', text: '您是否经常口干咽燥，唇舌发干，总想喝水？' },
  { id: 12, type: 'yn', text: '您是否手足心热，夜间潮热，偶尔盗汗？' },
  { id: 13, type: 'yn', text: '您是否头晕耳鸣，大便干结，睡眠时容易口干？' },
  { id: 14, type: 'yn', text: '您是否身体沉重，容易困倦，晨起浑身发懒不想动？' },
  { id: 15, type: 'yn', text: '您是否口中黏腻、舌苔厚腻，偶尔痰多且黏稠？' },
  { id: 16, type: 'yn', text: '您是否胸闷腹胀，大便黏滞粘马桶，体型偏胖？' },
  { id: 17, type: 'yn', text: '您是否面部/皮肤出油多，容易长痘、长痤疮？' },
  { id: 18, type: 'yn', text: '您是否口苦口臭、小便黄赤，排尿时有轻微灼热感？' },
  { id: 19, type: 'yn', text: '您是否大便黏滞不畅，解不尽，夏季身体更易闷热？' },
  { id: 20, type: 'yn', text: '您是否面色暗沉，有黑眼圈，面部易长色斑？' },
  { id: 21, type: 'yn', text: '您是否身体某处有固定刺痛感，按压后痛感加重？' },
  { id: 22, type: 'yn', text: '您的对应症状是否符合（女性：痛经、经血有血块；男性：身体局部瘀青难消）？' },
  { id: 23, type: 'yn', text: '您是否情绪低落，容易焦虑烦躁，多愁善感？' },
  { id: 24, type: 'yn', text: '您是否经常胸闷不舒，总喜欢叹气来缓解？' },
  { id: 25, type: 'yn', text: '您是否胁肋胀痛、失眠多梦，情绪差时食欲不振？' },
  { id: 26, type: 'yn', text: '您是否容易过敏（花粉、尘螨、食物、药物等）？' },
  { id: 27, type: 'yn', text: '您是否皮肤容易瘙痒，起荨麻疹或湿疹，换季时加重？' },
  { id: 28, type: 'yn', text: '您是否经常打喷嚏、鼻流清涕，无感冒时也会发生？' }
]
Page({
  data: {
    qList: [],
    answersYN: {},
    profile: { diet: [], exercise: '' },
    cur: 0,
    total: 20,
    allAnswered: false,
    openid: ''
  },
  stopSwiper() {},
  onLoad() {
    const pick = [3,4,6,7,8,9,11,12,14,15,17,18,20,21,23,24,26,27,10,13]
    const list = pick.map((id) => BANK.find((q) => q.id === id)).filter(Boolean)
    this.setData({ qList: list, total: list.length })
    try {
      const storedOpenid = wx.getStorageSync('openid') || ''
      if (storedOpenid) this.setData({ openid: storedOpenid })
    } catch (_) {}
    if (!this.data.openid && wx && wx.login) {
      wx.login({
        success: (resp) => {
          const code = resp && resp.code ? resp.code : ''
          if (code) {
            const { request } = require('../../api/request')
            request({ url: '/api/auth/wx-login', method: 'POST', data: { code }, showLoading: false })
              .then((res) => {
                const openid = res && res.openid ? res.openid : res && res.data && res.data.openid ? res.data.openid : ''
                if (openid) { this.setData({ openid }); try { wx.setStorageSync('openid', openid) } catch (_) {} }
              })
              .catch(() => {})
          }
        }
      })
    }
    request({ url: '/api/health/check', showLoading: false }).catch(() => { wx.showToast({ title: '云服务不可用', icon: 'none' }) })
  },
  onSwiperChange(e) {
    const idx = e.detail.current || 0
    this.setData({ cur: idx })
  },
  onYN(e) {
    const qid = Number(e.currentTarget.dataset.qid)
    const val = String(e.detail.value) === '1'
    const map = { ...this.data.answersYN, [qid]: val }
    this.setData({ answersYN: map })
    this.recalc()
    this.autoNext()
  },
  onSingle(e) {
    const v = e.detail.value || ''
    const p = { ...this.data.profile, exercise: v }
    this.setData({ profile: p })
    this.recalc()
    this.autoNext()
  },
  onMulti(e) {
    const arr = e.detail.value || []
    const p = { ...this.data.profile, diet: arr }
    this.setData({ profile: p })
    this.recalc()
  },
  autoNext() {
    setTimeout(() => {
      if (this.data.cur < this.data.total - 1) {
        this.setData({ cur: this.data.cur + 1 })
      }
    }, 400)
  },
  recalc() {
    const list = this.data.qList
    let answered = 0
    for (const it of list) {
      if (it.type === 'yn' && Object.prototype.hasOwnProperty.call(this.data.answersYN, it.id)) answered += 1
      if (it.type === 'single' && this.data.profile.exercise) answered += 1
      if (it.type === 'multi' && Array.isArray(this.data.profile.diet) && this.data.profile.diet.length > 0) answered += 1
    }
    const allAnswered = answered >= this.data.total
    this.setData({ allAnswered })
  },
  goBack() {
    wx.navigateBack({ delta: 1 })
  },
  onSubmit() {
    if (!this.data.openid) { wx.showToast({ title: '请先登录', icon: 'none' }); return }
    if (!this.data.allAnswered) { wx.showToast({ title: '请完成所有题目', icon: 'none' }); return }
    const payload = { answers: this.data.answersYN }
    try { wx.setStorageSync('lastAnswers', this.data.answersYN) } catch (_) {}
    request({ url: '/api/constitution/judge-with-recipes', method: 'POST', data: payload })
      .then((res) => {
        const result = res && res.result ? res.result : {}
        const recipes = Array.isArray(res && res.merged) ? res.merged : []
        const main = result && result.mainConstitution ? result.mainConstitution : ''
        const types = Array.isArray(result && result.primary) && result.primary.length > 0 ? result.primary : (main ? main.split('+') : [])
        try {
          wx.setStorageSync('lastJudgeResult', { result, recipes, time: Date.now() })
          const history = wx.getStorageSync('judgeHistory') || []
          history.unshift({ result, time: Date.now() })
          wx.setStorageSync('judgeHistory', history.slice(0, 20))
        } catch (_) {}

        const infos = {
          平和质: '体形匀称，精力充沛，面色红润，情绪稳定。建议保持规律作息、均衡饮食、适量运动，继续巩固良好状态。',
          气虚质: '元气不足，易疲劳，少气懒言，动则汗出，抵抗力偏弱。多与劳累过度、饮食不规律相关，宜健脾益气，规律作息。',
          阳虚质: '阳气不足，畏寒怕冷，手脚冰凉，喜温喜热，大便溏薄。多与先天不足或过食生冷相关，宜温阳祛寒，少食生冷。',
          阴虚质: '阴液不足，口干咽燥，手足心热，夜间盗汗，大便干结。多与熬夜劳心、过食辛辣相关，宜滋阴润燥，早睡少熬夜。',
          痰湿质: '痰湿内停，体沉乏力，困倦黏腻，口中黏腻，大便粘滞。多与嗜油腻、缺乏运动相关，宜化痰祛湿，清淡饮食。',
          湿热质: '湿热内蕴，面部出油，口苦口臭，小便黄赤，大便黏滞。多与湿热环境或嗜辛辣油炸相关，宜清热利湿，少辛辣油腻。',
          血瘀质: '血行不畅，面色晦暗，有色斑，疼痛固定。女性多痛经经血有块。多与久坐久立、情绪郁结相关，宜活血通络，适量运动。',
          气郁质: '气机郁滞，情绪低落或烦躁，胸闷善太息，睡眠多梦。多与精神压力大相关，宜疏肝解郁，规律运动与情绪管理。',
          特禀质: '禀赋特殊，易过敏，皮肤瘙痒或荨麻疹，换季明显。多与遗传相关，宜避敏原，增强防护，遵从个体化调理。'
        }
        
        let mainType = main;
        if (main && main.includes('+')) {
          mainType = main.split('+')[0];
        }
        const infoText = infos[mainType] || '您的体质详情请查看膳食食谱。';

        wx.showModal({
          title: `检测结果：${main}`,
          content: infoText,
          cancelText: '返回',
          confirmText: '膳食食谱',
          success: (modalRes) => {
            if (modalRes.confirm) {
              const to = `/pkg-user/pages/constitution/index?main=${encodeURIComponent(main)}&types=${encodeURIComponent(types.join(','))}`
              wx.navigateTo({
                url: to,
                success: (nav) => {
                  if (nav && nav.eventChannel && nav.eventChannel.emit) {
                    nav.eventChannel.emit('judge', { result, recipes })
                  }
                }
              })
            } else if (modalRes.cancel) {
              wx.switchTab({ url: '/pages/home/index' })
            }
          }
        })
      })
      .catch(() => { wx.showToast({ title: '评估失败', icon: 'none' }) })
  }
})
