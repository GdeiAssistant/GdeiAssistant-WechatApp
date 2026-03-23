const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { stubModule, clearModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')

// --- Stubs ---

global.wx = {
  setNavigationBarTitle: function() {},
  showModal: function() {},
  showToast: function() {},
  navigateTo: function() {},
  setClipboardData: function() {},
  makePhoneCall: function() {},
  previewImage: function() {},
  createInnerAudioContext: function() {
    return { onEnded: function() {}, onStop: function() {}, onError: function() {}, stop: function() {}, destroy: function() {} }
  }
}

stubModule(path.join(ROOT, 'utils/i18n.js'), {
  t: function(key) { return key },
  tReplace: function(key) { return key }
})

stubModule(path.join(ROOT, 'utils/theme.js'), {
  applyTheme: function() {}
})

stubModule(path.join(ROOT, 'utils/page.js'), {
  runWithNavigationLoading: function(ctx, fn) {
    return fn()
  },
  showTopTips: function() {}
})

stubModule(path.join(ROOT, 'utils/debounce.js'), {
  createSubmitGuard: function() {
    return { acquire: function() { return true }, release: function() {} }
  }
})

stubModule(path.join(ROOT, 'constants/profile.js'), {
  fetchProfileOptions: function() { return Promise.resolve() }
})

// Track API calls
var apiCallLog = []

// Build handler stubs that mimic the real registry behavior
// We need photograph handler to have commentsInDetail: true

var photographHandlerStub = {
  getFeed: function() { return Promise.resolve({ success: true, data: [] }) },
  getDetail: function(id) {
    apiCallLog.push({ method: 'photograph.getDetail', args: [id] })
    return Promise.resolve({
      success: true,
      data: {
        id: id,
        title: 'Test Photo',
        content: 'A photograph',
        photographCommentList: [
          { commentId: 101, nickname: 'Alice', comment: 'Great photo!', publishTime: '2026-01-01' },
          { commentId: 102, nickname: 'Bob', comment: 'Nice!', publishTime: '2026-01-02' }
        ]
      }
    })
  },
  getCenter: function() { return Promise.resolve({ success: true, data: [] }) },
  getComments: function(id) {
    apiCallLog.push({ method: 'photograph.getComments', args: [id] })
    return Promise.resolve({
      success: true,
      data: [
        { commentId: 101, nickname: 'Alice', comment: 'Great photo!', publishTime: '2026-01-01' },
        { commentId: 102, nickname: 'Bob', comment: 'Nice!', publishTime: '2026-01-02' }
      ]
    })
  },
  buildDetailView: function(payload) {
    return { title: payload.title || 'Detail', description: payload.content || '' }
  },
  buildListTabs: function() { return [] },
  normalizeItem: function(item) { return item },
  buildFeedOptions: function(opts) { return opts },
  buildCenterTabs: function() { return [] },
  normalizeCenterData: function() { return {} },
  publish: function() { return Promise.resolve({ success: true }) },
  validateForm: function() { return '' },
  buildPublishPayload: function() { return Promise.resolve({}) },
  submitComment: function() { return Promise.resolve({ success: true }) },
  toggleLike: function() { return Promise.resolve({ success: true }) },
  commentsInDetail: true,
  searchable: false,
  showSummaryProfile: false
}

var secretHandlerStub = {
  getFeed: function() { return Promise.resolve({ success: true, data: [] }) },
  getDetail: function(id) {
    apiCallLog.push({ method: 'secret.getDetail', args: [id] })
    return Promise.resolve({
      success: true,
      data: { id: id, content: 'A secret', type: 0 }
    })
  },
  getCenter: function() { return Promise.resolve({ success: true, data: [] }) },
  getComments: function(id) {
    apiCallLog.push({ method: 'secret.getComments', args: [id] })
    return Promise.resolve({ success: true, data: [] })
  },
  buildDetailView: function(payload) {
    return { title: 'Secret', description: payload.content || '', canLike: true }
  },
  buildListTabs: function() { return [] },
  normalizeItem: function(item) { return item },
  buildFeedOptions: function(opts) { return opts },
  buildCenterTabs: function() { return [] },
  normalizeCenterData: function() { return {} },
  publish: function() { return Promise.resolve({ success: true }) },
  validateForm: function() { return '' },
  buildPublishPayload: function() { return Promise.resolve({}) },
  submitComment: function() { return Promise.resolve({ success: true }) },
  toggleLike: function() { return Promise.resolve({ success: true }) },
  searchable: false,
  showSummaryProfile: false
}

// Stub registry
stubModule(path.join(ROOT, 'services/community/registry.js'), {
  getModuleHandler: function(moduleId) {
    if (moduleId === 'photograph') return photographHandlerStub
    if (moduleId === 'secret') return secretHandlerStub
    return null
  }
})

// Stub community API to delegate to handler stubs (mirrors real community.js)
stubModule(path.join(ROOT, 'services/apis/community.js'), {
  getDetail: function(moduleId, id) {
    if (moduleId === 'photograph') return photographHandlerStub.getDetail(id)
    if (moduleId === 'secret') return secretHandlerStub.getDetail(id)
    return Promise.reject(new Error('unknown module'))
  },
  getComments: function(moduleId, id) {
    if (moduleId === 'photograph') return photographHandlerStub.getComments(id)
    if (moduleId === 'secret') return secretHandlerStub.getComments(id)
    return Promise.resolve({ success: true, data: [] })
  },
  submitComment: function() { return Promise.resolve({ success: true }) },
  toggleLike: function() { return Promise.resolve({ success: true }) },
  guessExpress: function() { return Promise.resolve({ success: true }) },
  acceptDeliveryOrder: function() { return Promise.resolve({ success: true }) },
  finishDeliveryTrade: function() { return Promise.resolve({ success: true }) },
  submitDatingPick: function() { return Promise.resolve({ success: true }) }
})

// Stub community constants
stubModule(path.join(ROOT, 'constants/community.js'), {
  getCommunityModule: function(moduleId) {
    if (moduleId === 'photograph') return { title: 'Photograph', moduleId: 'photograph' }
    if (moduleId === 'secret') return { title: 'Secret', moduleId: 'secret' }
    return null
  },
  getCommunityPageTitle: function(moduleId, page, fallback) { return fallback || moduleId }
})

// Now require communityDetail
clearModule(path.join(ROOT, 'pages/communityDetail/communityDetail.js'))

var capturedPageConfig = null
global.Page = function(config) {
  capturedPageConfig = config
}

require(path.join(ROOT, 'pages/communityDetail/communityDetail.js'))

function createPageInstance() {
  var instance = Object.create(capturedPageConfig)
  instance.data = JSON.parse(JSON.stringify(capturedPageConfig.data))
  instance.setData = function(patch) {
    Object.assign(instance.data, patch)
  }
  return instance
}

test('photograph detail makes no separate getComments call — comments are embedded in detail response', async function() {
  apiCallLog = []
  var page = createPageInstance()
  page.onLoad({ module: 'photograph', id: '42' })

  await new Promise(function(r) { setTimeout(r, 100) })

  var detailCalls = apiCallLog.filter(function(c) { return c.method === 'photograph.getDetail' })
  var commentCalls = apiCallLog.filter(function(c) { return c.method === 'photograph.getComments' })

  assert.equal(detailCalls.length, 1, 'should fetch photograph detail once')
  assert.equal(commentCalls.length, 0, 'should NOT make separate getComments call for photograph')
})

test('photograph detail extracts comments from detail response', async function() {
  apiCallLog = []
  var page = createPageInstance()
  page.onLoad({ module: 'photograph', id: '42' })

  await new Promise(function(r) { setTimeout(r, 100) })

  assert.equal(page.data.comments.length, 2, 'should have 2 comments from detail response')
  assert.equal(page.data.comments[0].id, 101)
  assert.equal(page.data.comments[0].nickname, 'Alice')
  assert.equal(page.data.comments[0].comment, 'Great photo!')
  assert.equal(page.data.comments[1].id, 102)
  assert.equal(page.data.comments[1].nickname, 'Bob')
})

test('secret detail still makes separate getComments call', async function() {
  apiCallLog = []
  var page = createPageInstance()
  page.onLoad({ module: 'secret', id: '10' })

  await new Promise(function(r) { setTimeout(r, 100) })

  var detailCalls = apiCallLog.filter(function(c) { return c.method === 'secret.getDetail' })
  var commentCalls = apiCallLog.filter(function(c) { return c.method === 'secret.getComments' })

  assert.equal(detailCalls.length, 1, 'should fetch secret detail once')
  assert.equal(commentCalls.length, 1, 'should still make separate getComments call for secret')
})

test('photograph handler has commentsInDetail flag set to true', function() {
  var { getModuleHandler } = require(path.join(ROOT, 'services/community/registry.js'))
  var handler = getModuleHandler('photograph')
  assert.equal(handler.commentsInDetail, true, 'photograph handler should have commentsInDetail: true')
})
