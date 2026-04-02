const env = require('../config/env')
const { STORAGE_KEYS, API_ROUTES, CLOUD_FUNCTIONS } = require('../constants/index')
const useCloud = env.useCloud !== false
let cloudAvailable = true

function mapToCloudFunction(url) {
  return CLOUD_FUNCTIONS[url] || ''
}

function normalizeResponse(body) {
  if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'code') && Object.prototype.hasOwnProperty.call(body, 'data')) return body.data
  return body
}

function getStorage(key) {
  if (typeof wx === 'undefined' || !wx || !wx.getStorageSync) return ''
  try {
    return wx.getStorageSync(key)
  } catch (err) {
    void err
    return ''
  }
}

function setStorage(key, value) {
  if (typeof wx === 'undefined' || !wx || !wx.setStorageSync) return
  try {
    wx.setStorageSync(key, value)
  } catch (err) {
    void err
  }
}

function extractOpenid(data) {
  if (!data || typeof data !== 'object') return ''
  if (data.openid) return data.openid
  if (data.data && data.data.openid) return data.data.openid
  return ''
}

function request({ url, data = {}, showLoading = true }) {
  return new Promise((resolve, reject) => {
    if (useCloud && typeof wx !== 'undefined' && wx && wx.cloud && cloudAvailable) {
      const name = mapToCloudFunction(url)
      if (!name) return reject(new Error(`未映射的云函数: ${url}`))
      let payload = data || {}
      if (name !== 'login') {
        try {
          const openid = getStorage(STORAGE_KEYS.OPENID) || ''
          if (openid) payload = { ...payload, openid }
        } catch (err) { void err }
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

function loginWithCode(code, showLoading = false) {
  const payload = code ? { code } : {}
  return request({ url: API_ROUTES.AUTH_WX_LOGIN, data: payload, showLoading })
}

function ensureOpenid({ forceRefresh = false, showLoading = false } = {}) {
  return new Promise((resolve, reject) => {
    const cachedOpenid = getStorage(STORAGE_KEYS.OPENID) || ''
    if (cachedOpenid && !forceRefresh) {
      resolve(cachedOpenid)
      return
    }
    if (typeof wx === 'undefined' || !wx || !wx.login) {
      reject(new Error('当前环境不支持 wx.login'))
      return
    }
    wx.login({
      success: (resp) => {
        const code = resp && resp.code ? resp.code : ''
        loginWithCode(code, showLoading)
          .then((res) => {
            const openid = extractOpenid(res)
            if (!openid) {
              reject(new Error('openid 获取失败'))
              return
            }
            setStorage(STORAGE_KEYS.OPENID, openid)
            resolve(openid)
          })
          .catch((err) => reject(err))
      },
      fail: () => reject(new Error('系统登录失败'))
    })
  })
}

module.exports = {
  request,
  ensureOpenid,
  extractOpenid,
  getStorage,
  setStorage
}
