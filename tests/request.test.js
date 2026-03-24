const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const REQUEST_MODULE = path.join(ROOT, 'services/request.js')
const AUTH_MODULE = path.join(ROOT, 'services/auth.js')
const DATA_SOURCE_MODULE = path.join(ROOT, 'services/data-source.js')
const MOCK_MODULE = path.join(ROOT, 'mock/index.js')
const CONFIG_MODULE = path.join(ROOT, 'config/index.js')

function setup(wxRequestImpl) {
  // Stub wx global
  const storage = {}
  global.wx = {
    getDeviceInfo: function() { return { deviceId: 'test-device-id' } },
    getStorageSync: function(key) { return storage[key] || '' },
    setStorageSync: function(key, val) { storage[key] = val },
    removeStorageSync: function(key) { delete storage[key] },
    showNavigationBarLoading: function() {},
    hideNavigationBarLoading: function() {},
    showLoading: function() {},
    hideLoading: function() {},
    showModal: function() {},
    reLaunch: function() {},
    request: wxRequestImpl || function() {}
  }
  global.getApp = function() {
    return { globalData: { locale: 'zh-CN' } }
  }

  // Stub dependencies
  stubModule(CONFIG_MODULE, {
    resourceDomain: 'https://test.example.com/',
    requestTimeout: 5000,
    currentEnv: 'prod'
  })
  stubModule(AUTH_MODULE, {
    getSessionToken: function() { return storage.sessionToken || '' },
    setSessionToken: function(t) { storage.sessionToken = t },
    clearSession: function() { delete storage.sessionToken },
    reLaunchToLogin: function() {},
    ensureSessionToken: function() {
      const token = storage.sessionToken
      if (token) return Promise.resolve(token)
      return Promise.reject(new Error('no token'))
    }
  })
  stubModule(DATA_SOURCE_MODULE, {
    isMockMode: function() { return false }
  })
  stubModule(MOCK_MODULE, {})

  clearModule(REQUEST_MODULE)
  return require(REQUEST_MODULE)
}

// ---- generateRequestId ----

test('generateRequestId returns a non-empty UUID-shaped string', function() {
  const { generateRequestId } = setup()
  const id = generateRequestId()
  assert.ok(id.length > 0, 'should be non-empty')
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
})

test('generateRequestId returns unique values', function() {
  const { generateRequestId } = setup()
  const ids = new Set()
  for (let i = 0; i < 50; i++) {
    ids.add(generateRequestId())
  }
  assert.equal(ids.size, 50, 'all 50 IDs should be unique')
})

// ---- X-Request-ID header ----

test('request includes X-Request-ID header in outbound calls', async function() {
  let capturedHeader = null

  const { request } = setup(function(opts) {
    capturedHeader = opts.header
    opts.success({ statusCode: 200, data: { code: 200, data: null } })
  })

  await request({ url: '/api/test' })

  assert.ok(capturedHeader['X-Request-ID'], 'X-Request-ID should be present')
  assert.match(capturedHeader['X-Request-ID'], /^[0-9a-f-]+$/)
})

test('request preserves caller-supplied requestId', async function() {
  let capturedHeader = null

  const { request } = setup(function(opts) {
    capturedHeader = opts.header
    opts.success({ statusCode: 200, data: { code: 200, data: null } })
  })

  await request({ url: '/api/test', requestId: 'custom-rid-001' })

  assert.equal(capturedHeader['X-Request-ID'], 'custom-rid-001')
})

// ---- Auth header injection ----

test('request injects Authorization header when authRequired', async function() {
  let capturedHeader = null

  const { request } = setup(function(opts) {
    capturedHeader = opts.header
    opts.success({ statusCode: 200, data: { code: 200, data: null } })
  })

  // Set a token in storage so ensureSessionToken resolves
  global.wx.setStorageSync('sessionToken', 'my-jwt-token')
  clearModule(AUTH_MODULE)
  stubModule(AUTH_MODULE, {
    getSessionToken: function() { return 'my-jwt-token' },
    clearSession: function() {},
    reLaunchToLogin: function() {},
    ensureSessionToken: function() { return Promise.resolve('my-jwt-token') }
  })
  clearModule(REQUEST_MODULE)
  const mod = require(REQUEST_MODULE)

  await mod.request({ url: '/api/protected', authRequired: true })

  assert.equal(capturedHeader.Authorization, 'Bearer my-jwt-token')
})

test('request omits Authorization header when not authRequired', async function() {
  let capturedHeader = null

  const { request } = setup(function(opts) {
    capturedHeader = opts.header
    opts.success({ statusCode: 200, data: { code: 200, data: null } })
  })

  await request({ url: '/api/public', authRequired: false })

  assert.equal(capturedHeader.Authorization, undefined)
})

// ---- 401 handling ----

test('request rejects and clears session on 401 response', async function() {
  let sessionCleared = false

  const { request } = setup(function(opts) {
    opts.success({ statusCode: 401, data: {} })
  })

  // Override auth stub to track clearSession
  stubModule(AUTH_MODULE, {
    getSessionToken: function() { return '' },
    clearSession: function() { sessionCleared = true },
    reLaunchToLogin: function() {},
    ensureSessionToken: function() { return Promise.resolve(null) }
  })
  clearModule(REQUEST_MODULE)
  const mod = require(REQUEST_MODULE)

  await assert.rejects(
    mod.request({ url: '/api/test' }),
    { message: '登录凭证已过期，请重新登录' }
  )
  assert.ok(sessionCleared, 'clearSession should have been called')
})

// ---- Payload normalization ----

test('request normalizes successful response through normalizePayload', async function() {
  const { request } = setup(function(opts) {
    opts.success({ statusCode: 200, data: { code: 200, msg: 'ok', data: { id: 1 } } })
  })

  const result = await request({ url: '/api/data' })

  assert.equal(result.success, true)
  assert.deepEqual(result.data, { id: 1 })
})

// ---- Default headers ----

test('request includes Accept-Language and X-Device-ID headers', async function() {
  let capturedHeader = null

  const { request } = setup(function(opts) {
    capturedHeader = opts.header
    opts.success({ statusCode: 200, data: { code: 200, data: null } })
  })

  await request({ url: '/api/test' })

  assert.equal(capturedHeader['Accept-Language'], 'zh-CN')
  assert.equal(capturedHeader['X-Device-ID'], 'test-device-id')
})
