const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const THEME_MODULE = path.join(ROOT, 'utils/theme.js')
const PAGE_UTIL_MODULE = path.join(ROOT, 'utils/page.js')

function setupThemeEnv(options) {
  const opts = options || {}
  const storage = Object.assign({}, opts.storage || {})
  let systemTheme = opts.systemTheme || 'light'
  const navCalls = []
  const bgCalls = []
  let themeChangeHandler = null

  const prevWx = global.wx
  const prevGetApp = global.getApp
  const prevGetCurrentPages = global.getCurrentPages

  const appInstance = {
    globalData: {
      theme: 'light',
      themeAccent: 'banyan',
      fontScaleStep: 1
    }
  }
  const pages = opts.pages || []

  global.wx = {
    getStorageSync(key) {
      return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : ''
    },
    setStorageSync(key, value) {
      storage[key] = value
    },
    getAppBaseInfo() {
      return { theme: systemTheme }
    },
    getSystemInfoSync() {
      return { theme: systemTheme }
    },
    setNavigationBarColor(payload) {
      navCalls.push(payload)
    },
    setBackgroundColor(payload) {
      bgCalls.push(payload)
    },
    onThemeChange(handler) {
      themeChangeHandler = handler
    }
  }
  global.getApp = function () {
    return appInstance
  }
  global.getCurrentPages = function () {
    return pages
  }

  clearModule(THEME_MODULE)
  clearModule(PAGE_UTIL_MODULE)
  const themeUtil = require(THEME_MODULE)
  const pageUtil = require(PAGE_UTIL_MODULE)

  return {
    themeUtil,
    pageUtil,
    storage,
    navCalls,
    bgCalls,
    appInstance,
    triggerThemeChange(theme) {
      systemTheme = theme
      if (themeChangeHandler) {
        themeChangeHandler({ theme })
      }
    },
    restore() {
      clearModule(THEME_MODULE)
      clearModule(PAGE_UTIL_MODULE)
      if (prevWx === undefined) {
        delete global.wx
      } else {
        global.wx = prevWx
      }
      if (prevGetApp === undefined) {
        delete global.getApp
      } else {
        global.getApp = prevGetApp
      }
      if (prevGetCurrentPages === undefined) {
        delete global.getCurrentPages
      } else {
        global.getCurrentPages = prevGetCurrentPages
      }
    }
  }
}

test('theme defaults to light mode and banyan accent with warm paper chrome', function (t) {
  const env = setupThemeEnv()
  t.after(env.restore)

  assert.equal(env.themeUtil.getThemeAccent(), 'banyan')
  assert.equal(env.themeUtil.getThemeClass(), 'theme-light accent-banyan')
  assert.equal(env.themeUtil.getThemeColor(), '#0E7C61')

  const pageData = {}
  const mockPage = {
    setData(patch) {
      Object.assign(pageData, patch)
    }
  }
  env.themeUtil.applyTheme(mockPage)

  assert.equal(pageData.themeClass, 'theme-light accent-banyan')
  assert.equal(pageData.themeAccent, 'banyan')
  assert.equal(pageData.themeColor, '#0E7C61')
  assert.equal(pageData.isDarkTheme, false)
  assert.equal(env.navCalls[0].backgroundColor, '#F7F6F2')
  assert.equal(env.navCalls[0].frontColor, '#000000')
  assert.equal(env.bgCalls[0].backgroundColor, '#F7F6F2')
})

test('setThemeAccent persists all 4 campus accents across light and dark modes', function (t) {
  const env = setupThemeEnv({ storage: { themeMode: 'light' } })
  t.after(env.restore)

  const expected = {
    banyan: { light: '#0E7C61', dark: '#2DD4BF' },
    kapok: { light: '#C85A32', dark: '#FB923C' },
    haizhu: { light: '#1D4ED8', dark: '#60A5FA' },
    bauhinia: { light: '#6D28D9', dark: '#A78BFA' }
  }

  Object.keys(expected).forEach(function (accent) {
    env.themeUtil.setThemeMode('light')
    const saved = env.themeUtil.setThemeAccent(accent)
    assert.equal(saved, accent)
    assert.equal(env.storage.themeAccent, accent)
    assert.equal(env.appInstance.globalData.themeAccent, accent)

    const lightData = {}
    env.themeUtil.applyTheme({
      setData(patch) {
        Object.assign(lightData, patch)
      }
    })
    assert.equal(lightData.themeClass, 'theme-light accent-' + accent)
    assert.equal(lightData.themeColor, expected[accent].light)
    assert.equal(lightData.isDarkTheme, false)

    env.themeUtil.setThemeMode('dark')
    const darkData = {}
    env.pageUtil.applyTheme({
      setData(patch) {
        Object.assign(darkData, patch)
      }
    })
    assert.equal(darkData.themeClass, 'theme-dark accent-' + accent)
    assert.equal(darkData.themeColor, expected[accent].dark)
    assert.equal(darkData.isDarkTheme, true)
    assert.equal(env.navCalls[env.navCalls.length - 1].backgroundColor, '#0D1311')
    assert.equal(env.navCalls[env.navCalls.length - 1].frontColor, '#ffffff')
    assert.equal(env.bgCalls[env.bgCalls.length - 1].backgroundColor, '#0D1311')
  })
})

test('invalid accent falls back to banyan and system theme listener preserves active accent', function (t) {
  const pageData = {}
  const activePage = {
    setData(patch) {
      Object.assign(pageData, patch)
    }
  }
  const env = setupThemeEnv({
    storage: { themeMode: 'system', themeAccent: 'kapok' },
    systemTheme: 'light',
    pages: [activePage]
  })
  t.after(env.restore)

  assert.equal(env.themeUtil.normalizeThemeAccent('unknown-color'), 'banyan')
  assert.equal(env.themeUtil.setThemeAccent('invalid'), 'banyan')
  assert.equal(env.storage.themeAccent, 'banyan')

  env.themeUtil.setThemeAccent('haizhu')
  env.themeUtil.initThemeListener()
  env.triggerThemeChange('dark')

  assert.equal(env.appInstance.globalData.theme, 'dark')
  assert.equal(pageData.themeClass, 'theme-dark accent-haizhu')
  assert.equal(pageData.themeColor, '#60A5FA')
})
