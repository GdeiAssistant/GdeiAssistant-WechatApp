const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const MOCK_MODULE = path.join(ROOT, 'mock/index.js')
const SOCIAL_DATA = path.join(ROOT, 'mock/social-data.js')
const ENDPOINTS = path.join(ROOT, 'services/endpoints.js')
const SOCIAL_API = path.join(ROOT, 'services/apis/social.js')
const SOCIAL_UTILS = path.join(ROOT, 'utils/social.js')
const REALTIME = path.join(ROOT, 'services/social-realtime.js')
const USER_API_MODULE = path.join(ROOT, 'services/apis/user.js')
const PROFILE_MODULE = path.join(ROOT, 'constants/profile.js')
const COMMUNITY_MODULE = path.join(ROOT, 'constants/community.js')
const MOCK_DATA_MODULE = path.join(ROOT, 'mock/mock-data.js')

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
  assert.ok(result.data && result.data.token)
  return result.data.token
}

test('social endpoints cover frozen contract paths', function () {
  clearModule(ENDPOINTS)
  const endpoints = require(ENDPOINTS)
  assert.equal(endpoints.social.me, '/api/social/me')
  assert.equal(endpoints.social.users, '/api/social/users')
  assert.equal(endpoints.social.privacy, '/api/social/privacy')
  assert.equal(endpoints.social.unread, '/api/social/unread')
  assert.equal(endpoints.social.conversations, '/api/social/conversations')
  assert.equal(endpoints.social.realtime, '/api/social/realtime')
  assert.match(endpoints.social.user('abc'), /\/api\/social\/users\/abc$/)
  assert.match(endpoints.social.follow('abc'), /\/follow$/)
  assert.match(endpoints.social.messages('9'), /\/messages$/)
})

test('social utils merge messages by id and clientMessageId', function () {
  clearModule(SOCIAL_UTILS)
  const socialUtils = require(SOCIAL_UTILS)
  const merged = socialUtils.mergeMessagesById(
    [
      {
        conversationId: '9001',
        senderId: 'self',
        clientMessageId: 'c1',
        content: 'a',
        status: 'pending'
      }
    ],
    [
      {
        id: '1',
        conversationId: '9001',
        senderId: 'self',
        clientMessageId: 'c1',
        content: 'a',
        seq: '1'
      }
    ]
  )
  assert.equal(merged.length, 1)
  assert.equal(merged[0].id, '1')
})

test('mock social me/search/follow/privacy/conversation/message flow', async function () {
  const mock = setupMockRouter()
  const socialData = require(SOCIAL_DATA)
  const token = await login(mock)

  const me = await mock.handleRequest({
    method: 'GET',
    path: '/api/social/me',
    sessionToken: token
  })
  assert.equal(me.success, true)
  assert.equal(me.data.id, socialData.SELF_PUBLIC_ID)
  assert.equal(me.data.relationship, 'SELF')

  const search = await mock.handleRequest({
    method: 'GET',
    path: '/api/social/users?query=' + encodeURIComponent('阿晴'),
    sessionToken: token
  })
  assert.equal(search.success, true)
  assert.ok(
    search.data.items.some(function (item) {
      return item.id === socialData.PEER_A_ID
    })
  )

  const peer = await mock.handleRequest({
    method: 'GET',
    path: '/api/social/users/' + socialData.PEER_C_ID,
    sessionToken: token
  })
  assert.equal(peer.success, true)
  assert.equal(peer.data.canMessage, true)

  const follow = await mock.handleRequest({
    method: 'PUT',
    path: '/api/social/users/' + socialData.PEER_C_ID + '/follow',
    sessionToken: token
  })
  assert.equal(follow.success, true)
  assert.ok(follow.data.relationship === 'FOLLOWING' || follow.data.relationship === 'MUTUAL')

  const privacy = await mock.handleRequest({
    method: 'PUT',
    path: '/api/social/privacy',
    sessionToken: token,
    data: { dmPolicy: 'FOLLOWING' }
  })
  assert.equal(privacy.success, true)
  assert.equal(privacy.data.dmPolicy, 'FOLLOWING')

  const conversation = await mock.handleRequest({
    method: 'POST',
    path: '/api/social/conversations',
    sessionToken: token,
    data: { peerId: socialData.PEER_A_ID }
  })
  assert.equal(conversation.success, true)
  assert.ok(conversation.data.id)

  const clientMessageId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  const sent = await mock.handleRequest({
    method: 'POST',
    path: '/api/social/conversations/' + conversation.data.id + '/messages',
    sessionToken: token,
    data: { clientMessageId: clientMessageId, content: '你好，约自习吗？' }
  })
  assert.equal(sent.success, true)
  assert.equal(sent.data.clientMessageId, clientMessageId)

  const retry = await mock.handleRequest({
    method: 'POST',
    path: '/api/social/conversations/' + conversation.data.id + '/messages',
    sessionToken: token,
    data: { clientMessageId: clientMessageId, content: '你好，约自习吗？' }
  })
  assert.equal(retry.success, true)
  assert.equal(retry.data.id, sent.data.id)

  await assert.rejects(
    mock.handleRequest({
      method: 'POST',
      path: '/api/social/conversations/' + conversation.data.id + '/messages',
      sessionToken: token,
      data: { clientMessageId: clientMessageId, content: '不同正文' }
    }),
    function (error) {
      return error.errorCode === 'CLIENT_MESSAGE_CONFLICT'
    }
  )

  const unread = await mock.handleRequest({
    method: 'GET',
    path: '/api/social/unread',
    sessionToken: token
  })
  assert.equal(unread.success, true)
  assert.equal(typeof unread.data.total, 'number')
})

test('mock social privacy NONE blocks inbound but keeps own send path gated by peer', async function () {
  const mock = setupMockRouter()
  const socialData = require(SOCIAL_DATA)
  const token = await login(mock)

  await assert.rejects(
    mock.handleRequest({
      method: 'POST',
      path: '/api/social/conversations',
      sessionToken: token,
      data: { peerId: socialData.PEER_D_ID }
    }),
    function (error) {
      return error.errorCode === 'PRIVACY_RESTRICTED'
    }
  )
})

test('mock social block removes follows and returns CONTACT_UNAVAILABLE', async function () {
  const mock = setupMockRouter()
  const socialData = require(SOCIAL_DATA)
  const token = await login(mock)

  const blocked = await mock.handleRequest({
    method: 'PUT',
    path: '/api/social/users/' + socialData.PEER_A_ID + '/block',
    sessionToken: token
  })
  assert.equal(blocked.success, true)
  assert.equal(blocked.data.blocked, true)

  await assert.rejects(
    mock.handleRequest({
      method: 'PUT',
      path: '/api/social/users/' + socialData.PEER_A_ID + '/follow',
      sessionToken: token
    }),
    function (error) {
      return error.errorCode === 'CONTACT_UNAVAILABLE'
    }
  )
})

test('social realtime mock ready and disconnect', function () {
  const storageKeys = require(path.join(ROOT, 'constants/storage.js'))
  clearModule(REALTIME)
  const storage = {}
  storage[storageKeys.sessionToken] = 'mock-token'
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
      throw new Error('should use mock mode')
    }
  }
  stubModule(path.join(ROOT, 'services/data-source.js'), {
    isMockMode() {
      return true
    }
  })
  clearModule(path.join(ROOT, 'services/auth.js'))
  clearModule(REALTIME)
  const realtime = require(REALTIME)
  let ready = false
  realtime.on('ready', function () {
    ready = true
  })
  realtime.connect()
  assert.equal(realtime.isReady(), true)
  // ready event is scheduled on next tick in mock mode
  return new Promise(function (resolve) {
    setTimeout(function () {
      assert.equal(ready, true)
      realtime.disconnect()
      assert.equal(realtime.isReady(), false)
      resolve()
    }, 10)
  })
})
test('social api module exports required methods', function () {
  clearModule(SOCIAL_API)
  stubModule(path.join(ROOT, 'services/request.js'), {
    request() {
      return Promise.resolve({ success: true, data: null })
    }
  })
  clearModule(SOCIAL_API)
  const socialApi = require(SOCIAL_API)
  ;[
    'getMe',
    'searchUsers',
    'getUser',
    'getRelationships',
    'followUser',
    'unfollowUser',
    'blockUser',
    'unblockUser',
    'getBlocks',
    'getPrivacy',
    'updatePrivacy',
    'getUnread',
    'createConversation',
    'getConversations',
    'getConversation',
    'getMessages',
    'sendMessage',
    'sendImageMessage',
    'markConversationRead'
  ].forEach(function (name) {
    assert.equal(typeof socialApi[name], 'function')
  })
})
