const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
exports.main = async (event) => {
  const action = event && event.action ? String(event.action) : ''
  if (action === 'getTempFileURLs') {
    const fileList = Array.isArray(event && event.fileList) ? event.fileList.filter((x) => typeof x === 'string' && x.startsWith('cloud://')) : []
    if (fileList.length === 0) return { code: 200, message: 'ok', data: { fileList: [] } }
    const resp = await cloud.getTempFileURL({ fileList })
    return { code: 200, message: 'ok', data: { fileList: resp && Array.isArray(resp.fileList) ? resp.fileList : [] } }
  }
  return { code: 200, message: 'ok', data: null }
}
