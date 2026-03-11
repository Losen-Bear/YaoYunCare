Page({
  data: {
    main: '',
    types: [],
    recipesList: [],
    grouped: {},
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
          const hasPrimary = result && Array.isArray(result.primary) && result.primary.length > 0
          const mainStr = result && result.mainConstitution ? result.mainConstitution : ''
          const t = hasPrimary ? result.primary : (mainStr ? mainStr.split('+') : types)
          const grouped = {}
          t.forEach((name) => { grouped[name] = r.filter((x) => x.constitution === name) })
          this.setData({ recipesList: r, grouped })
        })
      }
    }
  },
  goBack() {
    wx.navigateBack({ delta: 1 })
  }
})
