const { getRecipeImage, defaultCover } = require('../../utils/image')
Page({
  data: {
    keyword: '',
    tags: ['补气', '补血', '祛湿', '清热', '安神', '美容', '养胃'],
    activeTag: '',
    constitutionFilter: '',
    allRecipes: [],
    list: [],
    defaultCover
  },
  onLoad() {
    const base = [
      { id: 'r1', name: '黄芪党参鸡汤', constitution: '气虚', effect: '益气健脾', difficulty: '中', time: '60min', image_url: getRecipeImage('黄芪党参鸡汤') },
      { id: 'r2', name: '薏米赤小豆粥', constitution: '痰湿', effect: '健脾祛湿', difficulty: '易', time: '40min', image_url: getRecipeImage('薏米赤小豆粥') },
      { id: 'r3', name: '百合莲子羹', constitution: '阴虚', effect: '养阴安神', difficulty: '易', time: '25min', image_url: getRecipeImage('百合莲子羹') },
      { id: 'r4', name: '枸杞红枣粥', constitution: '血瘀', effect: '补血活血', difficulty: '易', time: '30min', image_url: getRecipeImage('枸杞红枣粥') },
      { id: 'r5', name: '冬瓜薏米汤', constitution: '湿热', effect: '清热利湿', difficulty: '易', time: '45min', image_url: getRecipeImage('冬瓜薏米汤') },
      { id: 'r6', name: '党参麦冬茶', constitution: '气郁', effect: '疏肝解郁', difficulty: '易', time: '10min', image_url: getRecipeImage('党参麦冬茶') }
    ]
    try {
      const last = wx.getStorageSync('lastJudgeResult') || {}
      const list = Array.isArray(last.recipes) ? last.recipes : []
      const merged = list.map((x, i) => ({
        id: x.id || `m${i}`,
        name: x.name || '',
        constitution: x.constitution || '',
        effect: x.effect || '',
        difficulty: x.difficulty || '中',
        time: x.time || '30min',
        image_url: getRecipeImage(x.name || '')
      }))
      const all = [...merged, ...base]
      this.setData({ allRecipes: all })
      try { wx.setStorageSync('allRecipes', all) } catch (_) {}
    } catch (_) {
      this.setData({ allRecipes: base })
      try { wx.setStorageSync('allRecipes', base) } catch (_) {}
    }
    if (this.getOpenerEventChannel) {
      const ec = this.getOpenerEventChannel()
      if (ec && ec.on) {
        ec.on('filter', (f) => {
          const c = f && f.constitution ? f.constitution : ''
          const tag = f && f.tag ? f.tag : ''
          this.setData({ constitutionFilter: c, activeTag: tag })
          this.applyFilter()
        })
      }
    }
    this.applyFilter()
  },
  onKeyword(e) {
    this.setData({ keyword: e.detail.value || '' })
    this.applyFilter()
  },
  onTag(e) {
    const tag = e.currentTarget.dataset.tag || ''
    this.setData({ activeTag: tag })
    this.applyFilter()
  },
  clearConstitution() {
    this.setData({ constitutionFilter: '' })
    this.applyFilter()
  },
  applyFilter() {
    const kw = (this.data.keyword || '').trim()
    const tag = this.data.activeTag || ''
    const c = this.data.constitutionFilter || ''
    let list = this.data.allRecipes
    if (kw) list = list.filter((x) => (x.name && x.name.indexOf(kw) > -1) || (x.effect && x.effect.indexOf(kw) > -1) || (x.constitution && x.constitution.indexOf(kw) > -1))
    if (tag) list = list.filter((x) => {
      if (tag === '补气') return x.effect && x.effect.indexOf('气') > -1
      if (tag === '补血') return x.effect && (x.effect.indexOf('血') > -1 || x.constitution === '血瘀')
      if (tag === '祛湿') return x.effect && (x.effect.indexOf('湿') > -1)
      if (tag === '清热') return x.effect && (x.effect.indexOf('清热') > -1 || x.constitution === '湿热')
      if (tag === '安神') return x.effect && (x.effect.indexOf('安神') > -1)
      if (tag === '美容') return x.effect && (x.effect.indexOf('美容') > -1 || x.effect.indexOf('养颜') > -1)
      if (tag === '养胃') return x.effect && (x.effect.indexOf('健脾') > -1 || x.effect.indexOf('养胃') > -1)
      return true
    })
    if (c) list = list.filter((x) => (x.constitution || '').indexOf(c) > -1)
    this.setData({ list })
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/recipe-detail/index?id=${id}` })
  }
})
