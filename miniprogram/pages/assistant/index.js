const { normalizeImageUrl, resolveImageUrls } = require('../../utils/image')
const ENTRY_FILE_ID = 'cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/assistant/assistant-main.webp'
const SONGNIAN_BG_FILE_ID = 'cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/assistant/songnian-bg.webp'
const QINGHE_BG_FILE_ID = 'cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/assistant/qinghe-bg.webp'
const SONGNIAN_AVATAR_FILE_ID = 'cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/assistant/songnian.webp'
const QINGHE_AVATAR_FILE_ID = 'cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/assistant/qinghe.webp'
const CHAT_SCRIPT = {
  '你好': {
    songnian: '您好，我是松年，专注温补调养、温而不燥，专为虚寒体质定制温和药膳。',
    qinghe: '我是青禾，主打清润轻养、清而不寒，擅长为燥热体质搭配舒养方案～告诉我你的体质，即刻为你精准推荐。'
  },
  '春季养生怎么吃': {
    songnian: '虚寒之人春季需扶阳养肝，可用黄芪、红枣、山药炖汤，温补固气，顺应春生之气。',
    qinghe: '燥热体质春季易升肝火，推荐雪梨百合汤、枸杞菊花茶，清润降燥、养肝明目，温和不伤身。'
  },
  '经常熬夜该怎么补': {
    songnian: '虚寒体质熬夜最伤气血，易畏寒乏力，可用桂圆、红枣、枸杞温养气血、安神复元。',
    qinghe: '燥热体质熬夜易生虚火、口干咽燥，用麦冬、菊花、莲子清心降火、滋养阴液。'
  },
  '脾胃不好吃一点就胀': {
    songnian: '脾胃虚寒者运化无力，常喝小米山药粥、陈皮生姜茶，温脾暖胃、行气消胀。',
    qinghe: '胃热积食者易胀气上火，推荐南瓜小米粥、山楂陈皮水，清润助消化、和胃降浊。'
  },
  '湿气重总觉得累': {
    songnian: '寒湿困体易乏累，用茯苓、陈皮、生姜温阳祛湿、健脾行气，身体轻快更有精神。',
    qinghe: '湿热黏滞易烦躁，炒薏米+赤小豆+百合清润利湿，养阴不寒、祛湿不伤阴。'
  },
  '月经不调痛经有血块': {
    songnian: '虚寒宫寒、痛经有血块，可用当归红枣姜茶、香附炖乌鸡汤，温经散寒、活血止痛，暖宫又温和。',
    qinghe: '燥热伴经期烦躁、经色偏深，用银耳百合粥、藕节莲子汤，滋阴养血、舒缓不适，清而不寒。'
  },
  '容易过敏体质敏感': {
    songnian: '虚寒易感、易过敏，先温脾益气，常喝黄芪红枣粥、生姜陈皮茶，固表护阳，减少过敏发作。',
    qinghe: '燥热伴皮肤痒、口干咽痒，用雪梨百合汤、清蒸鲈鱼，清润平和，避免辛辣发物，温和护体质。'
  },
  '口干咽燥手足心热': {
    songnian: '虚寒者若口干不喜冷饮，多是气血不足，用桂圆红枣茶、山药小米粥，温养气血，津液自生。',
    qinghe: '阴虚燥热、手足心热，首选百合莲子粥、银耳雪梨汤，滋阴润燥、清虚火，温和不伤阴。'
  },
  '口苦口臭面油长痘': {
    songnian: '寒湿困脾、口气黏腻，用陈皮茯苓粥、生姜薏米水，温脾祛湿，从根源改善油腻困重。',
    qinghe: '湿热内蕴、长痘口苦，喝绿豆百合汤、赤小豆冬瓜汤，吃苦瓜炒蛋，清热利湿、清而不寒。'
  },
  '谢谢你们': {
    songnian: '养生之道，贵在顺体质、顺四时，以平和为上，细水长流方得安康。',
    qinghe: '下次可以直接说出体质+需求，我和松年先生为你定制专属药膳方案'
  }
}

const FALLBACK_REPLY = {
  songnian: '请告诉我你的体质和当前困扰，我会从温补思路给你推荐合适药膳。',
  qinghe: '你可以直接说“体质+需求”，我会从清润轻养角度给你安排更贴合的方案。'
}

const QUICK_QUESTIONS = [
  '你好',
  '春季养生怎么吃？',
  '经常熬夜，该怎么补？',
  '脾胃不好、吃一点就胀',
  '湿气重、总觉得累',
  '月经不调、痛经有血块',
  '容易过敏、体质敏感',
  '口干咽燥、手足心热',
  '口苦口臭、面油长痘',
  '谢谢你们'
]
const INITIAL_QUICK_QUESTIONS = ['你好']

const TYPE_INTERVAL = 125
const BACKGROUND_FADE_DURATION = 2000
const ENTRY_DURATION = 5000

Page({
  data: {
    inputText: '',
    messages: [],
    quickQuestions: INITIAL_QUICK_QUESTIONS,
    scrollIntoView: '',
    userProfile: { nickName: '', avatarUrl: '' },
    defaultAvatar: 'https://res.wx.qq.com/op_res/Y3uW5mC3E-placeholder-avatar.png',
    entryVisible: true,
    entryReveal: false,
    entryImage: '',
    idleBackgroundImage: '',
    activeSpeakerRole: '',
    roleBackgroundVisible: { songnian: false, qinghe: false },
    backgroundImages: {
      songnian: '',
      qinghe: ''
    },
    assistantAvatars: {
      songnian: '',
      qinghe: ''
    }
  },
  onLoad() {
    this.resolveStaticImages()
  },
  async resolveStaticImages() {
    const urls = [ENTRY_FILE_ID, SONGNIAN_BG_FILE_ID, QINGHE_BG_FILE_ID, SONGNIAN_AVATAR_FILE_ID, QINGHE_AVATAR_FILE_ID]
    const resolved = await resolveImageUrls(urls)
    this.setData({
      entryImage: resolved[0] || '',
      idleBackgroundImage: resolved[0] || '',
      backgroundImages: {
        songnian: resolved[1] || '',
        qinghe: resolved[2] || ''
      },
      assistantAvatars: {
        songnian: resolved[3] || '',
        qinghe: resolved[4] || ''
      }
    })
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
    this.syncUserProfile()
    this.startEntryAnimation()
  },
  onUnload() {
    this.activeSessionId = 0
    this.clearAllTimers()
  },
  clearAllTimers() {
    const timerIds = this.timerIds || []
    timerIds.forEach((id) => clearTimeout(id))
    this.timerIds = []
  },
  registerTimer(id) {
    this.timerIds = this.timerIds || []
    this.timerIds.push(id)
  },
  wait(ms) {
    return new Promise((resolve) => {
      const id = setTimeout(resolve, ms)
      this.registerTimer(id)
    })
  },
  startEntryAnimation() {
    this.setData({ entryVisible: true, entryReveal: false })
    this.registerTimer(setTimeout(() => {
      this.setData({ entryReveal: true })
    }, 40))
    this.registerTimer(setTimeout(() => {
      this.setData({ entryVisible: false })
    }, ENTRY_DURATION))
  },
  onEntryImageError() {
    const songnian = (this.data.backgroundImages && this.data.backgroundImages.songnian) || ''
    const qinghe = (this.data.backgroundImages && this.data.backgroundImages.qinghe) || ''
    if (songnian && this.data.entryImage !== songnian) {
      this.setData({ entryImage: songnian })
      return
    }
    if (qinghe && this.data.entryImage !== qinghe) {
      this.setData({ entryImage: qinghe })
      return
    }
    if (this.data.entryImage) {
      this.setData({ entryImage: '' })
    }
  },
  onIdleBackgroundError() {
    if (this.data.idleBackgroundImage) this.setData({ idleBackgroundImage: '' })
  },
  onBackgroundImageError(e) {
    const role = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.role : ''
    if (role !== 'songnian' && role !== 'qinghe') return
    const next = this.data.backgroundImages || {}
    if (!next[role]) return
    this.setData({
      [`backgroundImages.${role}`]: '',
      [`roleBackgroundVisible.${role}`]: false
    })
  },
  onAssistantAvatarError(e) {
    const role = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.role : ''
    if (role !== 'songnian' && role !== 'qinghe') return
    const avatars = this.data.assistantAvatars || {}
    if (!avatars[role]) return
    this.setData({ [`assistantAvatars.${role}`]: '' })
  },
  syncUserProfile() {
    let p = {}
    try { p = wx.getStorageSync('userProfile') || {} } catch (_) { p = {} }
    const avatarUrl = normalizeImageUrl(p.avatarUrl || '')
    this.setData({
      userProfile: {
        nickName: p.nickName || '',
        avatarUrl
      }
    })
  },
  onInputChange(e) {
    this.setData({ inputText: e.detail.value || '' })
  },
  onQuickQuestionTap(e) {
    const question = e.currentTarget.dataset.question || ''
    if (!question) return
    this.handleUserSend(question)
  },
  onSendTap() {
    const content = (this.data.inputText || '').trim()
    if (!content) return
    this.handleUserSend(content)
  },
  async handleUserSend(content) {
    const text = (content || '').trim()
    if (!text) return
    this.activeSessionId = (this.activeSessionId || 0) + 1
    const sessionId = this.activeSessionId
    const userMessage = this.buildUserMessage(text)
    const reply = this.resolveReply(text)
    const userAnchorId = `msg-${userMessage.id}`
    this.setData({
      inputText: '',
      messages: [userMessage],
      quickQuestions: QUICK_QUESTIONS,
      activeSpeakerRole: '',
      roleBackgroundVisible: { songnian: false, qinghe: false },
      scrollIntoView: userAnchorId
    })
    await this.appendAssistantTyping(sessionId, 'songnian', '松年先生', reply.songnian)
    await this.appendAssistantTyping(sessionId, 'qinghe', '青禾', reply.qinghe)
  },
  async appendAssistantTyping(sessionId, role, name, fullText) {
    if (this.activeSessionId !== sessionId) return
    await this.activateSpeakerBackground(sessionId, role)
    const message = this.buildAssistantMessage(role, name, '')
    const nextMessages = this.data.messages.concat([message])
    const messageIndex = nextMessages.length - 1
    this.setData({
      messages: nextMessages,
      scrollIntoView: `msg-${message.id}`
    })
    await this.typeMessageText(sessionId, messageIndex, fullText || '')
  },
  typeMessageText(sessionId, messageIndex, fullText) {
    return new Promise((resolve) => {
      let index = 0
      const run = () => {
        if (this.activeSessionId !== sessionId) {
          resolve()
          return
        }
        index += 1
        const text = fullText.slice(0, index)
        const current = this.data.messages[messageIndex]
        const anchorId = current ? `msg-${current.id}` : ''
        this.setData({
          [`messages[${messageIndex}].text`]: text,
          scrollIntoView: anchorId
        })
        if (index >= fullText.length) {
          resolve()
          return
        }
        setTimeout(run, TYPE_INTERVAL)
      }
      if (!fullText) {
        resolve()
        return
      }
      setTimeout(run, TYPE_INTERVAL)
    })
  },
  activateSpeakerBackground(sessionId, role) {
    return new Promise((resolve) => {
      if (this.activeSessionId !== sessionId) {
        resolve()
        return
      }
      const prevRole = this.data.activeSpeakerRole
      const visible = { ...(this.data.roleBackgroundVisible || {}) }
      visible[role] = true
      this.setData({
        activeSpeakerRole: role,
        roleBackgroundVisible: visible
      })
      if (prevRole && prevRole !== role) {
        this.registerTimer(setTimeout(() => {
          if (this.activeSessionId !== sessionId) {
            resolve()
            return
          }
          this.setData({
            [`roleBackgroundVisible.${prevRole}`]: false
          })
          resolve()
        }, BACKGROUND_FADE_DURATION))
        return
      }
      this.registerTimer(setTimeout(() => {
        if (this.activeSessionId !== sessionId) {
          resolve()
          return
        }
        resolve()
      }, 40))
    })
  },
  buildUserMessage(text) {
    const profile = this.data.userProfile || {}
    return {
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      type: 'user',
      name: profile.nickName || '用户',
      avatarUrl: normalizeImageUrl(profile.avatarUrl || ''),
      text
    }
  },
  buildAssistantMessage(role, name, text) {
    const assistantAvatars = this.data.assistantAvatars || {}
    return {
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      type: 'assistant',
      role,
      name,
      avatarUrl: normalizeImageUrl(assistantAvatars[role] || ''),
      text
    }
  },
  resolveReply(question) {
    const normalized = this.normalizeQuestion(question)
    if (CHAT_SCRIPT[normalized]) return CHAT_SCRIPT[normalized]
    if (normalized.indexOf('你好') > -1) return CHAT_SCRIPT['你好']
    if (normalized.indexOf('春') > -1 && normalized.indexOf('养生') > -1) return CHAT_SCRIPT['春季养生怎么吃']
    if (normalized.indexOf('熬夜') > -1) return CHAT_SCRIPT['经常熬夜该怎么补']
    if (normalized.indexOf('脾胃') > -1 || normalized.indexOf('胀') > -1) return CHAT_SCRIPT['脾胃不好吃一点就胀']
    if (normalized.indexOf('湿气') > -1 || normalized.indexOf('累') > -1) return CHAT_SCRIPT['湿气重总觉得累']
    if (normalized.indexOf('月经不调') > -1 || (normalized.indexOf('痛经') > -1 && normalized.indexOf('血块') > -1)) return CHAT_SCRIPT['月经不调痛经有血块']
    if (normalized.indexOf('过敏') > -1 || normalized.indexOf('体质敏感') > -1 || normalized.indexOf('敏感体质') > -1) return CHAT_SCRIPT['容易过敏体质敏感']
    if ((normalized.indexOf('口干') > -1 && normalized.indexOf('咽燥') > -1) || normalized.indexOf('手足心热') > -1) return CHAT_SCRIPT['口干咽燥手足心热']
    if ((normalized.indexOf('口苦') > -1 && normalized.indexOf('口臭') > -1) || normalized.indexOf('长痘') > -1 || normalized.indexOf('面油') > -1) return CHAT_SCRIPT['口苦口臭面油长痘']
    if (normalized.indexOf('谢谢') > -1) return CHAT_SCRIPT['谢谢你们']
    return FALLBACK_REPLY
  },
  normalizeQuestion(text) {
    return String(text || '')
      .replace(/[？?！!。,.，\s]/g, '')
      .trim()
  }
})
