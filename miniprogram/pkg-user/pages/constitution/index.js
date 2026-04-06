const { getRecipeImage, defaultCover } = require('../../../utils/image')

Page({
  data: {
    main: '',
    types: [],
    recipesList: [],
    grouped: {},
    recipeImageBrokenMap: {},
    percent: 0,
    defaultCover,
    result: {},
    infos: {
      平和质: '体形匀称，精力充沛，面色红润，情绪稳定。建议保持规律作息、均衡饮食、适量运动，继续巩固良好状态。',
      气虚质: '元气不足，易疲劳，少气懒言，动则汗出，抵抗力偏弱。多与劳累过度、饮食不规律相关，宜健脾益气，规律作息。',
      阳虚质: '阳气不足，畏寒怕冷，手脚冰凉，喜温喜热，大便溏薄。多与先天不足或过食生冷相关，宜温阳祛寒，少食生冷。',
      阴虚质: '阴液不足，口干咽燥，手足心热，夜间盗汗，大便干结。多与熬夜劳心、过食辛辣相关，宜滋阴润燥，早睡少熬夜。',
      痰湿质: '痰湿内停，体沉乏力，困倦黏腻，口中黏腻，大便粘滞。多与嗜油腻、缺乏运动相关，宜化痰祛湿，清淡饮食。',
      湿热质: '湿热内蕴，面部出油，口苦口臭，小便黄赤，大便黏滞。多与湿热环境或嗜辛辣油炸相关，宜清热利湿，少辛辣油腻。',
      血瘀质: '血行不畅，面色晦暗，有色斑，疼痛固定。女性多痛经经血有块。多与久坐久立、情绪郁结相关，宜活血通络，适量运动。',
      气郁质: '气机郁滞，情绪低落或烦躁，胸闷善太息，睡眠多梦。多与精神压力大相关，宜疏肝解郁，规律运动与情绪管理。',
      特禀质: '禀赋特殊，易过敏，皮肤瘙痒或荨麻疹，换季明显。多与遗传相关，宜避敏原，增强防护，遵从个体化调理。'
    },
    details: {
      气虚质: { 表现: ['神疲乏力', '易感冒', '少气懒言'], 倾向: ['脾肺功能偏弱'], 性格作息: ['性格温和', '作息不规律易疲劳'] },
      阳虚质: { 表现: ['畏寒肢冷', '面色淡白'], 倾向: ['代谢偏慢', '耐寒差'], 性格作息: ['喜温怕冷', '嗜热饮'] },
      阴虚质: { 表现: ['口干咽燥', '手足心热'], 倾向: ['津液不足'], 性格作息: ['易烦躁', '熬夜加重'] },
      痰湿质: { 表现: ['体沉困倦', '舌苔厚腻'], 倾向: ['水液代谢差'], 性格作息: ['嗜油腻', '少运动'] },
      湿热质: { 表现: ['出油多', '口苦口臭'], 倾向: ['内有湿热'], 性格作息: ['喜辛辣', '环境闷热加重'] },
      血瘀质: { 表现: ['面色晦暗', '疼痛固定'], 倾向: ['血行不畅'], 性格作息: ['久坐久立', '情绪郁结'] },
      气郁质: { 表现: ['情绪低落', '胸闷叹气'], 倾向: ['肝气郁结'], 性格作息: ['压力大', '睡眠欠佳'] },
      特禀质: { 表现: ['易过敏', '皮肤瘙痒'], 倾向: ['免疫反应敏感'], 性格作息: ['需避敏原', '规律作息'] },
      平和质: { 表现: ['精力充沛'], 倾向: ['机体平衡良好'], 性格作息: ['保持良好习惯'] }
    },
    guides: {
      气虚质: { 宜吃: ['黄芪', '党参', '山药', '大枣'], 忌吃: ['生冷食物'], 运动: ['快走', '瑜伽'], 少做: ['熬夜'] },
      阳虚质: { 宜吃: ['生姜', '桂圆', '羊肉'], 忌吃: ['寒凉饮食'], 运动: ['日光慢跑'], 少做: ['久吹空调'] },
      阴虚质: { 宜吃: ['百合', '银耳', '莲子'], 忌吃: ['辛辣油炸'], 运动: ['舒缓拉伸'], 少做: ['熬夜劳神'] },
      痰湿质: { 宜吃: ['薏米', '赤小豆', '冬瓜'], 忌吃: ['油腻甜食'], 运动: ['有氧运动'], 少做: ['久坐不动'] },
      湿热质: { 宜吃: ['绿豆', '苦瓜', '荷叶'], 忌吃: ['辛辣烧烤'], 运动: ['清晨快走'], 少做: ['烈日暴晒'] },
      血瘀质: { 宜吃: ['丹参', '山楂', '桃仁'], 忌吃: ['高脂肪食物'], 运动: ['有氧+拉伸'], 少做: ['久坐久站'] },
      气郁质: { 宜吃: ['玫瑰花', '佛手', '香橙'], 忌吃: ['咖啡因过多'], 运动: ['舒展类'], 少做: ['过度情绪压抑'] },
      特禀质: { 宜吃: ['低致敏食物'], 忌吃: ['过敏原'], 运动: ['中低强度'], 少做: ['接触敏原'] },
      平和质: { 宜吃: ['均衡饮食'], 忌吃: ['过食辛辣'], 运动: ['适量运动'], 少做: ['过劳'] }
    }
  },
  onLoad(options) {
    const main = decodeURIComponent(options.main || '')
    const typesParam = decodeURIComponent(options.types || '')
    const types = typesParam ? typesParam.split(',').filter(Boolean) : (main ? main.split('+') : [])
    this.setData({ main, types })
    if (this.getOpenerEventChannel) {
      const ec = this.getOpenerEventChannel()
      if (ec && ec.on) {
        ec.on('judge', ({ result, recipes }) => {
          const r = Array.isArray(recipes) ? recipes : []
          const r2 = r.map((x) => {
            const ing = Array.isArray(x.ingredients) ? x.ingredients.join('、') : ''
            const stp = Array.isArray(x.steps) ? x.steps.join('；') : ''
            return { ...x, ingredientsText: ing, stepsText: stp, image_url: x.image_url || getRecipeImage(x.name || '') }
          })
          const hasPrimary = result && Array.isArray(result.primary) && result.primary.length > 0
          const mainStr = result && result.mainConstitution ? result.mainConstitution : ''
          const t = hasPrimary ? result.primary : (mainStr ? mainStr.split('+') : types)
          const grouped = {}
          t.forEach((name) => { grouped[name] = r2.filter((x) => x.constitution === name) })
          const md = Array.isArray(result && result.matchDetail) ? result.matchDetail : []
          let top = 0
          const cur = t[0] || mainStr || ''
          md.forEach((d) => { if (d.constitution && d.constitution.indexOf(cur) > -1) top = d.count || 0 })
          const percent = Math.round((top / 3) * 100)
          const detailTextMap = {}
          const guideTextMap = {}
          t.forEach((name) => {
            const d = this.data.details[name] || {}
            const g = this.data.guides[name] || {}
            const s = (arr) => (Array.isArray(arr) ? arr.join('、') : '')
            detailTextMap[name] = { b: s(d['表现']), q: s(d['倾向']), x: s(d['性格作息']) }
            guideTextMap[name] = { eat: s(g['宜吃']), avoid: s(g['忌吃']), sport: s(g['运动']), less: s(g['少做']) }
          })
          this.setData({ recipesList: r2, grouped, percent, result, detailTextMap, guideTextMap })
        })
      }
    }
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pkg-detail/pages/recipe-detail/index?id=${id}` })
  },
  onRecipeImageError(e) {
    const key = e.currentTarget.dataset.key || ''
    if (!key) return
    this.setData({ [`recipeImageBrokenMap.${key}`]: true })
  },
  saveReport() {
    try {
      const report = { main: this.data.main, types: this.data.types, time: Date.now(), result: this.data.result, recipes: this.data.recipesList }
      const list = wx.getStorageSync('savedReports') || []
      list.unshift(report)
      wx.setStorageSync('savedReports', list.slice(0, 20))
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (_) {}
  },
  goBack() {
    wx.navigateBack({ delta: 1 })
  },
  retest() {
    wx.navigateTo({ url: '/pkg-assessment/pages/notice/index' })
  }
})
