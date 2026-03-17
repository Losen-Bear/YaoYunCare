const fs = require('fs')
const path = require('path')

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function isImage(file) {
  const ext = path.extname(file).toLowerCase()
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)
}

function run() {
  const sourceDir = 'E:\\\\Desktop\\\\图片资源'
  const projectRoot = path.resolve(__dirname, '..')
  const destDir = path.join(projectRoot, 'miniprogram', 'assets', 'recipes')
  ensureDir(destDir)
  const files = fs.readdirSync(sourceDir).filter(isImage)
  const mapping = {}
  files.forEach((file) => {
    const src = path.join(sourceDir, file)
    const dst = path.join(destDir, file)
    fs.copyFileSync(src, dst)
    const name = path.basename(file, path.extname(file))
    mapping[name] = `/assets/recipes/${file}`
  })
  const mapFile = path.join(destDir, 'index.json')
  fs.writeFileSync(mapFile, JSON.stringify(mapping, null, 2), 'utf8')
  const jsMapFile = path.join(destDir, 'index.js')
  const jsContent = 'module.exports = ' + JSON.stringify(mapping, null, 2) + '\n'
  fs.writeFileSync(jsMapFile, jsContent, 'utf8')
  console.log(`Imported ${files.length} images to ${destDir}`)
  console.log(`Mapping written to ${mapFile}`)
  console.log(`JS mapping written to ${jsMapFile}`)
}

run()
