const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const AUTH_MODULE = path.join(ROOT, 'services/auth.js')
const CONFIG_MODULE = path.join(ROOT, 'config/index.js')
const ENDPOINTS_MODULE = path.join(ROOT, 'services/endpoints.js')
const DATA_SOURCE_MODULE = path.join(ROOT, 'services/data-source.js')
const MOCK_MODULE = path.join(ROOT, 'mock/index.js')
const RESPONSE_MODULE = path.join(ROOT, 'services/response.js')

function setup(wxOverrides) {
  const storage = {}
  global.wx = {
    getStorageSync: function (key) {
      return storage[key] || ''
    },
    setStorageSync: function (key, val) {
      storage[key] = val
    },
    removeStorageSync: function (key) {
      delete storage[key]
    },
    showModal: function (opts) {
      if (opts.success) opts.success({ confirm: true })
    },
    reLaunch: function () {},
    request: function () {},
    ...wxOverrides
  }

  stubModule(CONFIG_MODULE, {
    resourceDomain: 'https://test.example.com/',
    requestTimeout: 5000,
    currentEnv: 'prod'
  })
  stubModule(ENDPOINTS_MODULE, {
    auth: { login: '/api/auth/login', logout: '/api/auth/logout', validate: '/api/auth/validate' },
    user: { profile: '/api/user/profile' }
  })
  stubModule(DATA_SOURCE_MODULE, {
    isMockMode: function () {
      return false
    }
  })
  stubModule(MOCK_MODULE, {
    isSessionTokenValid: function () {
      return false
    },
    handleLogout: function () {
      return Promise.resolve()
    }
  })

  clearModule(AUTH_MODULE)
  return { auth: require(AUTH_MODULE), storage }
}

// ---- getSessionToken / setSessionToken ----

test('getSessionToken returns empty string when no token stored', function () {
  const { auth } = setup()
  assert.equal(auth.getSessionToken(), '')
})

test('setSessionToken persists and getSessionToken retrieves', function () {
  const { auth } = setup()
  auth.setSessionToken('jwt-abc-123')
  assert.equal(auth.getSessionToken(), 'jwt-abc-123')
})

// ---- clearSession ----

test('clearSession removes all session-related storage keys', function () {
  const { auth, storage } = setup()
  // Pre-populate storage
  global.wx.setStorageSync('sessionToken', 'tok')
  global.wx.setStorageSync('username', 'user1')
  global.wx.setStorageSync('accessToken', 'at')
  global.wx.setStorageSync('refreshToken', 'rt')

  auth.clearSession()

  assert.equal(global.wx.getStorageSync('sessionToken'), '')
  assert.equal(global.wx.getStorageSync('username'), '')
  assert.equal(global.wx.getStorageSync('accessToken'), '')
  assert.equal(global.wx.getStorageSync('refreshToken'), '')
})

// ---- ensureSessionToken ----

test('ensureSessionToken resolves with token when present', async function () {
  const { auth } = setup()
  auth.setSessionToken('valid-token')

  const token = await auth.ensureSessionToken()
  assert.equal(token, 'valid-token')
})

test('ensureSessionToken rejects when no token and interactive', async function () {
  const { auth } = setup()

  await assert.rejects(auth.ensureSessionToken(), { message: '未检测到登录凭证' })
})

test('ensureSessionToken rejects without modal when non-interactive', async function () {
  let modalShown = false
  const { auth } = setup({
    getStorageSync: function () {
      return ''
    },
    setStorageSync: function () {},
    removeStorageSync: function () {},
    showModal: function () {
      modalShown = true
    },
    reLaunch: function () {},
    request: function () {}
  })

  await assert.rejects(auth.ensureSessionToken({ interactive: false }), {
    message: '未检测到登录凭证'
  })
  assert.ok(!modalShown, 'should not show modal in non-interactive mode')
})

// ---- validateSessionToken ----

test('validateSessionToken resolves false when no token stored', async function () {
  const { auth } = setup()

  const result = await auth.validateSessionToken()
  assert.equal(result, false)
})

test('validateSessionToken resolves true on 200 success response', async function () {
  const { auth } = setup({
    getStorageSync: function (key) {
      if (key === 'sessionToken') return 'valid-jwt'
      return ''
    },
    setStorageSync: function () {},
    removeStorageSync: function () {},
    showModal: function () {},
    reLaunch: function () {},
    request: function (opts) {
      opts.success({
        statusCode: 200,
        data: { code: 200, success: true, message: 'success', data: null }
      })
    }
  })

  const result = await auth.validateSessionToken()
  assert.equal(result, true)
})

test('validateSessionToken resolves false on 401', async function () {
  const { auth } = setup({
    getStorageSync: function (key) {
      if (key === 'sessionToken') return 'expired-jwt'
      return ''
    },
    setStorageSync: function () {},
    removeStorageSync: function () {},
    showModal: function () {},
    reLaunch: function () {},
    request: function (opts) {
      opts.success({ statusCode: 401, data: {} })
    }
  })

  const result = await auth.validateSessionToken()
  assert.equal(result, false)
})

test('validateSessionToken resolves false on network failure', async function () {
  const { auth } = setup({
    getStorageSync: function (key) {
      if (key === 'sessionToken') return 'some-jwt'
      return ''
    },
    setStorageSync: function () {},
    removeStorageSync: function () {},
    showModal: function () {},
    reLaunch: function () {},
    request: function (opts) {
      opts.fail()
    }
  })

  const result = await auth.validateSessionToken()
  assert.equal(result, false)
})

// ---- validateSessionToken uses correct endpoint ----

test('validateSessionToken calls /api/auth/validate with Bearer header', async function () {
  let capturedOpts = null

  const { auth } = setup({
    getStorageSync: function (key) {
      if (key === 'sessionToken') return 'my-jwt'
      return ''
    },
    setStorageSync: function () {},
    removeStorageSync: function () {},
    showModal: function () {},
    reLaunch: function () {},
    request: function (opts) {
      capturedOpts = opts
      opts.success({
        statusCode: 200,
        data: { code: 200, success: true, message: 'success', data: null }
      })
    }
  })

  await auth.validateSessionToken()

  assert.ok(
    capturedOpts.url.includes('/api/auth/validate'),
    'should call lightweight validate endpoint'
  )
  assert.ok(
    !capturedOpts.url.includes('/api/user/profile'),
    'should NOT call heavyweight profile endpoint'
  )
  assert.equal(capturedOpts.header.Authorization, 'Bearer my-jwt')
  assert.equal(capturedOpts.method, 'GET')
})

// ---- validateSessionToken cleanup boundary ----

test('validateSessionToken does NOT clear session on 401 — cleanup is caller responsibility', async function () {
  let removeKeys = []

  const { auth } = setup({
    getStorageSync: function (key) {
      if (key === 'sessionToken') return 'expired-jwt'
      return ''
    },
    setStorageSync: function () {},
    removeStorageSync: function (key) {
      removeKeys.push(key)
    },
    showModal: function () {},
    reLaunch: function () {},
    request: function (opts) {
      opts.success({ statusCode: 401, data: { code: 401, message: 'Unauthorized' } })
    }
  })

  const result = await auth.validateSessionToken()

  assert.equal(result, false)
  assert.equal(
    removeKeys.length,
    0,
    "validateSessionToken should not call clearSession — that is the caller's job"
  )
})

// ---- request correlation ----

test('validateSessionToken includes X-Request-ID header', async function () {
  let capturedOpts = null

  const { auth } = setup({
    getStorageSync: function (key) {
      if (key === 'sessionToken') return 'my-jwt'
      return ''
    },
    setStorageSync: function () {},
    removeStorageSync: function () {},
    showModal: function () {},
    reLaunch: function () {},
    request: function (opts) {
      capturedOpts = opts
      opts.success({
        statusCode: 200,
        data: { code: 200, success: true, message: 'success', data: null }
      })
    }
  })

  await auth.validateSessionToken()

  assert.ok(capturedOpts.header['X-Request-ID'], 'X-Request-ID should be present')
  assert.match(
    capturedOpts.header['X-Request-ID'],
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  )
})

test('logout includes X-Request-ID header', async function () {
  let capturedOpts = null

  const { auth } = setup({
    getStorageSync: function (key) {
      if (key === 'sessionToken') return 'my-jwt'
      return ''
    },
    setStorageSync: function () {},
    removeStorageSync: function () {},
    showModal: function () {},
    reLaunch: function () {},
    request: function (opts) {
      capturedOpts = opts
      if (opts.complete) opts.complete()
    }
  })

  await auth.logout()

  assert.ok(capturedOpts.header['X-Request-ID'], 'X-Request-ID should be present')
  assert.match(
    capturedOpts.header['X-Request-ID'],
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  )
})

// ---- logout ----

test('logout resolves immediately when no token stored', async function () {
  const { auth } = setup()
  await auth.logout()
  // no error = pass
})
