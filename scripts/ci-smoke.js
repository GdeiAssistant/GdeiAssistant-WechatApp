const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')

const root = path.resolve(__dirname, '..')
const packageJson = require(path.join(root, 'package.json'))
const appConfig = require(path.join(root, 'app.json'))
const projectConfig = require(path.join(root, 'project.config.json'))
const config = require(path.join(root, 'config/index.js'))

const MAX_PACKAGE_BYTES = 2 * 1024 * 1024

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8').trim()
}

function ensureFile(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert.ok(fs.existsSync(fullPath), `missing required file: ${relativePath}`)
}

function globToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
  return new RegExp(`^${escaped}$`)
}

function isIgnoredByPackOptions(relativePath, ignoreRules) {
  const normalized = relativePath.replace(/\\/g, '/')
  return ignoreRules.some((rule) => {
    if (!rule || !rule.value) return false
    const value = String(rule.value).replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '')
    if (rule.type === 'folder') {
      return normalized === value || normalized.startsWith(`${value}/`)
    }
    if (rule.type === 'file') {
      return normalized === value
    }
    if (rule.type === 'glob') {
      return globToRegExp(value).test(normalized)
    }
    if (rule.type === 'regexp') {
      return new RegExp(rule.value).test(normalized)
    }
    return false
  })
}

function collectRuntimeFiles(dirPath, prefix, ignoreRules) {
  let files = []
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue
    }
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name
    if (isIgnoredByPackOptions(relPath, ignoreRules)) {
      continue
    }
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files = files.concat(collectRuntimeFiles(fullPath, relPath, ignoreRules))
    } else if (entry.isFile()) {
      files.push({ path: relPath, size: fs.statSync(fullPath).size })
    }
  }
  return files
}

function validateNodeVersionAlignment() {
  const nvmrc = readText('.nvmrc').replace(/^v/, '')
  assert.equal(packageJson.engines.node, nvmrc, 'package.json engines.node must match .nvmrc')
}

function validatePageRegistration() {
  assert.ok(Array.isArray(appConfig.pages) && appConfig.pages.length > 0, 'app.json pages must not be empty')

  appConfig.pages.forEach((page) => {
    ;['.js', '.json', '.wxml', '.wxss'].forEach((ext) => {
      ensureFile(`${page}${ext}`)
    })
  })

  const subpackages = appConfig.subpackages || appConfig.subPackages || []
  subpackages.forEach((pkg) => {
    assert.ok(pkg.root && Array.isArray(pkg.pages) && pkg.pages.length > 0, `invalid subpackage: ${pkg.root}`)
    const pkgRoot = pkg.root.replace(/\/+$/, '')
    pkg.pages.forEach((page) => {
      ;['.js', '.json', '.wxml', '.wxss'].forEach((ext) => {
        ensureFile(`${pkgRoot}/${page}${ext}`)
      })
    })
  })
}

function validateProjectConfig() {
  assert.equal(projectConfig.compileType, 'miniprogram', 'project.config.json compileType must be miniprogram')
  assert.ok(Number(projectConfig.libVersion.split('.')[0]) >= 2, 'libVersion should be a valid mini program base library version')
}

function validateRuntimeConfig() {
  assert.equal(typeof config.requestTimeout, 'number', 'requestTimeout should be numeric')
  assert.ok(config.requestTimeout > 0, 'requestTimeout should be positive')
  assert.equal(typeof config.resourceDomain, 'string', 'resourceDomain should be a string')
  assert.ok(config.resourceDomain.endsWith('/'), 'resourceDomain should keep a trailing slash')
}

function validatePackageSize() {
  const ignoreRules = (projectConfig.packOptions && projectConfig.packOptions.ignore) || []
  const runtimeFiles = collectRuntimeFiles(root, '', ignoreRules)
  const totalBytes = runtimeFiles.reduce((sum, file) => sum + file.size, 0)
  const subpackages = (appConfig.subpackages || appConfig.subPackages || []).map((pkg) =>
    String(pkg.root || '').replace(/^\/+|\/+$/g, '')
  )

  let mainBytes = totalBytes
  subpackages.forEach((pkgRoot) => {
    const pkgBytes = runtimeFiles
      .filter((file) => file.path.startsWith(`${pkgRoot}/`))
      .reduce((sum, file) => sum + file.size, 0)
    mainBytes -= pkgBytes
    assert.ok(
      pkgBytes < MAX_PACKAGE_BYTES,
      `subpackage ${pkgRoot} exceeds 2MB limit: ${pkgBytes} bytes`
    )
  })

  assert.ok(mainBytes < MAX_PACKAGE_BYTES, `main package exceeds 2MB limit: ${mainBytes} bytes`)
  assert.ok(totalBytes < MAX_PACKAGE_BYTES, `runtime package exceeds 2MB limit: ${totalBytes} bytes`)
  return { totalBytes, mainBytes }
}

validateNodeVersionAlignment()
validatePageRegistration()
validateProjectConfig()
validateRuntimeConfig()
const sizeReport = validatePackageSize()
const subpackagePageCount = (appConfig.subpackages || appConfig.subPackages || []).reduce(
  (sum, pkg) => sum + (pkg.pages ? pkg.pages.length : 0),
  0
)

console.log(
  `smoke ok: ${appConfig.pages.length} main pages + ${subpackagePageCount} subpackage pages, ` +
    `runtime ${(sizeReport.totalBytes / 1024 / 1024).toFixed(2)}MB ` +
    `(main ${(sizeReport.mainBytes / 1024 / 1024).toFixed(2)}MB), ` +
    `node ${packageJson.engines.node}, env ${config.currentEnv}`
)
