const CLOUD_FILE_ROOT = 'cloud://cloud1-8g4fsimf73eedcfd.636c-cloud1-8g4fsimf73eedcfd-1410266719'
const Q_CLOUD_HOST = '636c-cloud1-8g4fsimf73eedcfd-1410266719.tcb.qcloud.la'
const defaultCover = 'https://res.wx.qq.com/op_res/Y3uW5mC3E-placeholder-avatar.png'
const recipeImageDir = `${CLOUD_FILE_ROOT}/recipes`
const tempUrlCache = {}
const tempPathCache = {}

function isCloudHost(host) {
  const h = String(host || '').toLowerCase()
  if (!h) return false
  const expected = String(Q_CLOUD_HOST || '').toLowerCase()
  if (expected && h === expected) return true
  if (h.endsWith('.tcb.qcloud.la')) return true
  if (h.endsWith('.qcloud.la')) return true
  return false
}

function stripUrlQueryAndHash(path) {
  const p = String(path || '')
  if (!p) return ''
  const q = p.indexOf('?')
  const h = p.indexOf('#')
  let end = p.length
  if (q > -1 && q < end) end = q
  if (h > -1 && h < end) end = h
  return p.slice(0, end)
}

function getRecipeImage(name) {
  const byName = getRecipeCloudWebpByName(name)
  return byName || defaultCover
}

function getRecipeCloudWebpByName(name) {
  const n = String(name || '').trim()
  if (!n) return ''
  return `${recipeImageDir}/${n}.webp`
}

function normalizeCloudFileID(v) {
  if (!v || typeof v !== 'string') return ''
  let id = v.trim()
  if ((id.startsWith('"') && id.endsWith('"')) || (id.startsWith("'") && id.endsWith("'"))) {
    id = id.slice(1, -1).trim()
  }
  if (/^cloud:\/[^/]/i.test(id)) {
    id = id.replace(/^cloud:\//i, 'cloud://')
  }
  if (id.startsWith('cloud://')) {
    return id.replace(/\s+/g, '')
  }
  return id
}

function toCloudFileID(url) {
  const u = normalizeCloudFileID(url)
  if (!u) return ''
  if (u.startsWith('cloud://')) return u
  if (/^https?:\/\//i.test(u)) {
    const m = u.match(/^https?:\/\/([^/]+)(\/.*)?$/i)
    if (!m) return u
    const host = (m[1] || '').toLowerCase()
    const path = stripUrlQueryAndHash(m[2] || '')
    if (isCloudHost(host) && path) return `${CLOUD_FILE_ROOT}${path}`
    return u
  }
  if (u.startsWith('wxfile://') || u.startsWith('file://') || u.startsWith('data:')) return u
  return `${CLOUD_FILE_ROOT}/${u.replace(/^\/+/, '')}`
}

function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return url
  const u = normalizeCloudFileID(url)
  if (!u) return ''
  const plain = u.replace(/[()[\]{}<>]/g, '').replace(/\s+/g, '')
  const upper = plain.toUpperCase()
  if (upper === 'URL' || upper === 'N/A' || upper === 'NA' || upper === 'NULL' || upper === 'UNDEFINED') return ''
  if (u.startsWith('cloud://')) return u
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('wxfile://') || u.startsWith('file://') || u.startsWith('data:')) return u
  return u
}

function isSignedCloudTempUrl(url) {
  const u = normalizeImageUrl(url)
  if (!u || typeof u !== 'string') return false
  if (!/^https?:\/\//i.test(u)) return false
  const m = u.match(/^https?:\/\/([^/]+)/i)
  const host = m && m[1] ? m[1] : ''
  if (!isCloudHost(host)) return false
  const cloudID = toCloudFileID(u)
  if (!(typeof cloudID === 'string' && cloudID.startsWith('cloud://'))) return false
  return true
}

async function resolveImageUrls(urls) {
  const arr = Array.isArray(urls) ? urls : []
  const fileIDList = []
  const fileIDSet = {}
  arr.forEach((it) => {
    const normalized = normalizeImageUrl(it)
    const fileID = toCloudFileID(normalized)
    if (typeof fileID === 'string' && fileID.startsWith('cloud://') && !tempUrlCache[fileID] && !fileIDSet[fileID]) {
      fileIDSet[fileID] = true
      fileIDList.push(fileID)
    }
  })
  if (fileIDList.length > 0 && wx && wx.cloud) {
    const unresolved = {}
    fileIDList.forEach((id) => {
      unresolved[id] = true
    })
    if (wx.cloud.getTempFileURL) {
      try {
        const resp = await wx.cloud.getTempFileURL({ fileList: fileIDList })
        const list = resp && Array.isArray(resp.fileList) ? resp.fileList : []
        list.forEach((it) => {
          const id = normalizeCloudFileID(it && it.fileID ? it.fileID : '')
          const temp = it && it.tempFileURL ? it.tempFileURL : ''
          const status = typeof (it && it.status) === 'number' ? it.status : -1
          if (id && temp && status === 0) {
            tempUrlCache[id] = temp
            delete unresolved[id]
          }
        })
      } catch (_) { void 0 }
    }
    const unresolvedAfterClient = Object.keys(unresolved)
    if (unresolvedAfterClient.length > 0 && wx.cloud.callFunction) {
      try {
        const resp = await wx.cloud.callFunction({
          name: 'health',
          data: { action: 'getTempFileURLs', fileList: unresolvedAfterClient }
        })
        const payload = resp && resp.result && resp.result.data ? resp.result.data : {}
        const list = payload && Array.isArray(payload.fileList) ? payload.fileList : []
        list.forEach((it) => {
          const id = normalizeCloudFileID(it && it.fileID ? it.fileID : '')
          const temp = it && it.tempFileURL ? it.tempFileURL : ''
          const status = typeof (it && it.status) === 'number' ? it.status : -1
          if (id && temp && status === 0) {
            tempUrlCache[id] = temp
            delete unresolved[id]
          }
        })
      } catch (_) { void 0 }
    }
    const fallbackFileIDs = Object.keys(unresolved).filter((id) => !tempPathCache[id])
    if (fallbackFileIDs.length > 0 && wx.cloud.downloadFile) {
      await Promise.all(fallbackFileIDs.map(async (fileID) => {
        try {
          const resp = await wx.cloud.downloadFile({ fileID })
          const tempFilePath = resp && resp.tempFilePath ? resp.tempFilePath : ''
          if (tempFilePath) {
            tempPathCache[fileID] = tempFilePath
            delete unresolved[fileID]
          }
        } catch (_) { void 0 }
      }))
    }
  }
  return arr.map((it) => {
    const normalized = normalizeImageUrl(it)
    const fileID = toCloudFileID(normalized)
    if (typeof fileID === 'string' && fileID.startsWith('cloud://')) {
      const fallbackHttpUrl = /^https?:\/\//i.test(normalized) ? normalized : ''
      return tempUrlCache[fileID] || tempPathCache[fileID] || fallbackHttpUrl || ''
    }
    return normalized
  })
}

async function resolveImageUrl(url) {
  const list = await resolveImageUrls([url])
  if (list[0]) return list[0]
  const normalized = normalizeImageUrl(url)
  const fileID = toCloudFileID(normalized)
  if (typeof fileID === 'string' && fileID.startsWith('cloud://')) return ''
  return normalized
}

module.exports = {
  CLOUD_FILE_ROOT,
  getRecipeImage,
  getRecipeCloudWebpByName,
  defaultCover,
  isSignedCloudTempUrl,
  normalizeImageUrl,
  resolveImageUrl,
  resolveImageUrls,
  toCloudFileID
}
