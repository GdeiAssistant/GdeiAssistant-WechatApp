const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')

const root = path.resolve(__dirname, '..')
const packageJson = require(path.join(root, 'package.json'))
const appConfig = require(path.join(root, 'app.json'))
const projectConfig = require(path.join(root, 'project.config.json'))
const config = require(path.join(root, 'config/index.js'))

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8').trim()
}

function ensureFile(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert.ok(fs.existsSync(fullPath), `missing required file: ${relativePath}`)
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

validateNodeVersionAlignment()
validatePageRegistration()
validateProjectConfig()
validateRuntimeConfig()

console.log(`smoke ok: ${appConfig.pages.length} pages, node ${packageJson.engines.node}, env ${config.currentEnv}`)
