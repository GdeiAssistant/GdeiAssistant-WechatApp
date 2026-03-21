var THEME_KEY = 'theme'
var FONT_SCALE_KEY = 'font_scale_step'
var FONT_SCALES = [0.85, 1.0, 1.15, 1.3]

function getStoredThemeMode() {
  try { return wx.getStorageSync(THEME_KEY) || 'system' } catch (e) { return 'system' }
}

function getSystemTheme() {
  try { return wx.getSystemInfoSync().theme || 'light' } catch (e) { return 'light' }
}

function resolveEffective(mode) {
  if (mode === 'light' || mode === 'dark') return mode
  return getSystemTheme()
}

function getStoredFontScaleStep() {
  try {
    var v = parseInt(wx.getStorageSync(FONT_SCALE_KEY), 10)
    return (v >= 0 && v <= 3) ? v : 1
  } catch (e) { return 1 }
}

module.exports = {
  FONT_SCALES: FONT_SCALES,

  getThemeMode: getStoredThemeMode,

  getEffectiveTheme: function () {
    return resolveEffective(getStoredThemeMode())
  },

  setThemeMode: function (mode) {
    wx.setStorageSync(THEME_KEY, mode)
    var app = getApp()
    app.globalData.theme = resolveEffective(mode)
  },

  getFontScaleStep: getStoredFontScaleStep,

  getFontScale: function () {
    return FONT_SCALES[getStoredFontScaleStep()] || 1.0
  },

  setFontScaleStep: function (step) {
    wx.setStorageSync(FONT_SCALE_KEY, step)
    var app = getApp()
    app.globalData.fontScaleStep = step
  },

  applyTheme: function (pageInstance) {
    var effective = resolveEffective(getStoredThemeMode())
    pageInstance.setData({ themeClass: effective === 'dark' ? 'theme-dark' : '' })
  },

  initThemeListener: function () {
    var self = this
    wx.onThemeChange(function (res) {
      var mode = getStoredThemeMode()
      if (mode === 'system') {
        var app = getApp()
        app.globalData.theme = res.theme
        var pages = getCurrentPages()
        if (pages.length > 0) {
          self.applyTheme(pages[pages.length - 1])
        }
      }
    })
  }
}
