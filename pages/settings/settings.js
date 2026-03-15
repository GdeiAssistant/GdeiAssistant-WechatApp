const config = require('../../config/index.js')
const { FEATURE_SECTIONS, FEATURE_MAP, MOCK_CREDENTIALS_HINT } = require('../../constants/features.js')
const auth = require('../../services/auth.js')
const dataSource = require('../../services/data-source.js')
const featureConfig = require('../../services/feature-config.js')

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
    useMockData: false,
    dataSourceLabel: '',
    resourceDomain: config.resourceDomain,
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
      title: '切换成功',
      content: '数据源已切换，请重新登录后继续使用。',
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
    this.refreshPageState()
  }
})
