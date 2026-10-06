const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const STORAGE_KEYS = require(path.join(ROOT, 'constants/storage.js'))
const MOCK_MODULE = path.join(ROOT, 'mock/index.js')
const SOCIAL_DATA = path.join(ROOT, 'mock/social-data.js')
const CHAT_PAGE = path.join(ROOT, 'pages/chat/chat.js')
const SOCIAL_API = path.join(ROOT, 'services/apis/social.js')
const REQUEST_MODULE = path.join(ROOT, 'services/request.js')
const AUTH_MODULE = path.join(ROOT, 'services/auth.js')
const DATA_SOURCE = path.join(ROOT, 'services/data-source.js')
const REALTIME = path.join(ROOT, 'services/social-realtime.js')
const USER_API_MODULE = path.join(ROOT, 'services/apis/user.js')
const PROFILE_MODULE = path.join(ROOT, 'constants/profile.js')
const COMMUNITY_MODULE = path.join(ROOT, 'constants/community.js')
const MOCK_DATA_MODULE = path.join(ROOT, 'mock/mock-data.js')
const I18N_MODULE = path.join(ROOT, 'utils/i18n.js')

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms)
  })
}

function setupRuntime() {
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
    },
    showNavigationBarLoading() {},
    hideNavigationBarLoading() {},
    showLoading() {},
    hideLoading() {},
    showModal() {},
    reLaunch() {},
    setNavigationBarTitle() {},
    connectSocket() {
      throw new Error('chat retry tests use mock mode')
    }
  }
  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }

  stubModule(DATA_SOURCE, {
    DATA_SOURCE_MODES: { remote: 'remote', mock: 'mock' },
    isMockMode() {
      return true
    },
    canUseDemoMode() {
      return true
    }
  })
  stubModule(USER_API_MODULE, {
    getProfileOptions() {
      return Promise.resolve({ success: true, data: {} })
    }
  })
  clearModule(I18N_MODULE)
  clearModule(COMMUNITY_MODULE)
  clearModule(PROFILE_MODULE)
  clearModule(MOCK_DATA_MODULE)
  clearModule(MOCK_MODULE)
  clearModule(AUTH_MODULE)
  clearModule(REQUEST_MODULE)
  clearModule(SOCIAL_API)
  clearModule(REALTIME)

  const mock = require(MOCK_MODULE)
  require(AUTH_MODULE)
  require(REQUEST_MODULE)
  const socialApi = require(SOCIAL_API)

  return { storage: storage, mock: mock, socialApi: socialApi }
}

async function login(mock, storage) {
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
  storage[STORAGE_KEYS.sessionToken] = result.data.token
  storage[STORAGE_KEYS.dataSourceMode] = 'mock'
  return result.data.token
}

function loadChatPage() {
  let captured = null
  global.Page = function (config) {
    captured = config
  }
  clearModule(CHAT_PAGE)
  require(CHAT_PAGE)
  assert.ok(captured, 'chat page config should be captured')
  return captured
}

function createPageInstance(pageConfig) {
  const instance = Object.create(pageConfig)
  instance.data = JSON.parse(JSON.stringify(pageConfig.data || {}))
  instance.setData = function (patch) {
    Object.assign(instance.data, patch)
  }
  instance._pageVisible = true
  return instance
}

test('chat retry with canSend=false reuses clientMessageId and merges committed mock result', async function () {
  const env = setupRuntime()
  const socialData = require(SOCIAL_DATA)
  const token = await login(env.mock, env.storage)

  const conversation = await env.mock.handleRequest({
    method: 'POST',
    path: '/api/social/conversations',
    sessionToken: token,
    data: { peerId: socialData.PEER_A_ID }
  })
  assert.equal(conversation.success, true)
  const conversationId = conversation.data.id
  const clientMessageId = 'c0ffeeee-0001-4000-8000-retry00000001'
  const content = 'retry after privacy'

  const sent = await env.mock.handleRequest({
    method: 'POST',
    path: '/api/social/conversations/' + conversationId + '/messages',
    sessionToken: token,
    data: { clientMessageId: clientMessageId, content: content }
  })
  assert.equal(sent.success, true)
  const committedId = sent.data.id

  const mockState = global.wx.getStorageSync(STORAGE_KEYS.mockState)
  mockState.social.users.forEach(function (user) {
    if (user.id === socialData.PEER_A_ID) {
      user.dmPolicy = 'NONE'
    }
  })
  global.wx.setStorageSync(STORAGE_KEYS.mockState, mockState)

  const pageConfig = loadChatPage()
  const page = createPageInstance(pageConfig)
  page.setData({
    conversationId: String(conversationId),
    selfId: socialData.SELF_PUBLIC_ID,
    canSend: false,
    sending: false,
    draft: 'should not send',
    messages: [
      page.decorateMessage(
        {
          conversationId: String(conversationId),
          senderId: socialData.SELF_PUBLIC_ID,
          clientMessageId: clientMessageId,
          content: content,
          status: 'failed',
          mine: true
        },
        socialData.SELF_PUBLIC_ID
      )
    ]
  })

  const beforeIds = (page.data.messages || [])
    .map(function (item) {
      return item.clientMessageId
    })
    .slice()

  page.retryMessage({ currentTarget: { dataset: { clientId: clientMessageId } } })
  await wait(400)

  assert.equal(page.data.sending, false)
  assert.equal(page.data.canSend, false)
  assert.equal(page.data.messages.length, 1)
  assert.equal(page.data.messages[0].id, committedId)
  assert.equal(page.data.messages[0].clientMessageId, clientMessageId)
  assert.equal(page.data.messages[0].status, 'sent')
  assert.deepEqual(beforeIds, [clientMessageId])

  // New drafts remain blocked by canSend; must not mint another clientMessageId.
  page.setData({ draft: 'brand new blocked draft' })
  page.send()
  await wait(200)
  assert.equal(page.data.messages.length, 1)
  assert.equal(page.data.messages[0].clientMessageId, clientMessageId)
  assert.equal(page.data.draft, 'brand new blocked draft')
})

test('chat retry of never-committed id stays failed without minting a new clientMessageId', async function () {
  const env = setupRuntime()
  const socialData = require(SOCIAL_DATA)
  const token = await login(env.mock, env.storage)

  const conversation = await env.mock.handleRequest({
    method: 'POST',
    path: '/api/social/conversations',
    sessionToken: token,
    data: { peerId: socialData.PEER_A_ID }
  })
  assert.equal(conversation.success, true)
  const conversationId = conversation.data.id

  const mockState = global.wx.getStorageSync(STORAGE_KEYS.mockState)
  mockState.social.users.forEach(function (user) {
    if (user.id === socialData.PEER_A_ID) {
      user.dmPolicy = 'NONE'
    }
  })
  global.wx.setStorageSync(STORAGE_KEYS.mockState, mockState)

  const pageConfig = loadChatPage()
  const page = createPageInstance(pageConfig)
  const failedClientId = 'c0ffeeee-0002-4000-8000-retry00000002'
  page.setData({
    conversationId: String(conversationId),
    selfId: socialData.SELF_PUBLIC_ID,
    canSend: false,
    sending: false,
    messages: [
      page.decorateMessage(
        {
          conversationId: String(conversationId),
          senderId: socialData.SELF_PUBLIC_ID,
          clientMessageId: failedClientId,
          content: 'never landed',
          status: 'failed',
          mine: true
        },
        socialData.SELF_PUBLIC_ID
      )
    ]
  })

  page.retryMessage({ currentTarget: { dataset: { clientId: failedClientId } } })
  await wait(400)

  const failed = (page.data.messages || []).filter(function (item) {
    return item.clientMessageId === failedClientId
  })
  assert.equal(failed.length, 1)
  assert.equal(failed[0].status, 'failed')
  assert.equal(!!failed[0].id, false)
  assert.equal(page.data.canSend, false)
  assert.equal(
    (page.data.messages || []).some(function (item) {
      return item.mine && item.content === 'never landed' && item.clientMessageId !== failedClientId
    }),
    false
  )
})

test('chat loadEarlier preserves scrollIntoView on previous first message', async function () {
  setupRuntime()
  stubModule(SOCIAL_API, {
    getMessages() {
      return Promise.resolve({
        success: true,
        data: {
          items: [
            {
              id: 'earlier-1',
              conversationId: '9001',
              senderId: 'peer',
              clientMessageId: 'earlier-client',
              content: 'older',
              seq: '1'
            }
          ],
          nextCursor: null,
          hasMore: false
        }
      })
    }
  })
  clearModule(CHAT_PAGE)
  const pageConfig = loadChatPage()
  const page = createPageInstance(pageConfig)
  const selfId = 'self'
  const current = page.decorateMessage(
    {
      id: 'later-1',
      conversationId: '9001',
      senderId: 'peer',
      clientMessageId: 'later-client',
      content: 'newer',
      seq: '2'
    },
    selfId
  )
  page.setData({
    conversationId: '9001',
    selfId: selfId,
    hasMoreEarlier: true,
    earlierCursor: '2',
    messages: [current],
    scrollIntoView: 'msg-' + current.localKey
  })

  page.loadEarlier()
  await wait(20)

  assert.equal(page.data.messages.length, 2)
  assert.equal(page.data.messages[0].id, 'earlier-1')
  assert.equal(page.data.scrollIntoView, 'msg-' + current.localKey)
})
