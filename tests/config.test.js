const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { freshRequire } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const CONFIG_MODULE = path.join(ROOT, 'config/index.js')

function loadConfig(options = {}) {
  const { wx, nodeEnv } = options

  delete global.wx
  if (wx) {
    global.wx = wx
  }

  if (nodeEnv === undefined) {
    delete process.env.NODE_ENV
  } else {
    process.env.NODE_ENV = nodeEnv
  }

  return freshRequire(CONFIG_MODULE)
}

test('develop in devtools uses localhost resource domain', function() {
  const config = loadConfig({
    wx: {
      getAccountInfoSync: function() {
        return { miniProgram: { envVersion: 'develop' } }
      },
      getDeviceInfo: function() {
        return { platform: 'devtools' }
      }
    }
  })

  assert.equal(config.currentEnv, 'dev')
  assert.equal(config.resourceDomain, 'http://localhost:8080/')
})

test('develop on real device falls back to staging domain', function() {
  const config = loadConfig({
    wx: {
      getAccountInfoSync: function() {
        return { miniProgram: { envVersion: 'develop' } }
      },
      getDeviceInfo: function() {
        return { platform: 'ios' }
      }
    }
  })

  assert.equal(config.currentEnv, 'dev')
  assert.equal(config.resourceDomain, 'https://gdeiassistant.azurewebsites.net/')
})

test('release runtime uses production domain', function() {
  const config = loadConfig({
    wx: {
      getAccountInfoSync: function() {
        return { miniProgram: { envVersion: 'release' } }
      },
      getDeviceInfo: function() {
        return { platform: 'ios' }
      }
    }
  })

  assert.equal(config.currentEnv, 'prod')
  assert.equal(config.resourceDomain, 'https://gdeiassistant.cn/')
})

test('node staging environment resolves to staging config', function() {
  const config = loadConfig({ nodeEnv: 'staging' })

  assert.equal(config.currentEnv, 'staging')
  assert.equal(config.resourceDomain, 'https://gdeiassistant.azurewebsites.net/')
})
