var THEME_KEY = 'theme'
var FONT_SCALE_KEY = 'font_scale_step'
var FONT_SCALES = [0.85, 1.0, 1.15, 1.3]

function getStoredThemeMode() {
  try {
    return wx.getStorageSync(THEME_KEY) || 'system'
  } catch (e) {
    return 'system'
  }
}

function getSystemTheme() {
  try {
    return wx.getSystemInfoSync().theme || 'light'
  } catch (e) {
    return 'light'
  }
}

function resolveEffective(mode) {
  if (mode === 'light' || mode === 'dark') return mode
  return getSystemTheme()
}

function getStoredFontScaleStep() {
  try {
    var v = parseInt(wx.getStorageSync(FONT_SCALE_KEY), 10)
    return v >= 0 && v <= 3 ? v : 1
  } catch (e) {
    return 1
  }
}

/**
 * Build an inline style string for font scaling based on the current step.
 * Pages should bind this to a root element: style="{{fontStyle}}"
 */
function buildFontStyle(step) {
  var scale = FONT_SCALES[step] || 1.0
  if (scale === 1.0) return ''
  return 'font-size:' + Math.round(scale * 32) + 'rpx;'
}

var ACCENT_KEY = 'themeAccent'
var DEFAULT_ACCENT = 'banyan'
var ACCENTS = ['banyan', 'kapok', 'haizhu', 'bauhinia']
var ACCENT_COLORS = {
  banyan: { light: '#0E7C61', dark: '#2DD4BF' },
  kapok: { light: '#C85A32', dark: '#FB923C' },
  haizhu: { light: '#1D4ED8', dark: '#60A5FA' },
  bauhinia: { light: '#6D28D9', dark: '#A78BFA' }
}

function normalizeThemeAccent(accent) {
  return ACCENTS.indexOf(accent) !== -1 ? accent : DEFAULT_ACCENT
}

function getStoredThemeAccent() {
  try {
    return normalizeThemeAccent(wx.getStorageSync(ACCENT_KEY))
  } catch (_e) {
    return DEFAULT_ACCENT
  }
}

function buildThemeClass(effectiveTheme, accent) {
  var themeToken = effectiveTheme === 'dark' ? 'theme-dark' : 'theme-light'
  return themeToken + ' accent-' + normalizeThemeAccent(accent)
}

function resolveThemeColor(effectiveTheme, accent) {
  var normalized = normalizeThemeAccent(accent)
  var palette = ACCENT_COLORS[normalized] || ACCENT_COLORS[DEFAULT_ACCENT]
  return effectiveTheme === 'dark' ? palette.dark : palette.light
}

module.exports = {
  FONT_SCALES: FONT_SCALES,
  ACCENTS: ACCENTS,
  ACCENT_COLORS: ACCENT_COLORS,
  DEFAULT_ACCENT: DEFAULT_ACCENT,
  normalizeThemeAccent: normalizeThemeAccent,
  buildThemeClass: buildThemeClass,

  getThemeMode: getStoredThemeMode,

  getEffectiveTheme: function () {
    return resolveEffective(getStoredThemeMode())
  },

  setThemeMode: function (mode) {
    wx.setStorageSync(THEME_KEY, mode)
    var app = typeof getApp === 'function' ? getApp() : null
    if (app && app.globalData) {
      app.globalData.theme = resolveEffective(mode)
    }
  },

  getThemeAccent: getStoredThemeAccent,

  setThemeAccent: function (accent) {
    var normalized = normalizeThemeAccent(accent)
    wx.setStorageSync(ACCENT_KEY, normalized)
    var app = typeof getApp === 'function' ? getApp() : null
    if (app && app.globalData) {
      app.globalData.themeAccent = normalized
    }
    return normalized
  },

  getThemeClass: function () {
    return buildThemeClass(resolveEffective(getStoredThemeMode()), getStoredThemeAccent())
  },

  getThemeColor: function () {
    return resolveThemeColor(resolveEffective(getStoredThemeMode()), getStoredThemeAccent())
  },

  getFontScaleStep: getStoredFontScaleStep,

  getFontScale: function () {
    return FONT_SCALES[getStoredFontScaleStep()] || 1.0
  },

  setFontScaleStep: function (step) {
    wx.setStorageSync(FONT_SCALE_KEY, step)
    var app = typeof getApp === 'function' ? getApp() : null
    if (app && app.globalData) {
      app.globalData.fontScaleStep = step
    }
  },

  buildFontStyle: buildFontStyle,

  applyTheme: function (pageInstance) {
    var effective = resolveEffective(getStoredThemeMode())
    var accent = getStoredThemeAccent()
    var step = getStoredFontScaleStep()
    var isDark = effective === 'dark'
    pageInstance.setData({
      themeClass: buildThemeClass(effective, accent),
      themeAccent: accent,
      themeColor: resolveThemeColor(effective, accent),
      isDarkTheme: isDark,
      fontStyle: buildFontStyle(step)
    })
    // Sync navigation bar colors with theme
    if (typeof wx.setNavigationBarColor === 'function') {
      wx.setNavigationBarColor({
        frontColor: isDark ? '#ffffff' : '#000000',
        backgroundColor: isDark ? '#0D1311' : '#F7F6F2',
        animation: { duration: 200, timingFunc: 'easeIn' }
      })
    }
    if (typeof wx.setBackgroundColor === 'function') {
      var windowBackground = isDark ? '#0D1311' : '#F7F6F2'
      wx.setBackgroundColor({
        backgroundColor: windowBackground,
        backgroundColorTop: windowBackground,
        backgroundColorBottom: windowBackground
      })
    }
  },

  initThemeListener: function () {
    var self = this
    if (typeof wx.onThemeChange !== 'function') {
      return
    }
    wx.onThemeChange(function (res) {
      var mode = getStoredThemeMode()
      if (mode === 'system') {
        var app = typeof getApp === 'function' ? getApp() : null
        if (app && app.globalData) {
          app.globalData.theme = res.theme
        }
        var pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
        if (pages.length > 0) {
          self.applyTheme(pages[pages.length - 1])
        }
      }
    })
  }
}
