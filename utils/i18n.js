const localeCache = {}
const SUPPORTED_LOCALES = ['zh-CN', 'zh-HK', 'zh-TW', 'en', 'ja', 'ko']

function loadLocale(lang) {
  if (!localeCache[lang]) {
    try {
      localeCache[lang] = require('../locales/' + lang + '.json')
    } catch (e) {
      localeCache[lang] = require('../locales/zh-CN.json')
    }
  }
  return localeCache[lang]
}

function t(key) {
  var app = null
  try { app = getApp() } catch (e) { /* Node test environment */ }
  const lang = normalizeLocale((app && app.globalData && app.globalData.locale) || 'zh-CN')
  const messages = loadLocale(lang)
  return key.split('.').reduce(function (obj, k) {
    return (obj && obj[k] !== undefined) ? obj[k] : null
  }, messages) || key
}

/**
 * Translate with placeholder replacement.
 * Usage: tReplace('schedule.currentWeek', { week: 5 })
 * Template uses {{key}} syntax in locale strings.
 */
function tReplace(key, params) {
  var result = t(key)
  if (typeof result !== 'string' || !params) return result
  Object.keys(params).forEach(function (k) {
    result = result.replace(new RegExp('\\{\\{' + k + '\\}\\}', 'g'), String(params[k]))
  })
  return result
}

function detectSystemLocale() {
  try {
    var info = wx.getSystemInfoSync()
    return normalizeLocale(info.language)
  } catch (e) { /* ignore */ }
  return 'zh-CN'
}

function normalizeLocale(locale) {
  var lang = String(locale || '').trim().replace(/_/g, '-').toLowerCase()
  if (!lang) {
    return 'zh-CN'
  }
  if (lang === 'zh-cn' || lang === 'zh-hans' || lang === 'zh-hans-cn' || lang === 'zh') return 'zh-CN'
  if (lang === 'zh-hk' || lang === 'zh-hant-hk') return 'zh-HK'
  if (lang === 'zh-tw' || lang === 'zh-hant' || lang === 'zh-hant-tw') return 'zh-TW'
  if (lang.indexOf('zh-hk') === 0) return 'zh-HK'
  if (lang.indexOf('zh-tw') === 0 || lang.indexOf('zh-hant') === 0) return 'zh-TW'
  if (lang.indexOf('zh') === 0) return 'zh-CN'
  if (lang.indexOf('en') === 0) return 'en'
  if (lang.indexOf('ja') === 0) return 'ja'
  if (lang.indexOf('ko') === 0) return 'ko'
  return 'zh-CN'
}

function setLocale(locale) {
  var normalizedLocale = normalizeLocale(locale)
  var app = null
  try { app = getApp() } catch (e) { /* Node test environment */ }
  if (app && app.globalData) {
    app.globalData.locale = normalizedLocale
  }
  if (typeof wx !== 'undefined' && wx && wx.setStorageSync) {
    wx.setStorageSync('locale', normalizedLocale)
  }
}

function getCurrentLocale() {
  var storedLocale = ''
  if (typeof wx !== 'undefined' && wx && wx.getStorageSync) {
    storedLocale = wx.getStorageSync('locale')
  }
  return normalizeLocale(storedLocale || detectSystemLocale())
}

module.exports = {
  t: t,
  tReplace: tReplace,
  setLocale: setLocale,
  getCurrentLocale: getCurrentLocale,
  detectSystemLocale: detectSystemLocale,
  normalizeLocale: normalizeLocale,
  SUPPORTED_LOCALES: SUPPORTED_LOCALES
}
