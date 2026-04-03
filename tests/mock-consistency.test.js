const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const USER_API_MODULE = path.join(ROOT, 'services/apis/user.js')
const PROFILE_MODULE = path.join(ROOT, 'constants/profile.js')
const COMMUNITY_MODULE = path.join(ROOT, 'constants/community.js')
const MOCK_COMMUNITY_MODULE = path.join(ROOT, 'mock/community.js')
const MOCK_DATA_MODULE = path.join(ROOT, 'mock/mock-data.js')
const ENDPOINTS_MODULE = path.join(ROOT, 'services/endpoints.js')

function requiresFields(item, fields, label) {
  fields.forEach(function (field) {
    assert.ok(
      item[field] !== undefined && item[field] !== null && item[field] !== '',
      label + ': missing field "' + field + '" on id=' + (item.id || item.orderId || '(unknown)')
    )
  })
}

function stubProfileDeps() {
  clearModule(COMMUNITY_MODULE)
  clearModule(PROFILE_MODULE)
  stubModule(USER_API_MODULE, {
    getProfileOptions: function () {
      return Promise.resolve({ success: true, data: {} })
    }
  })
}

function loadMockData() {
  stubProfileDeps()
  clearModule(MOCK_DATA_MODULE)
  return require(MOCK_DATA_MODULE)
}

function loadCommunityHandler() {
  stubProfileDeps()
  clearModule(MOCK_COMMUNITY_MODULE)
  return require(MOCK_COMMUNITY_MODULE)
}

function makeMockUtils() {
  var communityState = null
  return {
    ensureAuthorized: function () {
      return null
    },
    readState: function () {
      return { profile: { username: 'gdeiassistant' }, community: communityState }
    },
    writeState: function (state) {
      communityState = state.community
    },
    buildSuccess: function (data) {
      return { success: true, data: data }
    },
    resolveWithDelay: function (result) {
      return Promise.resolve(result)
    },
    cloneValue: function (value) {
      return JSON.parse(JSON.stringify(value))
    }
  }
}

function callHandler(handler, apiPath) {
  var utils = makeMockUtils()
  return handler.handleRequest({
    path: apiPath,
    method: 'GET',
    payload: {},
    query: {},
    token: 'mock-token',
    utils: utils
  })
}

// ── Community mock data consistency ─────────────────────────────────────────

test('secondhand mock items have required fields', async function () {
  var handler = loadCommunityHandler()
  var result = await callHandler(handler, '/api/ershou/item/start/0')

  assert.ok(result && result.success, 'secondhand list request should succeed')
  var items = result.data
  assert.ok(Array.isArray(items) && items.length > 0, 'secondhandItems should not be empty')

  items.forEach(function (item) {
    requiresFields(
      item,
      ['id', 'name', 'description', 'price', 'state', 'publishTime'],
      'secondhand'
    )
  })
})

test('lostandfound mock items have required fields', async function () {
  var handler = loadCommunityHandler()
  var result = await callHandler(handler, '/api/lostandfound/lostitem/start/0')

  assert.ok(result && result.success, 'lostandfound list request should succeed')
  var items = result.data
  assert.ok(Array.isArray(items) && items.length > 0, 'lostAndFoundItems should not be empty')

  items.forEach(function (item) {
    requiresFields(
      item,
      ['id', 'name', 'description', 'location', 'lostType', 'itemType', 'state', 'publishTime'],
      'lostandfound'
    )
  })
})

test('express mock items have required fields', async function () {
  var handler = loadCommunityHandler()
  var result = await callHandler(handler, '/api/express/start/0/size/20')

  assert.ok(result && result.success, 'express list request should succeed')
  var items = result.data
  assert.ok(Array.isArray(items) && items.length > 0, 'expressItems should not be empty')

  items.forEach(function (item) {
    requiresFields(
      item,
      ['id', 'nickname', 'content', 'selfGender', 'personGender', 'publishTime'],
      'express'
    )
  })
})

test('delivery mock orders have required fields', async function () {
  var handler = loadCommunityHandler()
  var result = await callHandler(handler, '/api/delivery/order/start/0/size/20')

  assert.ok(result && result.success, 'delivery list request should succeed')
  var orders = result.data
  assert.ok(Array.isArray(orders) && orders.length > 0, 'deliveryOrders should not be empty')

  orders.forEach(function (order) {
    requiresFields(
      order,
      ['orderId', 'name', 'number', 'phone', 'price', 'company', 'address', 'state', 'orderTime'],
      'delivery'
    )
  })
})

test('secret mock posts have required fields', async function () {
  var handler = loadCommunityHandler()
  var result = await callHandler(handler, '/api/secret/info/start/0/size/20')

  assert.ok(result && result.success, 'secret list request should succeed')
  var items = result.data
  assert.ok(Array.isArray(items) && items.length > 0, 'secrets should not be empty')

  items.forEach(function (item) {
    requiresFields(item, ['id', 'content', 'type', 'theme', 'publishTime'], 'secret')
  })
})

// ── News mock data consistency ──────────────────────────────────────────────

test('mock news data has required fields across all types', function () {
  var mockData = loadMockData()
  var newsByType = mockData.NEWS_BY_TYPE
  assert.ok(newsByType, 'NEWS_BY_TYPE should exist')

  var typeKeys = Object.keys(newsByType)
  assert.ok(typeKeys.length > 0, 'NEWS_BY_TYPE should have at least one category')

  typeKeys.forEach(function (type) {
    var items = newsByType[type]
    assert.ok(
      Array.isArray(items) && items.length > 0,
      'news type ' + type + ' should not be empty'
    )

    items.forEach(function (item) {
      requiresFields(item, ['id', 'title', 'publishDate'], 'news')
    })
  })
})

test('mock announcements have required fields', function () {
  var mockData = loadMockData()
  var list = mockData.ANNOUNCEMENT_LIST
  assert.ok(Array.isArray(list) && list.length > 0, 'ANNOUNCEMENT_LIST should not be empty')

  list.forEach(function (item) {
    requiresFields(item, ['id', 'title', 'content', 'publishTime'], 'announcement')
  })
})

// ── Endpoints URL patterns ──────────────────────────────────────────────────

test('endpoints.js returns correct URL patterns for key routes', function () {
  var endpoints = require(ENDPOINTS_MODULE)

  assert.equal(endpoints.auth.login, '/api/auth/login')
  assert.equal(endpoints.library.borrow, '/api/library/borrow')
  assert.equal(endpoints.library.renew, '/api/library/renew')

  assert.match(
    endpoints.info.news(1, 0, 10),
    /^\/api\/information\/news\/type\/1\/start\/0\/size\/10$/
  )
  assert.match(endpoints.info.newsDetail('abc'), /^\/api\/information\/news\/id\/abc$/)

  assert.match(endpoints.community.secondhand.list(0), /^\/api\/ershou\/item\/start\/0$/)
  assert.match(endpoints.community.secondhand.detail(42), /^\/api\/ershou\/item\/id\/42$/)
  assert.match(
    endpoints.community.lostAndFound.lost(0),
    /^\/api\/lostandfound\/lostitem\/start\/0$/
  )
  assert.match(endpoints.community.express.list(0, 10), /^\/api\/express\/start\/0\/size\/10$/)
  assert.match(
    endpoints.community.delivery.list(0, 10),
    /^\/api\/delivery\/order\/start\/0\/size\/10$/
  )
  assert.match(endpoints.community.secret.list(0, 10), /^\/api\/secret\/info\/start\/0\/size\/10$/)
  assert.match(endpoints.community.topic.list(0, 10), /^\/api\/topic\/start\/0\/size\/10$/)
  assert.match(
    endpoints.community.photograph.list(1, 0, 10),
    /^\/api\/photograph\/type\/1\/start\/0\/size\/10$/
  )
  assert.match(endpoints.community.dating.list(0, 0), /^\/api\/dating\/profile\/area\/0\/start\/0$/)

  assert.match(
    endpoints.messages.announcements(0, 5),
    /^\/api\/information\/announcement\/start\/0\/size\/5$/
  )
  assert.match(
    endpoints.messages.interactionList(0, 10),
    /^\/api\/information\/message\/interaction\/start\/0\/size\/10$/
  )
})
