const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { stubModule, clearModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')

// --- Stubs ---

// Stub wx global
const wxCalls = []
global.wx = {
  setStorageSync: function() {},
  navigateTo: function() {},
  setNavigationBarTitle: function() {},
  stopPullDownRefresh: function() {},
  showModal: function() {},
  showToast: function() {}
}

// Stub i18n
stubModule(path.join(ROOT, 'utils/i18n.js'), {
  t: function(key) { return key },
  tReplace: function(key) { return key }
})

// Stub theme
stubModule(path.join(ROOT, 'utils/theme.js'), {
  applyTheme: function() {}
})

// Stub page utils
stubModule(path.join(ROOT, 'utils/page.js'), {
  runWithNavigationLoading: function(ctx, fn, opts) {
    if (opts && opts.loadingKey) {
      ctx.data[opts.loadingKey] = true
    }
    return fn().then(function(result) {
      if (opts && opts.loadingKey) {
        ctx.data[opts.loadingKey] = false
      }
      return result
    })
  },
  showTopTips: function() {}
})

// Stub storage keys
stubModule(path.join(ROOT, 'constants/storage.js'), {})

// Track API calls
var apiCallLog = []

stubModule(path.join(ROOT, 'services/apis/messages.js'), {
  getAnnouncementList: function(start, size) {
    apiCallLog.push({ method: 'getAnnouncementList', args: [start, size] })
    return Promise.resolve({ success: true, data: [] })
  },
  getInteractionList: function(start, size) {
    apiCallLog.push({ method: 'getInteractionList', args: [start, size] })
    return Promise.resolve({ success: true, data: [] })
  },
  getUnreadCount: function() {
    apiCallLog.push({ method: 'getUnreadCount' })
    return Promise.resolve({ success: true, data: 3 })
  },
  markMessageRead: function() {
    return Promise.resolve({ success: true })
  },
  markAllMessagesRead: function() {
    return Promise.resolve({ success: true })
  }
})

// Clear and require inbox page module
clearModule(path.join(ROOT, 'pages/inbox/inbox.js'))

// We need to intercept the Page() call to capture the page config
var capturedPageConfig = null
global.Page = function(config) {
  capturedPageConfig = config
}

require(path.join(ROOT, 'pages/inbox/inbox.js'))

function createPageInstance() {
  // Create a fresh page-like object with data copy and setData
  var instance = Object.create(capturedPageConfig)
  instance.data = JSON.parse(JSON.stringify(capturedPageConfig.data))
  instance.setData = function(patch) {
    Object.assign(instance.data, patch)
  }
  return instance
}

test('initial load does NOT call interaction list — zero getInteractionList requests on onLoad', async function() {
  apiCallLog = []
  var page = createPageInstance()
  page.onLoad()

  // Let promises settle
  await new Promise(function(r) { setTimeout(r, 50) })

  var interactionListCalls = apiCallLog.filter(function(c) { return c.method === 'getInteractionList' })
  var unreadCountCalls = apiCallLog.filter(function(c) { return c.method === 'getUnreadCount' })
  var announcementCalls = apiCallLog.filter(function(c) { return c.method === 'getAnnouncementList' })

  assert.equal(interactionListCalls.length, 0, 'should NOT fetch interaction list on initial load')
  assert.equal(unreadCountCalls.length, 1, 'should fetch unread count for badge')
  assert.equal(announcementCalls.length, 1, 'should fetch announcements')
})

test('switching to interaction tab triggers list fetch on first activation', async function() {
  apiCallLog = []
  var page = createPageInstance()
  page.onLoad()
  await new Promise(function(r) { setTimeout(r, 50) })

  // Clear log after initial load
  apiCallLog = []

  // Simulate switching to interaction tab
  page.switchTab({ currentTarget: { dataset: { key: 'interaction' } } })
  await new Promise(function(r) { setTimeout(r, 50) })

  var interactionListCalls = apiCallLog.filter(function(c) { return c.method === 'getInteractionList' })
  assert.equal(interactionListCalls.length, 1, 'should fetch interaction list on first tab switch')
  assert.equal(page.data.interactionLoaded, true, 'interactionLoaded flag should be true')
})

test('switching to interaction tab a second time does NOT re-fetch list', async function() {
  apiCallLog = []
  var page = createPageInstance()
  page.onLoad()
  await new Promise(function(r) { setTimeout(r, 50) })

  // First switch to interaction
  page.switchTab({ currentTarget: { dataset: { key: 'interaction' } } })
  await new Promise(function(r) { setTimeout(r, 50) })

  // Switch back to announcement
  page.switchTab({ currentTarget: { dataset: { key: 'announcement' } } })
  await new Promise(function(r) { setTimeout(r, 50) })

  // Clear log
  apiCallLog = []

  // Switch to interaction again
  page.switchTab({ currentTarget: { dataset: { key: 'interaction' } } })
  await new Promise(function(r) { setTimeout(r, 50) })

  var interactionListCalls = apiCallLog.filter(function(c) { return c.method === 'getInteractionList' })
  assert.equal(interactionListCalls.length, 0, 'should NOT re-fetch interaction list on second switch')
})

test('pull-down refresh on interaction tab fetches list and sets interactionLoaded', async function() {
  apiCallLog = []
  var page = createPageInstance()
  page.onLoad()
  await new Promise(function(r) { setTimeout(r, 50) })

  // Switch to interaction tab to set activeTab
  page.setData({ activeTab: 'interaction' })

  apiCallLog = []
  page.onPullDownRefresh()
  await new Promise(function(r) { setTimeout(r, 50) })

  var interactionListCalls = apiCallLog.filter(function(c) { return c.method === 'getInteractionList' })
  assert.equal(interactionListCalls.length, 1, 'pull-down refresh should fetch interaction list')
  assert.equal(page.data.interactionLoaded, true, 'interactionLoaded should be true after refresh')
})

test('onReachBottom does not paginate interaction if not yet loaded', function() {
  apiCallLog = []
  var page = createPageInstance()
  page.setData({ activeTab: 'interaction', interactionLoaded: false, interactionFinished: false })

  page.onReachBottom()

  var interactionListCalls = apiCallLog.filter(function(c) { return c.method === 'getInteractionList' })
  assert.equal(interactionListCalls.length, 0, 'should not paginate when interactionLoaded is false')
})
