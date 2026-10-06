const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const STORAGE_KEYS = require(path.join(ROOT, 'constants/storage.js'))
const MOCK_MODULE = path.join(ROOT, 'mock/index.js')
const USER_API_MODULE = path.join(ROOT, 'services/apis/user.js')
const PROFILE_MODULE = path.join(ROOT, 'constants/profile.js')
const COMMUNITY_MODULE = path.join(ROOT, 'constants/community.js')
const MOCK_DATA_MODULE = path.join(ROOT, 'mock/mock-data.js')
const I18N_MODULE = path.join(ROOT, 'utils/i18n.js')

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

function assertNoIdentityLeak(payload) {
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'owner'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'likedUsers'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'realname'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'authorId'), false)
  assert.equal(payload.username == null || payload.username === null, true)
}

test('secret public responses hide owner/likedUsers while internal state keeps them', async function () {
  const mock = setupMockRouter()
  const token = await login(mock)

  const list = await mock.handleRequest({
    method: 'GET',
    path: '/api/secret/info/start/0/size/10',
    sessionToken: token
  })
  assert.equal(list.success, true)
  assert.ok(Array.isArray(list.data) && list.data.length > 0)
  list.data.forEach(assertNoIdentityLeak)

  const detail = await mock.handleRequest({
    method: 'GET',
    path: '/api/secret/id/301',
    sessionToken: token
  })
  assert.equal(detail.success, true)
  assertNoIdentityLeak(detail.data)
  assert.ok(detail.data.content)

  const comments = await mock.handleRequest({
    method: 'GET',
    path: '/api/secret/id/301/comments',
    sessionToken: token
  })
  assert.equal(comments.success, true)
  assert.ok(comments.data.length > 0)
  comments.data.forEach(function (item) {
    assert.equal(Object.prototype.hasOwnProperty.call(item, 'username'), false)
    assert.ok(item.nickname)
  })

  const state = global.wx.getStorageSync(STORAGE_KEYS.mockState)
  const secret = ((state.community && state.community.secrets) || []).filter(function (item) {
    return Number(item.id) === 301
  })[0]
  assert.ok(secret)
  assert.equal(typeof secret.owner, 'string')
  assert.ok(Array.isArray(secret.likedUsers))
})

test('express public responses null username, hide realname/owner, keep nickname and guess internals', async function () {
  const mock = setupMockRouter()
  const token = await login(mock)

  const detail = await mock.handleRequest({
    method: 'GET',
    path: '/api/express/id/401',
    sessionToken: token
  })
  assert.equal(detail.success, true)
  assert.equal(detail.data.username, null)
  assert.equal(Object.prototype.hasOwnProperty.call(detail.data, 'realname'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(detail.data, 'owner'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(detail.data, 'likedUsers'), false)
  assert.ok(detail.data.nickname)
  assert.equal(detail.data.canGuess, true)

  const comments = await mock.handleRequest({
    method: 'GET',
    path: '/api/express/id/401/comment',
    sessionToken: token
  })
  assert.equal(comments.success, true)
  comments.data.forEach(function (item) {
    assert.equal(Object.prototype.hasOwnProperty.call(item, 'username'), false)
    assert.ok(item.nickname)
  })

  const state = global.wx.getStorageSync(STORAGE_KEYS.mockState)
  const express = (
    state.community && state.community.expressItems ? state.community.expressItems : []
  ).filter(function (item) {
    return Number(item.id) === 401
  })[0]
  assert.ok(express)
  assert.equal(express.realname, '林知远')
  assert.equal(typeof express.owner, 'string')
  assert.ok(Array.isArray(express.likedUsers))

  const guess = await mock.handleRequest({
    method: 'POST',
    path: '/api/express/id/401/guess',
    sessionToken: token,
    data: { name: '林知远' }
  })
  assert.equal(guess.success, true)
  assert.equal(guess.data, true)
})
