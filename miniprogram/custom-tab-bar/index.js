const { resolveImageUrls } = require('../utils/image')
const { PAGES } = require('../constants/index')
const TAB_ITEMS = [
  {
    pagePath: PAGES.HOME,
    text: "首页",
    iconPath: "cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/home/top-1.webp",
    selectedIconPath: "cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/home/top-1.webp"
  },
  {
    pagePath: PAGES.RECIPES,
    text: "药膳馆",
    iconPath: "cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/home/top-2.webp",
    selectedIconPath: "cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/home/top-2.webp"
  },
  {
    pagePath: PAGES.ASSISTANT,
    text: "药膳助手",
    iconPath: "cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/home/top-3.webp",
    selectedIconPath: "cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/home/top-3.webp"
  },
  {
    pagePath: PAGES.PROFILE,
    text: "我的",
    iconPath: "cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/home/top-4.webp",
    selectedIconPath: "cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719/home/top-4.webp"
  }
]

Component({
  data: {
    selected: 0,
    color: "#D7CBB2",
    selectedColor: "#C8AD66",
    list: TAB_ITEMS.map((it) => ({
      pagePath: it.pagePath,
      text: it.text,
      iconPath: '',
      selectedIconPath: ''
    }))
  },
  lifetimes: {
    attached() {
      this.resolveTabIcons()
    }
  },
  methods: {
    async resolveTabIcons() {
      const list = Array.isArray(TAB_ITEMS) ? TAB_ITEMS : []
      const allUrls = []
      list.forEach((item) => {
        allUrls.push(item.iconPath || '')
        allUrls.push(item.selectedIconPath || '')
      })
      const resolved = await resolveImageUrls(allUrls)
      if (!Array.isArray(resolved) || resolved.length === 0) return
      const next = list.map((item, index) => {
        const i = index * 2
        return {
          ...item,
          iconPath: resolved[i] || '',
          selectedIconPath: resolved[i + 1] || ''
        }
      })
      this.setData({ list: next })
    },
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({ url })
    }
  }
})
