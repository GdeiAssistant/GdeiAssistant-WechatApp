var themeUtil = require('../../utils/theme')
var i18n = require('../../utils/i18n')

var ACCENT_SWATCHES = [
  { id: 'banyan', light: '#0E7C61', soft: '#E4F3EE', dark: '#2DD4BF', darkSoft: '#12332A' },
  { id: 'kapok', light: '#C85A32', soft: '#FBECE6', dark: '#FB923C', darkSoft: '#361F14' },
  { id: 'haizhu', light: '#1D4ED8', soft: '#E8EFFD', dark: '#60A5FA', darkSoft: '#142642' },
  { id: 'bauhinia', light: '#6D28D9', soft: '#F1EAFF', dark: '#A78BFA', darkSoft: '#24183D' }
]

Page({
  data: {
    t: {},
    themeClass: 'theme-light accent-banyan',
    themeAccent: 'banyan',
    themeColor: '#0E7C61',
    isDarkTheme: false,
    fontStyle: '',
    themeMode: 'system',
    fontScaleStep: 1,
    fontScales: themeUtil.FONT_SCALES,
    accents: [],
    currentLocale: '',
    locales: [
      { code: 'zh-CN', label: '简体中文' },
      { code: 'zh-HK', label: '粵語（香港）' },
      { code: 'zh-TW', label: '國語（台灣）' },
      { code: 'en', label: 'English' },
      { code: 'ja', label: '日本語' },
      { code: 'ko', label: '한국어' }
    ]
  },

  onLoad: function () {
    this.refreshI18n()
    themeUtil.applyTheme(this)
    var accent =
      typeof themeUtil.getThemeAccent === 'function' ? themeUtil.getThemeAccent() : 'banyan'
    this.setData({
      themeMode: themeUtil.getThemeMode(),
      themeAccent: accent,
      fontScaleStep: themeUtil.getFontScaleStep(),
      currentLocale: i18n.getCurrentLocale()
    })
    wx.setNavigationBarTitle({ title: i18n.t('appearance.title') })
  },

  refreshI18n: function () {
    var accentLabels = {
      banyan: i18n.t('appearance.accent.banyan'),
      kapok: i18n.t('appearance.accent.kapok'),
      haizhu: i18n.t('appearance.accent.haizhu'),
      bauhinia: i18n.t('appearance.accent.bauhinia')
    }
    var accents = ACCENT_SWATCHES.map(function (item) {
      return {
        id: item.id,
        label: accentLabels[item.id],
        light: item.light,
        soft: item.soft,
        dark: item.dark,
        darkSoft: item.darkSoft
      }
    })
    this.setData({
      t: {
        title: i18n.t('appearance.title'),
        themeLabel: i18n.t('appearance.theme.label'),
        themeSystem: i18n.t('appearance.theme.system'),
        themeLight: i18n.t('appearance.theme.light'),
        themeDark: i18n.t('appearance.theme.dark'),
        accentLabel: i18n.t('appearance.accent.label'),
        fontLabel: i18n.t('appearance.font.label'),
        fontSmall: i18n.t('appearance.font.small'),
        fontStandard: i18n.t('appearance.font.standard'),
        fontLarge: i18n.t('appearance.font.large'),
        fontXlarge: i18n.t('appearance.font.xlarge'),
        fontPreview: i18n.t('appearance.font.preview'),
        langLabel: i18n.t('appearance.language.label')
      },
      accents: accents
    })
    wx.setNavigationBarTitle({ title: i18n.t('appearance.title') })
  },

  onThemeSelect: function (e) {
    var mode = e.currentTarget.dataset.mode
    themeUtil.setThemeMode(mode)
    themeUtil.applyTheme(this)
    this.setData({ themeMode: mode })
  },

  onAccentSelect: function (e) {
    var accent = e.currentTarget.dataset.accent
    if (typeof themeUtil.setThemeAccent === 'function') {
      accent = themeUtil.setThemeAccent(accent)
    }
    themeUtil.applyTheme(this)
    this.setData({ themeAccent: accent })
  },

  onFontChange: function (e) {
    var step = parseInt(e.detail.value, 10)
    themeUtil.setFontScaleStep(step)
    this.setData({
      fontScaleStep: step,
      fontStyle: themeUtil.buildFontStyle(step)
    })
  },

  onLocaleSelect: function (e) {
    var code = e.currentTarget.dataset.code
    i18n.setLocale(code)
    this.setData({ currentLocale: code })
    this.refreshI18n()
    wx.setNavigationBarTitle({ title: i18n.t('appearance.title') })
  }
})
