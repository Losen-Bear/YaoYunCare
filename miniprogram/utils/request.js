const { baseURL, useCloud } = require('../env')
let cloudAvailable = true
function mapToCloudFunction(url) {
  if (url === '/api/constitution/judge-with-recipes') return 'judgeWithRecipes'
  if (url === '/api/health/check') return 'health'
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
      if (!name) {
        if (showLoading) wx.showLoading({ title: '加载中' })
        wx.request({
          url: baseURL + url,
          method,
          data,
          header: { 'Content-Type': 'application/json', ...header },
          success(res) { if (showLoading) wx.hideLoading(); resolve(normalizeResponse(res.data)) },
          fail(err) { if (showLoading) wx.hideLoading(); reject(err) }
        })
        return
      }
      if (showLoading) wx.showLoading({ title: '加载中' })
      wx.cloud.callFunction({ name, data })
        .then((res) => { if (showLoading) wx.hideLoading(); resolve(normalizeResponse(res.result)) })
        .catch((err) => {
          cloudAvailable = false
          if (showLoading) wx.hideLoading()
          if (showLoading) wx.showLoading({ title: '切换直连' })
          wx.request({
            url: baseURL + url,
            method,
            data,
            header: { 'Content-Type': 'application/json', ...header },
            success(res2) { if (showLoading) wx.hideLoading(); resolve(normalizeResponse(res2.data)) },
            fail(err2) { if (showLoading) wx.hideLoading(); reject(err2) }
          })
        })
      return
    }
    if (showLoading) wx.showLoading({ title: '加载中' })
    wx.request({
      url: baseURL + url,
      method,
      data,
      header: { 'Content-Type': 'application/json', ...header },
      success(res) { if (showLoading) wx.hideLoading(); resolve(normalizeResponse(res.data)) },
      fail(err) { if (showLoading) wx.hideLoading(); reject(err) }
    })
  })
}
module.exports = { request }
