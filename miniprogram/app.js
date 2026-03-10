const envCfg = require('./env')
App({
  onLaunch() {
    if (wx && wx.cloud) {
      const opt = {}
      if (envCfg.cloudEnv && typeof envCfg.cloudEnv === 'string' && envCfg.cloudEnv.length > 0) opt.env = envCfg.cloudEnv
      wx.cloud.init(opt)
    }
  }
})
