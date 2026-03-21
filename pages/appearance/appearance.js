var themeUtil = require('../../utils/theme')
var i18n = require('../../utils/i18n')

Page({
  data: {
    t: {},
    themeClass: '',
    themeMode: 'system',
    fontScaleStep: 1,
    fontScales: themeUtil.FONT_SCALES,
    currentLocale: '',
    locales: [
      { code: 'zh-CN', label: '简体中文' },
      { code: 'zh-HK', label: '繁體中文（香港）' },
      { code: 'zh-TW', label: '繁體中文（台灣）' },
      { code: 'en', label: 'English' },
      { code: 'ja', label: '日本語' },
      { code: 'ko', label: '한국어' }
    ]
  },

  onLoad: function () {
    this.refreshI18n()
    themeUtil.applyTheme(this)
    this.setData({
      themeMode: themeUtil.getThemeMode(),
      fontScaleStep: themeUtil.getFontScaleStep(),
      currentLocale: i18n.getCurrentLocale()
    })
    wx.setNavigationBarTitle({ title: i18n.t('appearance.title') })
  },

  refreshI18n: function () {
    this.setData({
      t: {
        title: i18n.t('appearance.title'),
        themeLabel: i18n.t('appearance.theme.label'),
        themeSystem: i18n.t('appearance.theme.system'),
        themeLight: i18n.t('appearance.theme.light'),
        themeDark: i18n.t('appearance.theme.dark'),
        fontLabel: i18n.t('appearance.font.label'),
        fontSmall: i18n.t('appearance.font.small'),
        fontStandard: i18n.t('appearance.font.standard'),
        fontLarge: i18n.t('appearance.font.large'),
        fontXlarge: i18n.t('appearance.font.xlarge'),
        fontPreview: i18n.t('appearance.font.preview'),
        langLabel: i18n.t('appearance.language.label')
      }
    })
  },

  onThemeSelect: function (e) {
    var mode = e.currentTarget.dataset.mode
    themeUtil.setThemeMode(mode)
    themeUtil.applyTheme(this)
    this.setData({ themeMode: mode })
  },

  onFontChange: function (e) {
    var step = parseInt(e.detail.value, 10)
    themeUtil.setFontScaleStep(step)
    this.setData({ fontScaleStep: step })
  },

  onLocaleSelect: function (e) {
    var code = e.currentTarget.dataset.code
    i18n.setLocale(code)
    this.setData({ currentLocale: code })
    this.refreshI18n()
    wx.setNavigationBarTitle({ title: i18n.t('appearance.title') })
  }
})
