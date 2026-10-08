const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { stubModule, clearModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const INBOX_MODULE = path.join(ROOT, 'pages/inbox/inbox.js')

var apiCallLog = []
var capturedPageConfig = null

function installInboxTestStubs() {
  global.wx = {
    getStorageSync: function () {
      return ''
    },
    setStorageSync: function () {},
    removeStorageSync: function () {},
    navigateTo: function () {},
    setNavigationBarTitle: function () {},
    stopPullDownRefresh: function () {},
    showModal: function () {},
    showToast: function () {}
  }

  stubModule(path.join(ROOT, 'utils/i18n.js'), {
    t: function (key) {
      return key
    },
    tReplace: function (key) {
      return key
    }
  })

  stubModule(path.join(ROOT, 'utils/theme.js'), {
    applyTheme: function () {}
  })

  stubModule(path.join(ROOT, 'utils/page.js'), {
    runWithNavigationLoading: function (ctx, fn, opts) {
      if (opts && opts.loadingKey) {
        ctx.data[opts.loadingKey] = true
      }
      return fn().then(function (result) {
        if (opts && opts.loadingKey) {
          ctx.data[opts.loadingKey] = false
        }
        return result
      })
    },
    showTopTips: function () {}
  })

  stubModule(path.join(ROOT, 'constants/storage.js'), {})

  stubModule(path.join(ROOT, 'services/apis/messages.js'), {
    getAnnouncementList: function (start, size) {
      apiCallLog.push({ method: 'getAnnouncementList', args: [start, size] })
      return Promise.resolve({ success: true, data: [] })
    },
    getCategoryList: function (category, start, size) {
      apiCallLog.push({ method: 'getCategoryList', args: [category, start, size] })
      return Promise.resolve({ success: true, data: [] })
    },
    getCategoriesUnread: function () {
      apiCallLog.push({ method: 'getCategoriesUnread' })
      return Promise.resolve({ success: true, data: { interaction: 3, service: 1 } })
    },
    markMessageRead: function () {
      return Promise.resolve({ success: true })
    },
    markCategoryRead: function () {
      return Promise.resolve({ success: true })
    }
  })

  stubModule(path.join(ROOT, 'services/apis/social.js'), {
    getUnread: function () {
      apiCallLog.push({ method: 'getUnread' })
      return Promise.resolve({ success: true, data: { total: 0 } })
    },
    getConversations: function () {
      apiCallLog.push({ method: 'getConversations' })
      return Promise.resolve({
        success: true,
        data: { items: [], nextCursor: null, hasMore: false }
      })
    }
  })

  stubModule(path.join(ROOT, 'services/social-realtime.js'), {
    ensureConnected: function () {},
    on: function () {
      return function () {}
    },
    off: function () {},
    disconnect: function () {}
  })

  stubModule(path.join(ROOT, 'utils/social.js'), {
    normalizePage: function (payload) {
      const data = payload || {}
      return {
        items: Array.isArray(data.items) ? data.items : [],
        nextCursor: data.nextCursor || null,
        hasMore: !!data.hasMore
      }
    },
    openChat: function () {}
  })

  stubModule(path.join(ROOT, 'services/auth.js'), {
    getSessionToken: function () {
      return 'test-token'
    },
    ensureSessionToken: function () {
      return Promise.resolve('test-token')
    },
    clearSession: function () {},
    reLaunchToLogin: function () {}
  })

  clearModule(INBOX_MODULE)
  capturedPageConfig = null
  global.Page = function (config) {
    capturedPageConfig = config
  }
  require(INBOX_MODULE)
}

function createPageInstance() {
  installInboxTestStubs()
  var instance = Object.create(capturedPageConfig)
  instance.data = JSON.parse(JSON.stringify(capturedPageConfig.data))
  instance.setData = function (patch) {
    Object.assign(instance.data, patch)
  }
  return instance
}

test('initial load does NOT call interaction list — zero getCategoryList requests on onLoad', async function () {
  apiCallLog = []
  var page = createPageInstance()
  page.onLoad()

  await new Promise(function (r) {
    setTimeout(r, 50)
  })

  var interactionListCalls = apiCallLog.filter(function (c) {
    return c.method === 'getCategoryList'
  })
  var unreadCountCalls = apiCallLog.filter(function (c) {
    return c.method === 'getCategoriesUnread'
  })
  var announcementCalls = apiCallLog.filter(function (c) {
    return c.method === 'getAnnouncementList'
  })

  assert.equal(interactionListCalls.length, 0, 'should NOT fetch interaction list on initial load')
  assert.equal(unreadCountCalls.length, 1, 'should fetch unread count for badge')
  assert.equal(announcementCalls.length, 1, 'should fetch announcements')
})

test('switching to interaction tab triggers list fetch on first activation', async function () {
  apiCallLog = []
  var page = createPageInstance()
  page.onLoad()
  await new Promise(function (r) {
    setTimeout(r, 50)
  })

  apiCallLog = []

  page.switchTab({ currentTarget: { dataset: { key: 'interaction' } } })
  await new Promise(function (r) {
    setTimeout(r, 50)
  })

  var interactionListCalls = apiCallLog.filter(function (c) {
    return c.method === 'getCategoryList'
  })
  assert.equal(interactionListCalls.length, 1, 'should fetch interaction list on first tab switch')
  assert.equal(page.data.interactionLoaded, true, 'interactionLoaded flag should be true')
})

test('switching to interaction tab a second time does NOT re-fetch list', async function () {
  apiCallLog = []
  var page = createPageInstance()
  page.onLoad()
  await new Promise(function (r) {
    setTimeout(r, 50)
  })

  page.switchTab({ currentTarget: { dataset: { key: 'interaction' } } })
  await new Promise(function (r) {
    setTimeout(r, 50)
  })

  page.switchTab({ currentTarget: { dataset: { key: 'announcement' } } })
  await new Promise(function (r) {
    setTimeout(r, 50)
  })

  apiCallLog = []

  page.switchTab({ currentTarget: { dataset: { key: 'interaction' } } })
  await new Promise(function (r) {
    setTimeout(r, 50)
  })

  var interactionListCalls = apiCallLog.filter(function (c) {
    return c.method === 'getCategoryList'
  })
  assert.equal(
    interactionListCalls.length,
    0,
    'should NOT re-fetch interaction list on second switch'
  )
})

test('pull-down refresh on interaction tab fetches list and sets interactionLoaded', async function () {
  apiCallLog = []
  var page = createPageInstance()
  page.onLoad()
  await new Promise(function (r) {
    setTimeout(r, 50)
  })

  page.setData({ activeTab: 'interaction' })

  apiCallLog = []
  page.onPullDownRefresh()
  await new Promise(function (r) {
    setTimeout(r, 50)
  })

  var interactionListCalls = apiCallLog.filter(function (c) {
    return c.method === 'getCategoryList'
  })
  assert.equal(interactionListCalls.length, 1, 'pull-down refresh should fetch interaction list')
  assert.equal(page.data.interactionLoaded, true, 'interactionLoaded should be true after refresh')
})

test('onReachBottom does not paginate interaction if not yet loaded', function () {
  apiCallLog = []
  var page = createPageInstance()
  page.setData({ activeTab: 'interaction', interactionLoaded: false, interactionFinished: false })

  page.onReachBottom()

  var interactionListCalls = apiCallLog.filter(function (c) {
    return c.method === 'getCategoryList'
  })
  assert.equal(
    interactionListCalls.length,
    0,
    'should not paginate when interactionLoaded is false'
  )
})
