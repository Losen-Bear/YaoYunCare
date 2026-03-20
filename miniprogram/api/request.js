const env = require('../config/env')
const useCloud = env.useCloud !== false
let cloudAvailable = true

function mapToCloudFunction(url) {
  if (url === '/api/constitution/judge-with-recipes') return 'judgeWithRecipes'
  if (url === '/api/health/check') return 'health'
  if (url === '/api/auth/wx-login') return 'login'
  return ''
}

function normalizeResponse(body) {
  if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'code') && Object.prototype.hasOwnProperty.call(body, 'data')) return body.data
  return body
}

function request({ url, method = 'GET', data = {}, header = {}, showLoading = true }) {
  return new Promise((resolve, reject) => {
    if (useCloud && wx && wx.cloud && cloudAvailable) {
      const name = mapToCloudFunction(url)
      if (!name) return reject(new Error(`未映射的云函数: ${url}`))
      let payload = data || {}
      if (name !== 'login') {
        try {
          const openid = wx.getStorageSync('openid') || ''
          if (openid) payload = { ...payload, openid }
        } catch (_) {}
      }
      if (showLoading) wx.showLoading({ title: '加载中' })
      wx.cloud.callFunction({ name, data: payload })
        .then((res) => { if (showLoading) wx.hideLoading(); resolve(normalizeResponse(res.result)) })
        .catch((err) => {
          if (showLoading) wx.hideLoading()
          reject(err)
        })
      return
    }
    reject(new Error('当前环境未启用云开发或 wx.cloud 不可用'))
  })
}

module.exports = { request }
