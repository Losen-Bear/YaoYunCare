const mapping = require('../assets/recipes/index.js')

const defaultCover =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"8\" fill=\"#f1f5f1\"/><path d=\"M16 44l10-12 7 8 9-10 6 14H16z\" fill=\"#dbe5db\"/><circle cx=\"24\" cy=\"24\" r=\"6\" fill=\"#dbe5db\"/></svg>'
  )

function getRecipeImage(name) {
  if (!name) return defaultCover
  return mapping[name] || defaultCover
}

module.exports = { getRecipeImage, defaultCover }
