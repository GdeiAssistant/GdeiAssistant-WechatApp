const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')

// Stub i18n so handler modules can load without the full WeChat environment
const I18N_MODULE = path.join(ROOT, 'utils/i18n.js')
stubModule(I18N_MODULE, {
  t: function (key) {
    return key
  },
  tReplace: function (key) {
    return key
  }
})

// Stub request module
const REQUEST_MODULE = path.join(ROOT, 'services/request.js')
stubModule(REQUEST_MODULE, {
  request: function () {
    return Promise.resolve({ success: true })
  }
})

// Clear registry and handler caches so they pick up our stubs
clearModule(path.join(ROOT, 'services/community/module-handlers/marketplace.js'))
clearModule(path.join(ROOT, 'services/community/module-handlers/lostandfound.js'))
clearModule(path.join(ROOT, 'services/community/module-handlers/secret.js'))
clearModule(path.join(ROOT, 'services/community/module-handlers/express.js'))
clearModule(path.join(ROOT, 'services/community/module-handlers/topic.js'))
clearModule(path.join(ROOT, 'services/community/module-handlers/photograph.js'))
clearModule(path.join(ROOT, 'services/community/module-handlers/delivery.js'))
clearModule(path.join(ROOT, 'services/community/module-handlers/dating.js'))
clearModule(path.join(ROOT, 'services/community/registry.js'))

const { getModuleHandler } = require(path.join(ROOT, 'services/community/registry.js'))

test('marketplace handler has feedEndpoint, tabs, and normalizeItem', function () {
  const handler = getModuleHandler('marketplace')

  assert.ok(handler, 'marketplace handler should exist')
  assert.equal(typeof handler.getFeed, 'function', 'should have getFeed')
  assert.equal(typeof handler.buildListTabs, 'function', 'should have buildListTabs')
  assert.equal(typeof handler.normalizeItem, 'function', 'should have normalizeItem')
  assert.equal(typeof handler.getDetail, 'function', 'should have getDetail')
  assert.equal(typeof handler.getCenter, 'function', 'should have getCenter')
  assert.equal(typeof handler.publish, 'function', 'should have publish')
  assert.equal(typeof handler.buildCenterTabs, 'function', 'should have buildCenterTabs')
  assert.equal(typeof handler.normalizeCenterData, 'function', 'should have normalizeCenterData')
  assert.equal(typeof handler.buildFeedOptions, 'function', 'should have buildFeedOptions')
  assert.equal(handler.searchable, true, 'should be searchable')
})

test('lostandfound handler has feedEndpoint, tabs, and normalizeItem', function () {
  const handler = getModuleHandler('lostandfound')

  assert.ok(handler, 'lostandfound handler should exist')
  assert.equal(typeof handler.getFeed, 'function', 'should have getFeed')
  assert.equal(typeof handler.buildListTabs, 'function', 'should have buildListTabs')
  assert.equal(typeof handler.normalizeItem, 'function', 'should have normalizeItem')
  assert.equal(typeof handler.getDetail, 'function', 'should have getDetail')
  assert.equal(typeof handler.getCenter, 'function', 'should have getCenter')
  assert.equal(typeof handler.publish, 'function', 'should have publish')
  assert.equal(typeof handler.buildCenterTabs, 'function', 'should have buildCenterTabs')
  assert.equal(typeof handler.normalizeCenterData, 'function', 'should have normalizeCenterData')
  assert.equal(typeof handler.buildFeedOptions, 'function', 'should have buildFeedOptions')
  assert.equal(handler.searchable, true, 'should be searchable')
})

test('getModuleHandler returns null for unknown moduleId', function () {
  assert.equal(getModuleHandler('nonexistent'), null)
  assert.equal(getModuleHandler(''), null)
  assert.equal(getModuleHandler(undefined), null)
})

test('ershou alias resolves to same handler as marketplace', function () {
  const marketplace = getModuleHandler('marketplace')
  const ershou = getModuleHandler('ershou')
  assert.ok(marketplace, 'marketplace handler should exist')
  assert.ok(ershou, 'ershou handler should exist')
  assert.equal(marketplace, ershou, 'ershou should be the same handler as marketplace')
})

test('marketplace normalizeItem produces expected shape', function () {
  const handler = getModuleHandler('marketplace')
  const result = handler.normalizeItem({
    id: 42,
    name: 'Test Item',
    description: 'A description',
    pictureURL: ['/img/test.png'],
    price: 19.99,
    type: 1,
    location: 'Campus A',
    publishTime: '2025-01-01'
  })

  assert.equal(result.id, 42)
  assert.equal(result.title, 'Test Item')
  assert.equal(result.summary, 'A description')
  assert.equal(result.cover, '/img/test.png')
  assert.equal(result.priceText, '19.99')
  assert.equal(result.metaText, 'Campus A')
  assert.equal(result.timeText, '2025-01-01')
  assert.ok(result.raw, 'should preserve raw item')
})

test('lostandfound normalizeItem produces expected shape', function () {
  const handler = getModuleHandler('lostandfound')
  const result = handler.normalizeItem({
    id: 99,
    name: 'Lost Phone',
    description: 'Black phone',
    pictureURL: ['/img/phone.png'],
    lostType: 0,
    itemType: 0,
    location: 'Library',
    publishTime: '2025-02-01'
  })

  assert.equal(result.id, 99)
  assert.equal(result.title, 'Lost Phone')
  assert.equal(result.summary, 'Black phone')
  assert.equal(result.cover, '/img/phone.png')
  assert.equal(result.metaText, 'Library')
  assert.equal(result.timeText, '2025-02-01')
  assert.ok(result.raw, 'should preserve raw item')
})

test('marketplace buildFeedOptions sets type from activeTab', function () {
  const handler = getModuleHandler('marketplace')
  const result = handler.buildFeedOptions({ start: 0, size: 10, keyword: '' }, { value: 3 })
  assert.equal(result.type, 3)
})

test('lostandfound buildFeedOptions sets mode from activeTab', function () {
  const handler = getModuleHandler('lostandfound')
  const result = handler.buildFeedOptions({ start: 0, size: 10, keyword: '' }, { value: 1 })
  assert.equal(result.mode, 1)
})

test('secret handler has expected shape', function () {
  const handler = getModuleHandler('secret')

  assert.ok(handler, 'secret handler should exist')
  assert.equal(typeof handler.getFeed, 'function', 'should have getFeed')
  assert.equal(typeof handler.buildListTabs, 'function', 'should have buildListTabs')
  assert.equal(typeof handler.normalizeItem, 'function', 'should have normalizeItem')
  assert.equal(typeof handler.getDetail, 'function', 'should have getDetail')
  assert.equal(typeof handler.getCenter, 'function', 'should have getCenter')
  assert.equal(typeof handler.publish, 'function', 'should have publish')
  assert.equal(typeof handler.buildFeedOptions, 'function', 'should have buildFeedOptions')
  assert.equal(typeof handler.buildCenterTabs, 'function', 'should have buildCenterTabs')
  assert.equal(typeof handler.normalizeCenterData, 'function', 'should have normalizeCenterData')
})

test('express handler has expected shape', function () {
  const handler = getModuleHandler('express')

  assert.ok(handler, 'express handler should exist')
  assert.equal(typeof handler.getFeed, 'function', 'should have getFeed')
  assert.equal(typeof handler.buildListTabs, 'function', 'should have buildListTabs')
  assert.equal(typeof handler.normalizeItem, 'function', 'should have normalizeItem')
  assert.equal(typeof handler.getDetail, 'function', 'should have getDetail')
  assert.equal(typeof handler.getCenter, 'function', 'should have getCenter')
  assert.equal(typeof handler.publish, 'function', 'should have publish')
  assert.equal(typeof handler.buildFeedOptions, 'function', 'should have buildFeedOptions')
  assert.equal(typeof handler.buildCenterTabs, 'function', 'should have buildCenterTabs')
  assert.equal(typeof handler.normalizeCenterData, 'function', 'should have normalizeCenterData')
  assert.equal(handler.searchable, true, 'express should be searchable')
})

test('secret normalizeItem produces expected shape', function () {
  const handler = getModuleHandler('secret')
  const result = handler.normalizeItem({
    id: 10,
    type: 0,
    content: 'My secret message',
    likeCount: 5,
    commentCount: 3,
    publishTime: '2025-03-01',
    timer: 0
  })

  assert.equal(result.id, 10)
  assert.ok(result.title, 'should have a title')
  assert.equal(result.summary, 'My secret message')
  assert.equal(result.likeCount, 5)
  assert.equal(result.commentCount, 3)
  assert.equal(result.timeText, '2025-03-01')
  assert.ok(result.raw, 'should preserve raw item')
})

test('express normalizeItem produces expected shape', function () {
  const handler = getModuleHandler('express')
  const result = handler.normalizeItem({
    id: 20,
    nickname: 'Alice',
    name: 'Bob',
    content: 'I like you',
    likeCount: 8,
    commentCount: 2,
    publishTime: '2025-04-01'
  })

  assert.equal(result.id, 20)
  assert.ok(result.title, 'should have a title')
  assert.equal(result.summary, 'I like you')
  assert.equal(result.likeCount, 8)
  assert.equal(result.commentCount, 2)
  assert.equal(result.timeText, '2025-04-01')
  assert.ok(result.raw, 'should preserve raw item')
})

test('topic handler has expected shape', function () {
  const handler = getModuleHandler('topic')

  assert.ok(handler, 'topic handler should exist')
  assert.equal(typeof handler.getFeed, 'function', 'should have getFeed')
  assert.equal(typeof handler.buildListTabs, 'function', 'should have buildListTabs')
  assert.equal(typeof handler.normalizeItem, 'function', 'should have normalizeItem')
  assert.equal(typeof handler.getDetail, 'function', 'should have getDetail')
  assert.equal(typeof handler.getCenter, 'function', 'should have getCenter')
  assert.equal(typeof handler.publish, 'function', 'should have publish')
  assert.equal(typeof handler.buildFeedOptions, 'function', 'should have buildFeedOptions')
  assert.equal(typeof handler.buildCenterTabs, 'function', 'should have buildCenterTabs')
  assert.equal(typeof handler.normalizeCenterData, 'function', 'should have normalizeCenterData')
  assert.equal(handler.searchable, true, 'topic should be searchable')
})

test('photograph handler has expected shape', function () {
  const handler = getModuleHandler('photograph')

  assert.ok(handler, 'photograph handler should exist')
  assert.equal(typeof handler.getFeed, 'function', 'should have getFeed')
  assert.equal(typeof handler.buildListTabs, 'function', 'should have buildListTabs')
  assert.equal(typeof handler.normalizeItem, 'function', 'should have normalizeItem')
  assert.equal(typeof handler.getDetail, 'function', 'should have getDetail')
  assert.equal(typeof handler.getCenter, 'function', 'should have getCenter')
  assert.equal(typeof handler.publish, 'function', 'should have publish')
  assert.equal(typeof handler.buildFeedOptions, 'function', 'should have buildFeedOptions')
  assert.equal(typeof handler.buildCenterTabs, 'function', 'should have buildCenterTabs')
  assert.equal(typeof handler.normalizeCenterData, 'function', 'should have normalizeCenterData')
})

test('topic normalizeItem produces expected shape', function () {
  const handler = getModuleHandler('topic')
  const result = handler.normalizeItem({
    id: 30,
    topic: 'Campus Life',
    content: 'Great day on campus',
    imageUrls: ['/img/topic1.png', '/img/topic2.png'],
    likeCount: 12,
    publishTime: '2025-05-01'
  })

  assert.equal(result.id, 30)
  assert.ok(result.title, 'should have a title')
  assert.equal(result.title, '#Campus Life')
  assert.equal(result.summary, 'Great day on campus')
  assert.equal(result.cover, '/img/topic1.png')
  assert.equal(result.likeCount, 12)
  assert.equal(result.timeText, '2025-05-01')
  assert.ok(result.raw, 'should preserve raw item')
})

test('photograph normalizeItem produces expected shape', function () {
  const handler = getModuleHandler('photograph')
  const result = handler.normalizeItem({
    id: 40,
    title: 'Sunset Photo',
    content: 'Beautiful sunset',
    firstImageUrl: '/img/sunset.png',
    imageUrls: ['/img/sunset.png'],
    likeCount: 20,
    commentCount: 5,
    createTime: '2025-06-01'
  })

  assert.equal(result.id, 40)
  assert.equal(result.title, 'Sunset Photo')
  assert.equal(result.summary, 'Beautiful sunset')
  assert.equal(result.cover, '/img/sunset.png')
  assert.equal(result.likeCount, 20)
  assert.equal(result.commentCount, 5)
  assert.equal(result.timeText, '2025-06-01')
  assert.ok(result.raw, 'should preserve raw item')
})

test('photograph normalizeItem falls back to imageUrls when firstImageUrl is missing', function () {
  const handler = getModuleHandler('photograph')
  const result = handler.normalizeItem({
    id: 41,
    title: 'No First Image',
    imageUrls: ['/img/fallback.png']
  })

  assert.equal(result.cover, '/img/fallback.png')
})

test('photograph normalizeItem uses default cover when no images', function () {
  const handler = getModuleHandler('photograph')
  const result = handler.normalizeItem({
    id: 42,
    title: 'No Images'
  })

  assert.equal(result.cover, '/image/photograph.png')
})

test('delivery handler has expected shape', function () {
  const handler = getModuleHandler('delivery')

  assert.ok(handler, 'delivery handler should exist')
  assert.equal(typeof handler.getFeed, 'function', 'should have getFeed')
  assert.equal(typeof handler.buildListTabs, 'function', 'should have buildListTabs')
  assert.equal(typeof handler.normalizeItem, 'function', 'should have normalizeItem')
  assert.equal(typeof handler.getDetail, 'function', 'should have getDetail')
  assert.equal(typeof handler.getCenter, 'function', 'should have getCenter')
  assert.equal(typeof handler.publish, 'function', 'should have publish')
  assert.equal(typeof handler.buildFeedOptions, 'function', 'should have buildFeedOptions')
  assert.equal(typeof handler.buildCenterTabs, 'function', 'should have buildCenterTabs')
  assert.equal(typeof handler.normalizeCenterData, 'function', 'should have normalizeCenterData')
  assert.equal(typeof handler.filterFeedResults, 'function', 'should have filterFeedResults')
})

test('dating handler has expected shape', function () {
  const handler = getModuleHandler('dating')

  assert.ok(handler, 'dating handler should exist')
  assert.equal(typeof handler.getFeed, 'function', 'should have getFeed')
  assert.equal(typeof handler.buildListTabs, 'function', 'should have buildListTabs')
  assert.equal(typeof handler.normalizeItem, 'function', 'should have normalizeItem')
  assert.equal(typeof handler.getDetail, 'function', 'should have getDetail')
  assert.equal(typeof handler.getCenter, 'function', 'should have getCenter')
  assert.equal(typeof handler.publish, 'function', 'should have publish')
  assert.equal(typeof handler.buildFeedOptions, 'function', 'should have buildFeedOptions')
  assert.equal(typeof handler.buildCenterTabs, 'function', 'should have buildCenterTabs')
  assert.equal(typeof handler.normalizeCenterData, 'function', 'should have normalizeCenterData')
})

test('delivery normalizeItem produces expected shape', function () {
  const handler = getModuleHandler('delivery')
  const result = handler.normalizeItem({
    orderId: 50,
    company: 'EMS',
    address: 'Building A',
    price: 5.5,
    state: 0,
    remarks: 'Handle with care',
    orderTime: '2025-07-01'
  })

  assert.equal(result.id, 50)
  assert.equal(result.title, 'EMS')
  assert.equal(result.summary, 'Building A')
  assert.equal(result.priceText, '5.50')
  assert.ok(result.badgeText, 'should have a badge text')
  assert.equal(result.metaText, 'Handle with care')
  assert.equal(result.timeText, '2025-07-01')
  assert.ok(result.raw, 'should preserve raw item')
})

test('dating normalizeItem produces expected shape', function () {
  const handler = getModuleHandler('dating')
  const result = handler.normalizeItem({
    profileId: 60,
    nickname: 'Alice',
    content: 'Looking for roommate',
    pictureURL: '/img/alice.png',
    grade: 2,
    faculty: 'Computer Science',
    hometown: 'Beijing'
  })

  assert.equal(result.id, 60)
  assert.equal(result.title, 'Alice')
  assert.equal(result.summary, 'Looking for roommate')
  assert.equal(result.cover, '/img/alice.png')
  assert.ok(result.badgeText, 'should have a badge text')
  assert.equal(result.metaText, 'Computer Science')
  assert.equal(result.timeText, 'Beijing')
  assert.ok(result.raw, 'should preserve raw item')
})

test('dating normalizeItem uses default cover when pictureURL is missing', function () {
  const handler = getModuleHandler('dating')
  const result = handler.normalizeItem({
    profileId: 61,
    nickname: 'Bob'
  })

  assert.equal(result.cover, '/image/dating.png')
})

test('delivery buildFeedOptions returns base options without modification', function () {
  const handler = getModuleHandler('delivery')
  const result = handler.buildFeedOptions({ start: 0, size: 10, keyword: '' }, { value: 1 })
  assert.equal(result.start, 0)
  assert.equal(result.size, 10)
})

test('dating buildFeedOptions sets area from activeTab', function () {
  const handler = getModuleHandler('dating')
  const result = handler.buildFeedOptions({ start: 0, size: 10, keyword: '' }, { value: 1 })
  assert.equal(result.area, 1)
})

test('delivery filterFeedResults filters by status', function () {
  const handler = getModuleHandler('delivery')
  const list = [
    { orderId: 1, state: 0 },
    { orderId: 2, state: 1 },
    { orderId: 3, state: 0 }
  ]
  const filtered = handler.filterFeedResults(list, { value: 0 })
  assert.equal(filtered.length, 2)
  assert.equal(filtered[0].orderId, 1)
  assert.equal(filtered[1].orderId, 3)
})

test('delivery filterFeedResults returns all when no filter', function () {
  const handler = getModuleHandler('delivery')
  const list = [
    { orderId: 1, state: 0 },
    { orderId: 2, state: 1 }
  ]
  const filtered = handler.filterFeedResults(list, { value: -1 })
  assert.equal(filtered.length, 2)
})

test('delivery normalizeCenterData produces published and accepted lists', function () {
  const handler = getModuleHandler('delivery')
  const normalizeStandardItem = function (item, options) {
    return { id: options.id, title: options.title }
  }
  const result = handler.normalizeCenterData(
    {
      published: [{ orderId: 1, company: 'SF' }],
      accepted: [{ orderId: 2, company: 'EMS' }]
    },
    normalizeStandardItem
  )

  assert.ok(Array.isArray(result.published), 'should have published list')
  assert.ok(Array.isArray(result.accepted), 'should have accepted list')
  assert.equal(result.published.length, 1)
  assert.equal(result.accepted.length, 1)
  assert.equal(result.published[0].id, 1)
  assert.equal(result.accepted[0].id, 2)
})

test('dating normalizeCenterData produces received, sent, and posts lists', function () {
  const handler = getModuleHandler('dating')
  const result = handler.normalizeCenterData({
    received: [{ pickId: 10, roommateProfile: { nickname: 'A' }, state: 0, content: 'Hi' }],
    sent: [{ pickId: 20, roommateProfile: { nickname: 'B' }, state: 1, content: 'Hello' }],
    profiles: [{ profileId: 30, nickname: 'C', content: 'Intro' }]
  })

  assert.ok(Array.isArray(result.received), 'should have received list')
  assert.ok(Array.isArray(result.sent), 'should have sent list')
  assert.ok(Array.isArray(result.posts), 'should have posts list')
  assert.equal(result.received.length, 1)
  assert.equal(result.sent.length, 1)
  assert.equal(result.posts.length, 1)
  assert.equal(result.received[0].id, 10)
  assert.equal(
    result.received[0].actions.length,
    2,
    'pending pick should have accept/reject actions'
  )
  assert.equal(result.sent[0].id, 20)
  assert.ok(result.sent[0].qq !== undefined, 'accepted sent pick should expose qq')
  assert.equal(result.posts[0].id, 30)
  assert.equal(result.posts[0].actions.length, 1, 'post should have hide action')
})

// --- New handler interface: validateForm, buildPublishPayload, buildDetailView, getComments, submitComment, toggleLike ---

var ALL_MODULE_IDS = [
  'marketplace',
  'lostandfound',
  'secret',
  'express',
  'topic',
  'photograph',
  'delivery',
  'dating'
]

test('all handlers implement validateForm', function () {
  ALL_MODULE_IDS.forEach(function (moduleId) {
    var handler = getModuleHandler(moduleId)
    assert.equal(typeof handler.validateForm, 'function', moduleId + ' should have validateForm')
  })
})

test('all handlers implement buildPublishPayload', function () {
  ALL_MODULE_IDS.forEach(function (moduleId) {
    var handler = getModuleHandler(moduleId)
    assert.equal(
      typeof handler.buildPublishPayload,
      'function',
      moduleId + ' should have buildPublishPayload'
    )
  })
})

test('all handlers implement buildDetailView', function () {
  ALL_MODULE_IDS.forEach(function (moduleId) {
    var handler = getModuleHandler(moduleId)
    assert.equal(
      typeof handler.buildDetailView,
      'function',
      moduleId + ' should have buildDetailView'
    )
  })
})

test('all handlers implement getComments', function () {
  ALL_MODULE_IDS.forEach(function (moduleId) {
    var handler = getModuleHandler(moduleId)
    assert.equal(typeof handler.getComments, 'function', moduleId + ' should have getComments')
  })
})

test('all handlers implement submitComment', function () {
  ALL_MODULE_IDS.forEach(function (moduleId) {
    var handler = getModuleHandler(moduleId)
    assert.equal(typeof handler.submitComment, 'function', moduleId + ' should have submitComment')
  })
})

test('all handlers implement toggleLike', function () {
  ALL_MODULE_IDS.forEach(function (moduleId) {
    var handler = getModuleHandler(moduleId)
    assert.equal(typeof handler.toggleLike, 'function', moduleId + ' should have toggleLike')
  })
})

test('marketplace validateForm rejects empty product name', function () {
  var handler = getModuleHandler('marketplace')
  var result = handler.validateForm({ form: {}, images: [] })
  assert.ok(result, 'should return validation error')
  assert.notEqual(result, '', 'should not be empty')
})

test('marketplace validateForm passes with valid data', function () {
  var handler = getModuleHandler('marketplace')
  var result = handler.validateForm({
    form: { name: 'Test', description: 'Desc', price: 10, location: 'A', qq: '123' },
    images: [{ path: '/img/test.png' }],
    isEditMode: false
  })
  assert.equal(result, '', 'should return empty string for valid form')
})

test('marketplace validateForm accepts backend maximum price', function () {
  var handler = getModuleHandler('marketplace')
  var result = handler.validateForm({
    form: { name: 'Test', description: 'Desc', price: 9999.99, location: 'A', qq: '123' },
    images: [{ path: '/img/test.png' }],
    isEditMode: false
  })
  assert.equal(result, '', 'should return empty string for backend maximum price')
})

test('marketplace validateForm rejects price above backend maximum', function () {
  var handler = getModuleHandler('marketplace')
  var result = handler.validateForm({
    form: { name: 'Test', description: 'Desc', price: 10000, location: 'A', qq: '123' },
    images: [{ path: '/img/test.png' }],
    isEditMode: false
  })
  assert.equal(result, 'community.publish.v.priceInvalid')
})

test('lostandfound validateForm rejects when no contact info', function () {
  var handler = getModuleHandler('lostandfound')
  var result = handler.validateForm({
    form: { name: 'Phone', description: 'Lost phone', location: 'Library' },
    images: [{ path: '/img/test.png' }],
    isEditMode: false
  })
  assert.ok(result, 'should return validation error for missing contact')
})

test('marketplace buildDetailView produces expected shape', function () {
  var handler = getModuleHandler('marketplace')
  var result = handler.buildDetailView({
    secondhandItem: { pictureURL: ['/img/a.png'], name: 'Widget', price: 50, location: 'Dorm' },
    profile: { nickname: 'Alice' }
  })
  assert.equal(result.title, 'Widget')
  assert.equal(result.sellerName, 'Alice')
  assert.equal(result.priceText, '50.00')
  assert.equal(result.canLike, false)
})

test('lostandfound buildDetailView produces expected shape', function () {
  var handler = getModuleHandler('lostandfound')
  var result = handler.buildDetailView({
    item: { name: 'Keys', lostType: 0, location: 'Canteen' },
    profile: { nickname: 'Bob' }
  })
  assert.equal(result.title, 'Keys')
  assert.equal(result.sellerName, 'Bob')
  assert.equal(result.canLike, false)
})

test('secret getComments returns a promise', function () {
  var handler = getModuleHandler('secret')
  var result = handler.getComments(1)
  assert.ok(result && typeof result.then === 'function', 'should return a promise')
})

test('express getComments returns a promise', function () {
  var handler = getModuleHandler('express')
  var result = handler.getComments(1)
  assert.ok(result && typeof result.then === 'function', 'should return a promise')
})

test('photograph getComments returns a promise', function () {
  var handler = getModuleHandler('photograph')
  var result = handler.getComments(1)
  assert.ok(result && typeof result.then === 'function', 'should return a promise')
})

test('topic imageLimit is 9', function () {
  var handler = getModuleHandler('topic')
  assert.equal(handler.imageLimit, 9)
})
