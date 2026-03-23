const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')

// Stub i18n so handler modules can load without the full WeChat environment
const I18N_MODULE = path.join(ROOT, 'utils/i18n.js')
stubModule(I18N_MODULE, {
  t: function(key) { return key },
  tReplace: function(key) { return key }
})

// Stub request module
const REQUEST_MODULE = path.join(ROOT, 'services/request.js')
stubModule(REQUEST_MODULE, {
  request: function() { return Promise.resolve({ success: true }) }
})

// Clear registry and handler caches so they pick up our stubs
clearModule(path.join(ROOT, 'services/community/module-handlers/marketplace.js'))
clearModule(path.join(ROOT, 'services/community/module-handlers/lostandfound.js'))
clearModule(path.join(ROOT, 'services/community/module-handlers/secret.js'))
clearModule(path.join(ROOT, 'services/community/module-handlers/express.js'))
clearModule(path.join(ROOT, 'services/community/registry.js'))

const { getModuleHandler } = require(path.join(ROOT, 'services/community/registry.js'))

test('marketplace handler has feedEndpoint, tabs, and normalizeItem', function() {
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

test('lostandfound handler has feedEndpoint, tabs, and normalizeItem', function() {
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

test('getModuleHandler returns null for unknown moduleId', function() {
  assert.equal(getModuleHandler('nonexistent'), null)
  assert.equal(getModuleHandler(''), null)
  assert.equal(getModuleHandler(undefined), null)
})

test('ershou alias resolves to same handler as marketplace', function() {
  const marketplace = getModuleHandler('marketplace')
  const ershou = getModuleHandler('ershou')
  assert.ok(marketplace, 'marketplace handler should exist')
  assert.ok(ershou, 'ershou handler should exist')
  assert.equal(marketplace, ershou, 'ershou should be the same handler as marketplace')
})

test('marketplace normalizeItem produces expected shape', function() {
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

test('lostandfound normalizeItem produces expected shape', function() {
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

test('marketplace buildFeedOptions sets type from activeTab', function() {
  const handler = getModuleHandler('marketplace')
  const result = handler.buildFeedOptions(
    { start: 0, size: 10, keyword: '' },
    { value: 3 }
  )
  assert.equal(result.type, 3)
})

test('lostandfound buildFeedOptions sets mode from activeTab', function() {
  const handler = getModuleHandler('lostandfound')
  const result = handler.buildFeedOptions(
    { start: 0, size: 10, keyword: '' },
    { value: 1 }
  )
  assert.equal(result.mode, 1)
})

test('secret handler has expected shape', function() {
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

test('express handler has expected shape', function() {
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

test('secret normalizeItem produces expected shape', function() {
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

test('express normalizeItem produces expected shape', function() {
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
