const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')

function createMockRuntime(options) {
  const opts = options || {}
  const storage = Object.assign({}, opts.storage || {})
  const navigations = []
  const modals = []
  let activePageConfig = null
  let activeComponentConfig = null
  let currentTabBar = null

  const prevGlobals = {
    wx: global.wx,
    Page: global.Page,
    Component: global.Component,
    getApp: global.getApp,
    getCurrentPages: global.getCurrentPages
  }

  const appInstance = {
    globalData: {
      userInfo: null,
      locale: 'zh-CN',
      theme: 'light',
      themeAccent: 'banyan',
      fontScaleStep: 1
    }
  }

  const loadedPages = []

  global.wx = {
    getStorageSync(key) {
      return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : ''
    },
    setStorageSync(key, value) {
      storage[key] = value
    },
    removeStorageSync(key) {
      delete storage[key]
    },
    clearStorageSync() {
      Object.keys(storage).forEach(function (k) {
        delete storage[k]
      })
    },
    getStorageInfoSync() {
      return { keys: Object.keys(storage) }
    },
    getAppBaseInfo() {
      return { theme: 'light' }
    },
    getSystemInfoSync() {
      return { theme: 'light', language: 'zh_CN' }
    },
    getAccountInfoSync() {
      return { miniProgram: { envVersion: 'develop', version: '1.0.0' } }
    },
    setNavigationBarColor() {},
    setNavigationBarTitle() {},
    setBackgroundColor() {},
    showNavigationBarLoading() {},
    hideNavigationBarLoading() {},
    stopPullDownRefresh() {},
    showLoading() {},
    hideLoading() {},
    showToast() {},
    hideToast() {},
    showActionSheet() {},
    pageScrollTo() {},
    showModal(modalOpts) {
      modals.push(modalOpts)
      if (modalOpts && typeof modalOpts.success === 'function') {
        modalOpts.success({ confirm: false, cancel: true })
      }
    },
    navigateTo(navOpts) {
      navigations.push({ type: 'navigateTo', url: navOpts.url })
      if (navOpts && typeof navOpts.success === 'function') {
        navOpts.success()
      }
    },
    switchTab(navOpts) {
      navigations.push({ type: 'switchTab', url: navOpts.url })
      if (navOpts && typeof navOpts.success === 'function') {
        navOpts.success()
      }
    },
    reLaunch(navOpts) {
      navigations.push({ type: 'reLaunch', url: navOpts.url })
      if (navOpts && typeof navOpts.success === 'function') {
        navOpts.success()
      }
    },
    onThemeChange() {},
    connectSocket() {
      return {
        onOpen() {},
        onMessage() {},
        onClose() {},
        onError() {},
        send() {},
        close() {}
      }
    }
  }

  global.Page = function (config) {
    activePageConfig = config
  }
  global.Component = function (config) {
    activeComponentConfig = config
  }
  global.getApp = function () {
    return appInstance
  }
  global.getCurrentPages = function () {
    return loadedPages
  }

  function clearAllCaches() {
    Object.keys(require.cache).forEach(function (cacheKey) {
      if (
        cacheKey.indexOf(ROOT + path.sep) === 0 &&
        cacheKey.indexOf(path.join(ROOT, 'tests')) !== 0
      ) {
        delete require.cache[cacheKey]
      }
    })
  }

  clearAllCaches()

  function mountPage(relPath) {
    activePageConfig = null
    const fullPath = path.join(ROOT, relPath)
    clearModule(fullPath)
    require(fullPath)
    assert.ok(activePageConfig, relPath + ' did not call Page(...)')
    const page = Object.create(activePageConfig)
    page.data = JSON.parse(JSON.stringify(activePageConfig.data || {}))
    page.setData = function (patch) {
      Object.assign(page.data, patch)
    }
    page.getTabBar = function () {
      return currentTabBar
    }
    loadedPages.push(page)
    return page
  }

  function mountComponent(relPath) {
    activeComponentConfig = null
    const fullPath = path.join(ROOT, relPath)
    clearModule(fullPath)
    require(fullPath)
    assert.ok(activeComponentConfig, relPath + ' did not call Component(...)')
    const comp = Object.create(activeComponentConfig.methods || {})
    comp.data = JSON.parse(JSON.stringify(activeComponentConfig.data || {}))
    comp.setData = function (patch) {
      Object.assign(comp.data, patch)
    }
    return comp
  }

  return {
    storage,
    navigations,
    modals,
    appInstance,
    mountPage,
    mountComponent,
    setTabBar(bar) {
      currentTabBar = bar
    },
    restore() {
      clearAllCaches()
      Object.keys(prevGlobals).forEach(function (key) {
        if (prevGlobals[key] === undefined) {
          delete global[key]
        } else {
          global[key] = prevGlobals[key]
        }
      })
    }
  }
}

async function waitFor(predicate, timeoutMs) {
  const deadline = Date.now() + (timeoutMs || 2000)
  while (Date.now() < deadline) {
    if (predicate()) {
      return
    }
    await new Promise(function (resolve) {
      setTimeout(resolve, 25)
    })
  }
  assert.ok(predicate(), 'Timed out waiting for async condition')
}

async function settleMockCycle(ms) {
  await new Promise(function (resolve) {
    setTimeout(resolve, ms || 240)
  })
}

test('appearance switches all 4 campus accents and syncs custom-tab-bar across locales', function (t) {
  const rt = createMockRuntime()
  t.after(rt.restore)

  const tabBar = rt.mountComponent('custom-tab-bar/index.js')
  rt.setTabBar(tabBar)

  const appearance = rt.mountPage('pages/appearance/appearance.js')
  appearance.onLoad()

  assert.equal(appearance.data.themeAccent, 'banyan')
  assert.equal(appearance.data.themeClass, 'theme-light accent-banyan')
  assert.equal(appearance.data.accents.length, 4)
  assert.equal(appearance.data.t.accentLabel, '主题色')

  const checks = [
    { accent: 'kapok', mode: 'light', locale: 'zh-TW', label: '主題色', color: '#C85A32' },
    { accent: 'haizhu', mode: 'dark', locale: 'en', label: 'Theme Accent', color: '#60A5FA' },
    { accent: 'bauhinia', mode: 'dark', locale: 'ja', label: 'テーマカラー', color: '#A78BFA' },
    { accent: 'banyan', mode: 'light', locale: 'ko', label: '테마 색상', color: '#0E7C61' }
  ]

  checks.forEach(function (item) {
    appearance.onLocaleSelect({ currentTarget: { dataset: { code: item.locale } } })
    appearance.onThemeSelect({ currentTarget: { dataset: { mode: item.mode } } })
    appearance.onAccentSelect({ currentTarget: { dataset: { accent: item.accent } } })

    const expectedPrefix = item.mode === 'dark' ? 'theme-dark' : 'theme-light'
    assert.equal(appearance.data.themeAccent, item.accent)
    assert.equal(appearance.data.themeClass, expectedPrefix + ' accent-' + item.accent)
    assert.equal(appearance.data.themeColor, item.color)
    assert.equal(appearance.data.t.accentLabel, item.label)
    assert.equal(rt.storage.themeAccent, item.accent)

    tabBar.update({ selected: 2 })
    assert.equal(tabBar.data.themeClass, expectedPrefix + ' accent-' + item.accent)
    assert.equal(tabBar.data.selected, 2)
  })
})

test('all 12 redesigned pages run end-to-end in Mock Mode with Scheme A tokens', async function (t) {
  const rt = createMockRuntime()
  t.after(rt.restore)

  const dataSource = require(path.join(ROOT, 'services/data-source.js'))
  const { MOCK_ACCOUNT_USERNAME, MOCK_ACCOUNT_PASSWORD } = require(
    path.join(ROOT, 'constants/mock.js')
  )
  const themeUtil = require(path.join(ROOT, 'utils/theme.js'))

  dataSource.setDataSourceMode('mock')
  themeUtil.setThemeMode('dark')
  themeUtil.setThemeAccent('kapok')

  const tabBar = rt.mountComponent('custom-tab-bar/index.js')
  rt.setTabBar(tabBar)

  // 1. Login in Mock Mode
  const loginPage = rt.mountPage('pages/login/login.js')
  loginPage.onLoad()
  loginPage.onShow()
  await settleMockCycle(220)
  assert.equal(loginPage.data.themeClass, 'theme-dark accent-kapok')
  assert.equal(loginPage.data.themeColor, '#FB923C')
  loginPage.handleConsentChange({ detail: { value: ['agree'] } })
  loginPage.formSubmit({
    detail: { value: { username: MOCK_ACCOUNT_USERNAME, password: MOCK_ACCOUNT_PASSWORD } }
  })
  await waitFor(function () {
    return Boolean(rt.storage.sessionToken)
  })

  // 2. Index Editorial Campus Pass + Agenda + Notice Ticker + Quick Grids
  const indexPage = rt.mountPage('pages/index/index.js')
  indexPage.onLoad()
  indexPage.onShow()
  await waitFor(function () {
    return Boolean(
      indexPage.data.cardBalance === '128.50' &&
      indexPage.data.scheduleLoaded === true &&
      indexPage.data.latestNotice &&
      indexPage.data.latestNotice.title
    )
  })

  assert.equal(indexPage.data.themeClass, 'theme-dark accent-kapok')
  assert.equal(indexPage.data.themeColor, '#FB923C')
  assert.equal(tabBar.data.themeClass, 'theme-dark accent-kapok')
  assert.equal(indexPage.data.currentWeek, 5)
  assert.equal(indexPage.data.scheduleFailed, false)
  assert.ok(indexPage.data.homeSections.length > 0)
  assert.ok(indexPage.data.systemActions.length > 0)

  indexPage.openCard()
  indexPage.openSchedule()
  indexPage.openAnnouncement()
  assert.ok(
    rt.navigations.some(function (n) {
      return n.url === '/pages/card/card'
    })
  )
  assert.ok(
    rt.navigations.some(function (n) {
      return n.url === '/pages/schedule/schedule'
    })
  )
  assert.ok(
    rt.navigations.some(function (n) {
      return n.url.startsWith('/pages/newsDetail/newsDetail?mode=announcement&id=')
    })
  )
  assert.equal(rt.storage.newsDetailItem.id, indexPage.data.latestNotice.id)

  // 3. Card page
  const cardPage = rt.mountPage('pages/card/card.js')
  cardPage.onShow()
  cardPage.onLoad()
  await waitFor(function () {
    return Boolean(cardPage.data.card && cardPage.data.card.cardBalance === '128.50')
  })
  assert.equal(cardPage.data.themeClass, 'theme-dark accent-kapok')
  assert.equal(cardPage.data.card.cardNumber, '6217000012345678')

  // 4. Schedule page
  const schedulePage = rt.mountPage('pages/schedule/schedule.js')
  schedulePage.onShow()
  schedulePage.onLoad()
  await waitFor(function () {
    return Boolean(schedulePage.data.scheduleList && schedulePage.data.scheduleList.length === 7)
  })
  assert.equal(schedulePage.data.themeClass, 'theme-dark accent-kapok')
  assert.equal(schedulePage.data.week, 5)

  // 5. Grade page
  const gradePage = rt.mountPage('pages/grade/grade.js')
  gradePage.onShow()
  gradePage.onLoad()
  await waitFor(function () {
    return Boolean(
      gradePage.data.firstTermGradeList && gradePage.data.firstTermGradeList.length > 0
    )
  })
  assert.equal(gradePage.data.themeClass, 'theme-dark accent-kapok')

  // 6. Spare classroom query
  const sparePage = rt.mountPage('pages/spare/spare.js')
  sparePage.onShow()
  sparePage.submitQuery()
  await waitFor(function () {
    return Array.isArray(sparePage.data.result) && sparePage.data.result.length > 0
  })
  assert.equal(sparePage.data.themeClass, 'theme-dark accent-kapok')

  // 7. Electricity fee query
  const electricityPage = rt.mountPage('pages/electricity/electricity.js')
  electricityPage.onShow()
  electricityPage.setFieldValue({
    currentTarget: { dataset: { field: 'name' } },
    detail: { value: '陈同学' }
  })
  electricityPage.setFieldValue({
    currentTarget: { dataset: { field: 'number' } },
    detail: { value: '20231234567' }
  })
  electricityPage.submitQuery()
  await waitFor(function () {
    return Boolean(electricityPage.data.result && electricityPage.data.result.totalElectricBill)
  })
  assert.equal(electricityPage.data.themeClass, 'theme-dark accent-kapok')

  // 8. Community Center, List, and Detail (marketplace)
  const centerPage = rt.mountPage('pages/communityCenter/communityCenter.js')
  centerPage.onLoad({ module: 'marketplace' })
  centerPage.onShow()
  await settleMockCycle(240)
  assert.equal(centerPage.data.themeClass, 'theme-dark accent-kapok')

  const listPage = rt.mountPage('pages/communityList/communityList.js')
  listPage.onLoad({ module: 'marketplace' })
  listPage.onShow()
  await waitFor(function () {
    return Array.isArray(listPage.data.items) && listPage.data.items.length > 0
  })
  assert.equal(listPage.data.themeClass, 'theme-dark accent-kapok')

  const detailPage = rt.mountPage('pages/communityDetail/communityDetail.js')
  detailPage.onLoad({ module: 'marketplace', id: String(listPage.data.items[0].id) })
  detailPage.onShow()
  await waitFor(function () {
    return Boolean(detailPage.data.detail)
  })
  assert.equal(detailPage.data.themeClass, 'theme-dark accent-kapok')

  // 9. Profile page
  const profilePage = rt.mountPage('pages/profile/profile.js')
  profilePage.onLoad()
  profilePage.onShow()
  await waitFor(function () {
    return Boolean(
      profilePage.data.profile && profilePage.data.profile.nickname && profilePage.data.socialMe
    )
  })
  assert.equal(profilePage.data.themeClass, 'theme-dark accent-kapok')

  await settleMockCycle(240)
})

test('index schedule failure does not masquerade as week 5 empty day', async function (t) {
  const rt = createMockRuntime({
    storage: {
      locale: 'zh-CN',
      sessionToken: 'mock-session-token'
    }
  })
  t.after(rt.restore)

  const dataSource = require(path.join(ROOT, 'services/data-source.js'))
  const campusApi = require(path.join(ROOT, 'services/apis/campus.js'))
  const i18n = require(path.join(ROOT, 'utils/i18n.js'))
  dataSource.setDataSourceMode('mock')

  const origGetSchedule = campusApi.getSchedule
  campusApi.getSchedule = function () {
    return Promise.reject(new Error('network timeout'))
  }

  try {
    const indexPage = rt.mountPage('pages/index/index.js')
    indexPage.onLoad()
    indexPage.onShow()
    await waitFor(function () {
      return indexPage.data.scheduleFailed === true
    })

    assert.equal(indexPage.data.scheduleLoaded, false)
    assert.equal(indexPage.data.currentWeek, 0)
    assert.equal(indexPage.data.weekBadgeText, i18n.t('common.loadFailed'))
    assert.equal(indexPage.data.todayClassCountText, i18n.t('common.loadFailed'))
    await settleMockCycle(240)
  } finally {
    campusApi.getSchedule = origGetSchedule
  }
})
