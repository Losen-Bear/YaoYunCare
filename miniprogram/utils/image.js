const defaultCover = '/assets/icons/logo-yy.png'

function getRecipeImage() {
  return defaultCover
}

function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return url
  let u = url.trim()
  if ((u.startsWith('"') && u.endsWith('"')) || (u.startsWith("'") && u.endsWith("'"))) {
    u = u.slice(1, -1).trim()
  }
  if (/^cloud:\/[^/]/i.test(u)) {
    u = u.replace(/^cloud:\//i, 'cloud://')
  }
  if (u.startsWith('cloud://')) return u.replace(/\s+/g, '')
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  return u
}

module.exports = { getRecipeImage, defaultCover, normalizeImageUrl }
