const localeCache = {}

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
  const app = getApp()
  const lang = (app && app.globalData && app.globalData.locale) || 'zh-CN'
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
    var lang = (info.language || '').replace('_', '-')
    var supported = ['zh-CN', 'zh-HK', 'zh-TW', 'en', 'ja', 'ko']
    if (supported.indexOf(lang) !== -1) return lang
    if (lang.indexOf('zh') === 0) return 'zh-CN'
    if (lang.indexOf('ja') === 0) return 'ja'
    if (lang.indexOf('ko') === 0) return 'ko'
    if (lang.indexOf('en') === 0) return 'en'
  } catch (e) { /* ignore */ }
  return 'zh-CN'
}

function setLocale(locale) {
  var app = getApp()
  if (app && app.globalData) {
    app.globalData.locale = locale
  }
  wx.setStorageSync('locale', locale)
}

function getCurrentLocale() {
  return wx.getStorageSync('locale') || detectSystemLocale()
}

module.exports = { t: t, tReplace: tReplace, setLocale: setLocale, getCurrentLocale: getCurrentLocale, detectSystemLocale: detectSystemLocale }
