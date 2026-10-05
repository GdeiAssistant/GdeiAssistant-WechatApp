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
    getDeviceInfo: function () {
      return { deviceId: 'test-device-id' }
    },
    getStorageSync: function (key) {
      return storage[key] || ''
    },
    setStorageSync: function (key, val) {
      storage[key] = val
    },
    removeStorageSync: function (key) {
      delete storage[key]
    },
    showNavigationBarLoading: function () {},
    hideNavigationBarLoading: function () {},
    showLoading: function () {},
    hideLoading: function () {},
    showModal: function () {},
    reLaunch: function () {},
    request: wxRequestImpl || function () {}
  }
  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }

  // Stub dependencies
  stubModule(CONFIG_MODULE, {
    resourceDomain: 'https://test.example.com/',
    requestTimeout: 5000,
    currentEnv: 'prod'
  })
  stubModule(AUTH_MODULE, {
    getSessionToken: function () {
      return storage.sessionToken || ''
    },
    setSessionToken: function (t) {
      storage.sessionToken = t
    },
    clearSession: function () {
      delete storage.sessionToken
    },
    reLaunchToLogin: function () {},
    ensureSessionToken: function () {
      const token = storage.sessionToken
      if (token) return Promise.resolve(token)
      return Promise.reject(new Error('no token'))
    }
  })
  stubModule(DATA_SOURCE_MODULE, {
    isMockMode: function () {
      return false
    }
  })
  stubModule(MOCK_MODULE, {})

  clearModule(REQUEST_MODULE)
  return require(REQUEST_MODULE)
}

// ---- generateRequestId ----

test('generateRequestId returns a non-empty UUID-shaped string', function () {
  const { generateRequestId } = setup()
  const id = generateRequestId()
  assert.ok(id.length > 0, 'should be non-empty')
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
})

test('generateRequestId returns unique values', function () {
  const { generateRequestId } = setup()
  const ids = new Set()
  for (let i = 0; i < 50; i++) {
    ids.add(generateRequestId())
  }
  assert.equal(ids.size, 50, 'all 50 IDs should be unique')
})

// ---- X-Request-ID header ----

test('request includes X-Request-ID header in outbound calls', async function () {
  let capturedHeader = null

  const { request } = setup(function (opts) {
    capturedHeader = opts.header
    opts.success({ statusCode: 200, data: { code: 200, data: null } })
  })

  await request({ url: '/api/test' })

  assert.ok(capturedHeader['X-Request-ID'], 'X-Request-ID should be present')
  assert.match(capturedHeader['X-Request-ID'], /^[0-9a-f-]+$/)
})

test('request preserves caller-supplied requestId', async function () {
  let capturedHeader = null

  const { request } = setup(function (opts) {
    capturedHeader = opts.header
    opts.success({ statusCode: 200, data: { code: 200, data: null } })
  })

  await request({ url: '/api/test', requestId: 'custom-rid-001' })

  assert.equal(capturedHeader['X-Request-ID'], 'custom-rid-001')
})

// ---- Auth header injection ----

test('request injects Authorization header when authRequired', async function () {
  let capturedHeader = null

  const { request } = setup(function (opts) {
    capturedHeader = opts.header
    opts.success({ statusCode: 200, data: { code: 200, data: null } })
  })

  // Set a token in storage so ensureSessionToken resolves
  global.wx.setStorageSync('sessionToken', 'my-jwt-token')
  clearModule(AUTH_MODULE)
  stubModule(AUTH_MODULE, {
    getSessionToken: function () {
      return 'my-jwt-token'
    },
    clearSession: function () {},
    reLaunchToLogin: function () {},
    ensureSessionToken: function () {
      return Promise.resolve('my-jwt-token')
    }
  })
  clearModule(REQUEST_MODULE)
  const mod = require(REQUEST_MODULE)

  await mod.request({ url: '/api/protected', authRequired: true })

  assert.equal(capturedHeader.Authorization, 'Bearer my-jwt-token')
})

test('request propagates an existing Authorization header when auth is optional', async function () {
  let capturedHeader = null

  const { request } = setup(function (opts) {
    capturedHeader = opts.header
    opts.success({ statusCode: 200, data: { code: 200, data: null } })
  })

  global.wx.setStorageSync('sessionToken', 'optional-jwt-token')
  await request({ url: '/api/public', authRequired: false })

  assert.equal(capturedHeader.Authorization, 'Bearer optional-jwt-token')
})

// ---- 401 handling ----

function setupAuth401(options) {
  const config = options || {}
  let currentToken = config.currentToken || ''
  let sessionCleared = 0
  let relaunchCount = 0
  let loadingHidden = 0

  setup(
    config.mockMode
      ? function () {}
      : function (opts) {
          if (typeof config.onRemoteRequest === 'function') {
            config.onRemoteRequest(opts, {
              setCurrentToken: function (token) {
                currentToken = token
              }
            })
            return
          }
          opts.success({ statusCode: 401, data: {} })
        }
  )

  stubModule(AUTH_MODULE, {
    getSessionToken: function () {
      return currentToken
    },
    clearSession: function () {
      sessionCleared += 1
      currentToken = ''
    },
    reLaunchToLogin: function () {
      relaunchCount += 1
    },
    ensureSessionToken: function () {
      if (!currentToken) {
        return Promise.reject(new Error('no token'))
      }
      return Promise.resolve(currentToken)
    }
  })
  stubModule(DATA_SOURCE_MODULE, {
    isMockMode: function () {
      return !!config.mockMode
    }
  })
  stubModule(MOCK_MODULE, {
    handleRequest: function () {
      if (typeof config.onMockRequest === 'function') {
        return config.onMockRequest({
          getCurrentToken: function () {
            return currentToken
          },
          setCurrentToken: function (token) {
            currentToken = token
          }
        })
      }
      return Promise.reject(Object.assign(new Error('unauthorized'), { statusCode: 401 }))
    }
  })
  clearModule(REQUEST_MODULE)
  const mod = require(REQUEST_MODULE)

  global.wx.hideLoading = function () {
    loadingHidden += 1
  }

  return {
    request: mod.request,
    get sessionCleared() {
      return sessionCleared
    },
    get relaunchCount() {
      return relaunchCount
    },
    get loadingHidden() {
      return loadingHidden
    },
    setCurrentToken: function (token) {
      currentToken = token
    }
  }
}

test('request clears session on 401 when request token matches current session', async function () {
  const env = setupAuth401({ currentToken: 'token-a' })

  await assert.rejects(env.request({ url: '/api/test', authRequired: true }), {
    message: '登录凭证已过期，请重新登录'
  })
  assert.equal(env.sessionCleared, 1)
  assert.equal(env.relaunchCount, 1)
})

test('request 401 after token switch does not clear the new session', async function () {
  const env = setupAuth401({
    currentToken: 'token-a',
    onRemoteRequest: function (opts, helpers) {
      helpers.setCurrentToken('token-b')
      opts.success({ statusCode: 401, data: {} })
    }
  })

  await assert.rejects(env.request({ url: '/api/test', authRequired: true }), {
    message: '登录凭证已过期，请重新登录'
  })
  assert.equal(env.sessionCleared, 0)
  assert.equal(env.relaunchCount, 0)
})

test('request 401 after logout does not clear again', async function () {
  const env = setupAuth401({
    currentToken: 'token-a',
    onRemoteRequest: function (opts, helpers) {
      helpers.setCurrentToken('')
      opts.success({ statusCode: 401, data: {} })
    }
  })

  await assert.rejects(env.request({ url: '/api/test', authRequired: true }), {
    message: '登录凭证已过期，请重新登录'
  })
  assert.equal(env.sessionCleared, 0)
  assert.equal(env.relaunchCount, 0)
})

test('request unauthenticated 401 rejects without clearing session', async function () {
  const env = setupAuth401({ currentToken: 'token-still-here' })

  await assert.rejects(env.request({ url: '/api/public', authRequired: false }), {
    message: '登录凭证已过期，请重新登录'
  })
  assert.equal(env.sessionCleared, 0)
  assert.equal(env.relaunchCount, 0)
})

test('mock request 401 clears only when request token still matches current session', async function () {
  const matching = setupAuth401({ currentToken: 'token-mock', mockMode: true })
  await assert.rejects(
    matching.request({ url: '/api/test', authRequired: true, showLoading: true }),
    { message: '登录凭证已过期，请重新登录' }
  )
  assert.equal(matching.sessionCleared, 1)
  assert.equal(matching.relaunchCount, 1)
  assert.ok(matching.loadingHidden >= 1)

  const switched = setupAuth401({
    currentToken: 'token-old',
    mockMode: true,
    onMockRequest: function (helpers) {
      helpers.setCurrentToken('token-new')
      return Promise.reject(Object.assign(new Error('unauthorized'), { statusCode: 401 }))
    }
  })
  await assert.rejects(
    switched.request({ url: '/api/test', authRequired: true, showLoading: true }),
    { message: '登录凭证已过期，请重新登录' }
  )
  assert.equal(switched.sessionCleared, 0)
  assert.equal(switched.relaunchCount, 0)
  assert.ok(switched.loadingHidden >= 1)

  const loggedOut = setupAuth401({
    currentToken: 'token-old',
    mockMode: true,
    onMockRequest: function (helpers) {
      helpers.setCurrentToken('')
      return Promise.reject(Object.assign(new Error('unauthorized'), { statusCode: 401 }))
    }
  })
  await assert.rejects(
    loggedOut.request({ url: '/api/test', authRequired: true, showLoading: true }),
    { message: '登录凭证已过期，请重新登录' }
  )
  assert.equal(loggedOut.sessionCleared, 0)
  assert.equal(loggedOut.relaunchCount, 0)
  assert.ok(loggedOut.loadingHidden >= 1)

  const unauthenticated = setupAuth401({
    currentToken: 'token-still-here',
    mockMode: true
  })
  await assert.rejects(
    unauthenticated.request({ url: '/api/public', authRequired: false, showLoading: true }),
    { message: '登录凭证已过期，请重新登录' }
  )
  assert.equal(unauthenticated.sessionCleared, 0)
  assert.equal(unauthenticated.relaunchCount, 0)
  assert.ok(unauthenticated.loadingHidden >= 1)
})

// ---- Payload normalization ----

test('request normalizes successful response through normalizePayload', async function () {
  const { request } = setup(function (opts) {
    opts.success({ statusCode: 200, data: { code: 200, msg: 'ok', data: { id: 1 } } })
  })

  const result = await request({ url: '/api/data' })

  assert.equal(result.success, true)
  assert.deepEqual(result.data, { id: 1 })
})

// ---- Default headers ----

test('request includes Accept-Language and X-Device-ID headers', async function () {
  let capturedHeader = null

  const { request } = setup(function (opts) {
    capturedHeader = opts.header
    opts.success({ statusCode: 200, data: { code: 200, data: null } })
  })

  await request({ url: '/api/test' })

  assert.equal(capturedHeader['Accept-Language'], 'zh-CN')
  assert.equal(capturedHeader['X-Device-ID'], 'test-device-id')
})

test('request normalizes unsupported locale before sending Accept-Language', async function () {
  let capturedHeader = null
  const { request } = setup(function (opts) {
    capturedHeader = opts.header
    opts.success({ statusCode: 200, data: { code: 200, data: null } })
  })
  global.getApp = function () {
    return { globalData: { locale: 'fr-FR' } }
  }

  await request({ url: '/api/test' })

  assert.equal(capturedHeader['Accept-Language'], 'zh-CN')
})
