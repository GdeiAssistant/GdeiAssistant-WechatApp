const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const STORAGE_KEYS = require(path.join(ROOT, 'constants/storage.js'))
const REALTIME = path.join(ROOT, 'services/social-realtime.js')
const DATA_SOURCE = path.join(ROOT, 'services/data-source.js')
const AUTH = path.join(ROOT, 'services/auth.js')
const SOCIAL_UTILS = path.join(ROOT, 'utils/social.js')
const SOCIAL_AVATAR = path.join(ROOT, 'services/social-avatar.js')
const CONFIG_MODULE = path.join(ROOT, 'config/index.js')
const MOCK_MODULE = path.join(ROOT, 'mock/index.js')
const SOCIAL_DATA = path.join(ROOT, 'mock/social-data.js')
const USER_API_MODULE = path.join(ROOT, 'services/apis/user.js')
const PROFILE_MODULE = path.join(ROOT, 'constants/profile.js')
const COMMUNITY_MODULE = path.join(ROOT, 'constants/community.js')
const MOCK_DATA_MODULE = path.join(ROOT, 'mock/mock-data.js')
const I18N_MODULE = path.join(ROOT, 'utils/i18n.js')

const RESOURCE_DOMAIN = 'https://api.example.com/'
const AUTH_AVATAR_PATH = '/api/social/users/11111111-1111-4111-8111-111111111111/avatar'

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms)
  })
}

function createFakeSocket() {
  const handlers = {
    open: [],
    message: [],
    error: [],
    close: []
  }
  const socket = {
    closed: false,
    sent: [],
    onOpen(handler) {
      handlers.open.push(handler)
    },
    onMessage(handler) {
      handlers.message.push(handler)
    },
    onError(handler) {
      handlers.error.push(handler)
    },
    onClose(handler) {
      handlers.close.push(handler)
    },
    send(payload) {
      this.sent.push(payload)
    },
    close(options) {
      this.closed = true
      const code = options && typeof options.code === 'number' ? options.code : 1000
      handlers.close.slice().forEach(function (handler) {
        handler({ code: code })
      })
    },
    emitOpen() {
      handlers.open.slice().forEach(function (handler) {
        handler()
      })
    },
    emitMessage(data) {
      handlers.message.slice().forEach(function (handler) {
        handler({ data: data })
      })
    },
    emitClose(code) {
      handlers.close.slice().forEach(function (handler) {
        handler({ code: typeof code === 'number' ? code : 1000 })
      })
    }
  }
  return socket
}

function setupRealtimeRemote(options) {
  const config = options || {}
  const storage = {}
  storage[STORAGE_KEYS.sessionToken] = config.token || 'token-a'
  const sockets = []
  let reLaunchCount = 0

  global.wx = {
    getStorageSync(key) {
      return storage[key]
    },
    setStorageSync(key, value) {
      storage[key] = value
    },
    removeStorageSync(key) {
      delete storage[key]
    },
    connectSocket() {
      const socket = createFakeSocket()
      sockets.push(socket)
      return socket
    },
    showModal() {},
    reLaunch() {
      reLaunchCount += 1
    },
    downloadFile() {}
  }
  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }

  stubModule(DATA_SOURCE, {
    isMockMode() {
      return false
    }
  })
  stubModule(I18N_MODULE, {
    t(key) {
      return key
    },
    normalizeLocale() {
      return 'zh-CN'
    }
  })
  clearModule(AUTH)
  clearModule(REALTIME)
  const auth = require(AUTH)
  const realtime = require(REALTIME)

  return {
    storage: storage,
    sockets: sockets,
    auth: auth,
    realtime: realtime,
    get reLaunchCount() {
      return reLaunchCount
    },
    setToken(token) {
      storage[STORAGE_KEYS.sessionToken] = token
    },
    clearToken() {
      delete storage[STORAGE_KEYS.sessionToken]
    }
  }
}

function setupAvatarEnv(options) {
  const config = options || {}
  const storage = {}
  storage[STORAGE_KEYS.sessionToken] = config.token || 'token-avatar'
  const downloads = []
  const pendingSuccess = []

  global.wx = {
    getStorageSync(key) {
      return storage[key]
    },
    setStorageSync(key, value) {
      storage[key] = value
    },
    removeStorageSync(key) {
      delete storage[key]
    },
    downloadFile(opts) {
      const entry = {
        url: opts && opts.url,
        header: Object.assign({}, (opts && opts.header) || {}),
        success: opts && opts.success,
        fail: opts && opts.fail
      }
      downloads.push(entry)
      if (config.deferSuccess) {
        pendingSuccess.push(entry)
        return
      }
      if (opts && opts.success) {
        opts.success({ statusCode: 200, tempFilePath: 'wxfile://tmp-avatar' })
      }
    }
  }
  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }

  stubModule(CONFIG_MODULE, {
    resourceDomain: RESOURCE_DOMAIN,
    requestTimeout: 15000
  })
  stubModule(DATA_SOURCE, {
    isMockMode() {
      return false
    }
  })
  clearModule(AUTH)
  clearModule(SOCIAL_AVATAR)
  const auth = require(AUTH)
  const socialAvatar = require(SOCIAL_AVATAR)

  return {
    storage: storage,
    downloads: downloads,
    pendingSuccess: pendingSuccess,
    auth: auth,
    socialAvatar: socialAvatar,
    setToken(token) {
      storage[STORAGE_KEYS.sessionToken] = token
    },
    clearToken() {
      delete storage[STORAGE_KEYS.sessionToken]
    },
    flushDeferred(tempFilePath) {
      pendingSuccess.splice(0).forEach(function (entry) {
        if (entry.success) {
          entry.success({
            statusCode: 200,
            tempFilePath: tempFilePath || 'wxfile://tmp-stale'
          })
        }
      })
    }
  }
}

function setupMockRouter() {
  const storage = {}
  global.wx = {
    getStorageSync(key) {
      return storage[key]
    },
    setStorageSync(key, value) {
      storage[key] = value
    },
    removeStorageSync(key) {
      delete storage[key]
    }
  }
  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }
  clearModule(I18N_MODULE)
  clearModule(COMMUNITY_MODULE)
  clearModule(PROFILE_MODULE)
  clearModule(MOCK_DATA_MODULE)
  stubModule(USER_API_MODULE, {
    getProfileOptions() {
      return Promise.resolve({ success: true, data: {} })
    }
  })
  clearModule(MOCK_MODULE)
  return require(MOCK_MODULE)
}

async function login(mock) {
  const mockConstants = require(path.join(ROOT, 'constants/mock.js'))
  const result = await mock.handleRequest({
    method: 'POST',
    path: '/api/auth/login',
    data: {
      username: mockConstants.MOCK_ACCOUNT_USERNAME,
      password: mockConstants.MOCK_ACCOUNT_PASSWORD
    }
  })
  assert.equal(result.success, true)
  return result.data.token
}

test('mergeMessagesById keeps distinct senders with same clientMessageId', function () {
  clearModule(SOCIAL_UTILS)
  const socialUtils = require(SOCIAL_UTILS)
  const merged = socialUtils.mergeMessagesById(
    [
      {
        conversationId: '9001',
        senderId: 'self',
        clientMessageId: 'same',
        content: 'mine-pending',
        status: 'pending'
      }
    ],
    [
      {
        id: 'peer-1',
        conversationId: '9001',
        senderId: 'peer',
        clientMessageId: 'same',
        content: 'peer-message',
        seq: '2'
      },
      {
        id: 'self-1',
        conversationId: '9001',
        senderId: 'self',
        clientMessageId: 'same',
        content: 'mine-pending',
        seq: '3'
      }
    ]
  )
  assert.equal(merged.length, 2)
  assert.ok(
    merged.some(function (item) {
      return item.id === 'peer-1'
    })
  )
  assert.ok(
    merged.some(function (item) {
      return item.id === 'self-1'
    })
  )
})

test('mergeMessagesById does not downgrade committed message after HTTP timeout failed copy', function () {
  clearModule(SOCIAL_UTILS)
  const socialUtils = require(SOCIAL_UTILS)
  const merged = socialUtils.mergeMessagesById(
    [
      {
        id: 'msg-1',
        conversationId: '9001',
        senderId: 'self',
        clientMessageId: 'cid-1',
        content: 'hello',
        seq: '9',
        status: 'sent'
      }
    ],
    [
      {
        conversationId: '9001',
        senderId: 'self',
        clientMessageId: 'cid-1',
        content: 'hello',
        status: 'failed'
      }
    ]
  )
  assert.equal(merged.length, 1)
  assert.equal(merged[0].id, 'msg-1')
  assert.equal(merged[0].status, 'sent')
})

test('compareSeq and merge sort support values beyond Number.MAX_SAFE_INTEGER', function () {
  clearModule(SOCIAL_UTILS)
  const socialUtils = require(SOCIAL_UTILS)
  const bigA = '9007199254740993'
  const bigB = '9007199254740994'
  assert.equal(socialUtils.compareSeq(bigA, bigB), -1)
  assert.equal(socialUtils.maxSeq(bigA, bigB), bigB)
  const merged = socialUtils.mergeMessagesById(
    [
      { id: '1', seq: bigB, content: 'later' },
      { id: '2', seq: bigA, content: 'earlier' }
    ],
    []
  )
  assert.equal(merged[0].id, '2')
  assert.equal(merged[1].id, '1')
})

test('social realtime ignores stale socket close/message after replacement and logout', async function () {
  const env = setupRealtimeRemote({ token: 'token-a' })
  const realtime = env.realtime
  let readyCount = 0
  let messageCount = 0
  realtime.on('ready', function () {
    readyCount += 1
  })
  realtime.on('message.created', function () {
    messageCount += 1
  })

  realtime.connect()
  assert.equal(env.sockets.length, 1)
  const first = env.sockets[0]
  first.emitOpen()
  assert.equal(first.sent.length, 1)
  assert.match(String(first.sent[0].data), /"auth"/)
  first.emitMessage(JSON.stringify({ type: 'ready' }))
  assert.equal(realtime.isReady(), true)
  assert.equal(readyCount, 1)

  env.setToken('token-b')
  realtime.ensureConnected()
  assert.equal(env.sockets.length, 2)
  const second = env.sockets[1]
  assert.equal(first.closed, true)

  first.emitMessage(JSON.stringify({ type: 'ready' }))
  first.emitMessage(
    JSON.stringify({ type: 'message.created', conversationId: '1', messageId: '9', seq: '1' })
  )
  first.emitClose()
  assert.equal(readyCount, 1)
  assert.equal(messageCount, 0)
  assert.equal(realtime.isReady(), false)

  second.emitOpen()
  second.emitMessage(JSON.stringify({ type: 'ready' }))
  assert.equal(realtime.isReady(), true)
  assert.equal(readyCount, 2)
  second.emitMessage(
    JSON.stringify({ type: 'message.created', conversationId: '1', messageId: '10', seq: '2' })
  )
  assert.equal(messageCount, 1)

  const beforeCount = env.sockets.length
  realtime.ensureConnected()
  assert.equal(env.sockets.length, beforeCount)

  realtime.disconnect()
  assert.equal(realtime.isReady(), false)
  second.emitMessage(
    JSON.stringify({ type: 'message.created', conversationId: '1', messageId: '11', seq: '3' })
  )
  assert.equal(messageCount, 1)

  env.clearToken()
  second.emitClose()
  await wait(20)
  assert.equal(env.sockets.length, beforeCount)
})

test('social realtime auth timeout keeps token and reconnects without ready business events', async function () {
  const env = setupRealtimeRemote({ token: 'token-slow' })
  const realtime = env.realtime
  let readyCount = 0
  let messageCount = 0
  realtime.on('ready', function () {
    readyCount += 1
  })
  realtime.on('message.created', function () {
    messageCount += 1
  })

  realtime.connect()
  const first = env.sockets[0]
  first.emitOpen()
  await wait(5100)

  assert.equal(realtime.isReady(), false)
  assert.equal(env.storage[STORAGE_KEYS.sessionToken], 'token-slow')
  assert.equal(readyCount, 0)
  assert.equal(messageCount, 0)

  await wait(1600)
  assert.ok(env.sockets.length >= 2)
  assert.equal(env.storage[STORAGE_KEYS.sessionToken], 'token-slow')
  assert.equal(readyCount, 0)
})

test('social realtime explicit auth rejection clears session', async function () {
  const env = setupRealtimeRemote({ token: 'token-reject' })
  const realtime = env.realtime

  realtime.connect()
  const socket = env.sockets[0]
  socket.emitOpen()
  socket.emitMessage(JSON.stringify({ type: 'auth.failed' }))
  assert.equal(!!env.storage[STORAGE_KEYS.sessionToken], false)
  assert.equal(realtime.isReady(), false)

  const envClose = setupRealtimeRemote({ token: 'token-1008' })
  envClose.realtime.connect()
  const rejected = envClose.sockets[0]
  rejected.emitOpen()
  rejected.emitClose(1008)
  assert.equal(!!envClose.storage[STORAGE_KEYS.sessionToken], false)
  assert.equal(envClose.realtime.isReady(), false)
})

test('social avatar only attaches bearer for same-origin auth avatar path', async function () {
  const env = setupAvatarEnv({ token: 'token-avatar' })
  const socialAvatar = env.socialAvatar

  const sameOrigin = await socialAvatar.resolve(AUTH_AVATAR_PATH)
  assert.equal(sameOrigin, 'wxfile://tmp-avatar')
  assert.equal(env.downloads.length, 1)
  assert.equal(env.downloads[0].url, RESOURCE_DOMAIN.replace(/\/$/, '') + AUTH_AVATAR_PATH)
  assert.equal(env.downloads[0].header.Authorization, 'Bearer token-avatar')
  assert.equal(String(env.downloads[0].url).indexOf('token='), -1)

  const cdn = await socialAvatar.resolve('https://cdn.example.net/avatars/a.png')
  assert.equal(cdn, 'wxfile://tmp-avatar')
  assert.equal(env.downloads.length, 2)
  assert.equal(env.downloads[1].url, 'https://cdn.example.net/avatars/a.png')
  assert.equal(env.downloads[1].header.Authorization, undefined)

  const differentPort = await socialAvatar.resolve(
    'https://api.example.com:8443' + AUTH_AVATAR_PATH
  )
  assert.equal(differentPort, 'wxfile://tmp-avatar')
  assert.equal(env.downloads.length, 3)
  assert.equal(env.downloads[2].header.Authorization, undefined)

  const differentScheme = await socialAvatar.resolve('http://api.example.com' + AUTH_AVATAR_PATH)
  assert.equal(differentScheme, 'wxfile://tmp-avatar')
  assert.equal(env.downloads.length, 4)
  assert.equal(env.downloads[3].header.Authorization, undefined)

  const beforeNull = env.downloads.length
  const empty = await socialAvatar.resolve(null)
  assert.equal(empty, '/image/default.png')
  assert.equal(env.downloads.length, beforeNull)
})

test('social avatar ignores stale download after logout', async function () {
  const env = setupAvatarEnv({ token: 'token-avatar', deferSuccess: true })
  const socialAvatar = env.socialAvatar
  const pending = socialAvatar.resolve(AUTH_AVATAR_PATH)
  assert.equal(env.downloads.length, 1)
  assert.equal(env.downloads[0].header.Authorization, 'Bearer token-avatar')

  env.auth.clearSession()
  env.flushDeferred('wxfile://tmp-stale-old-account')
  const resolved = await pending
  assert.equal(resolved, '/image/default.png')

  const again = await socialAvatar.resolve(null)
  assert.equal(again, '/image/default.png')
})

test('mock returns existing message on same clientMessageId even after privacy restriction', async function () {
  const mock = setupMockRouter()
  const socialData = require(SOCIAL_DATA)
  const storageKeys = require(path.join(ROOT, 'constants/storage.js'))
  const token = await login(mock)

  const conversation = await mock.handleRequest({
    method: 'POST',
    path: '/api/social/conversations',
    sessionToken: token,
    data: { peerId: socialData.PEER_A_ID }
  })
  assert.equal(conversation.success, true)

  const clientMessageId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  const sent = await mock.handleRequest({
    method: 'POST',
    path: '/api/social/conversations/' + conversation.data.id + '/messages',
    sessionToken: token,
    data: { clientMessageId: clientMessageId, content: 'already sent' }
  })
  assert.equal(sent.success, true)

  const mockState = global.wx.getStorageSync(storageKeys.mockState)
  mockState.social.users.forEach(function (user) {
    if (user.id === socialData.PEER_A_ID) {
      user.dmPolicy = 'NONE'
    }
  })
  global.wx.setStorageSync(storageKeys.mockState, mockState)

  const retry = await mock.handleRequest({
    method: 'POST',
    path: '/api/social/conversations/' + conversation.data.id + '/messages',
    sessionToken: token,
    data: { clientMessageId: clientMessageId, content: 'already sent' }
  })
  assert.equal(retry.success, true)
  assert.equal(retry.data.id, sent.data.id)

  await assert.rejects(
    mock.handleRequest({
      method: 'POST',
      path: '/api/social/conversations/' + conversation.data.id + '/messages',
      sessionToken: token,
      data: {
        clientMessageId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        content: 'new after privacy'
      }
    }),
    function (error) {
      return error.errorCode === 'PRIVACY_RESTRICTED'
    }
  )
})
