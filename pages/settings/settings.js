const { FEATURE_SECTIONS, FEATURE_MAP, MOCK_CREDENTIALS_HINT } = require('../../constants/features.js')
const auth = require('../../services/auth.js')
const dataSource = require('../../services/data-source.js')
const featureConfig = require('../../services/feature-config.js')
var themeUtil = require('../../utils/theme')
const i18n = require('../../utils/i18n.js')

function buildFeatureSections() {
  const featureVisibility = featureConfig.getFeatureVisibility()
  return FEATURE_SECTIONS.map(function(section) {
    return {
      id: section.id,
      title: section.title,
      features: section.featureIds.map(function(featureId) {
        const feature = FEATURE_MAP[featureId]
        return {
          id: feature.id,
          title: feature.title,
          visible: featureVisibility[feature.id] !== false
        }
      })
    }
  })
}

Page({
  data: {
    t: {},
    themeClass: '',
    useMockData: false,
    dataSourceLabel: '',
    mockCredentialsHint: MOCK_CREDENTIALS_HINT,
    featureSections: []
  },

  refreshPageState: function() {
    this.setData({
      useMockData: dataSource.isMockMode(),
      dataSourceLabel: dataSource.getDataSourceLabel(),
      featureSections: buildFeatureSections()
    })
  },

  handleDataSourceChange: function(event) {
    const useMockData = !!event.detail.value
    dataSource.setDataSourceMode(useMockData ? dataSource.DATA_SOURCE_MODES.mock : dataSource.DATA_SOURCE_MODES.remote)
    auth.clearSession()
    this.refreshPageState()
    wx.showModal({
      title: this.data.t.switchSuccess,
      content: this.data.t.switchSuccessContent,
      showCancel: false,
      success: function() {
        wx.reLaunch({
          url: '/pages/login/login'
        })
      }
    })
  },

  handleFeatureSwitch: function(event) {
    const featureId = event.currentTarget.dataset.featureId
    const visible = !!event.detail.value
    featureConfig.setFeatureVisible(featureId, visible)
    this.refreshPageState()
  },

  onLoad: function() {
    this.refreshPageState()
  },

  onShow: function() {
    themeUtil.applyTheme(this)
    this.refreshI18n()
    this.refreshPageState()
  },

  refreshI18n: function() {
    this.setData({
      t: {
        navTitle: i18n.t('settingsPage.navTitle'),
        dataSourceTitle: i18n.t('settingsPage.dataSourceTitle'),
        useMockData: i18n.t('settingsPage.useMockData'),
        currentMode: i18n.t('settingsPage.currentMode'),
        featureDisplayTitle: i18n.t('settingsPage.featureDisplayTitle'),
        switchSuccess: i18n.t('settingsPage.switchSuccess'),
        switchSuccessContent: i18n.t('settingsPage.switchSuccessContent')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  }
})
