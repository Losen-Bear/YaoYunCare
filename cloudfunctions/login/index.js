const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
exports.main = async (event, context) => {
  try {
    const code = event && event.code ? String(event.code) : ''
    if (!code) return { code: 400, message: '缺少登录凭证code', data: null }
    const res = await cloud.openapi.auth.code2Session({ jsCode: code })
    const openid = res && res.openid ? res.openid : ''
    const session_key = res && (res.sessionKey || res.session_key) ? (res.sessionKey || res.session_key) : ''
    if (!openid) return { code: 400, message: 'code无效或已过期', data: null }
    return { code: 200, message: 'ok', data: { openid, session_key } }
  } catch (e) {
    try {
      const wxContext = cloud.getWXContext()
      if (wxContext && wxContext.OPENID) return { code: 200, message: 'ok', data: { openid: wxContext.OPENID, session_key: '' } }
    } catch (_) {}
    return { code: 500, message: '登录失败', data: null }
  }
}
