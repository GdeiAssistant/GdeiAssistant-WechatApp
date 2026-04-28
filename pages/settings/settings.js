const { getFeatureSections, getFeatureMap, getMockCredentialsHint } = require('../../constants/features.js')
const auth = require('../../services/auth.js')
const campusCredentialApi = require('../../services/apis/campusCredential.js')
const dataSource = require('../../services/data-source.js')
const featureConfig = require('../../services/feature-config.js')
const pageUtils = require('../../utils/page.js')
var themeUtil = require('../../utils/theme')
const i18n = require('../../utils/i18n.js')

function buildFeatureSections() {
  const featureVisibility = featureConfig.getFeatureVisibility()
  const featureMap = getFeatureMap()
  return getFeatureSections().map(function(section) {
    return {
      id: section.id,
      title: section.title,
      features: section.featureIds.map(function(featureId) {
        const feature = featureMap[featureId]
        return {
          id: feature.id,
          title: feature.title,
          visible: featureVisibility[feature.id] !== false
        }
      })
    }
  })
}

function createCampusCredentialState(patch) {
  return Object.assign(
    {
      hasSession: false,
      loaded: false,
      hasActiveConsent: false,
      hasSavedCredential: false,
      quickAuthEnabled: false,
      consentedAt: '',
      revokedAt: '',
      policyDate: '',
      effectiveDate: '',
      maskedCampusAccount: ''
    },
    patch || {}
  )
}

Page({
  data: {
    t: {},
    themeClass: '',
    useMockData: false,
    dataSourceLabel: '',
    mockCredentialsHint: '',
    featureSections: [],
    errorMessage: null,
    campusCredentialLoading: false,
    campusCredentialMessage: '',
    campusCredentialActionLoading: false,
    campusCredential: createCampusCredentialState()
  },

  refreshPageState: function() {
    this.setData({
      useMockData: dataSource.isMockMode(),
      dataSourceLabel: dataSource.getDataSourceLabel(),
      mockCredentialsHint: getMockCredentialsHint(),
      featureSections: buildFeatureSections()
    })
  },

  normalizeCampusCredentialStatus: function(rawStatus) {
    return createCampusCredentialState({
      hasSession: true,
      loaded: true,
      hasActiveConsent: !!(rawStatus && rawStatus.hasActiveConsent),
      hasSavedCredential: !!(rawStatus && rawStatus.hasSavedCredential),
      quickAuthEnabled: !!(rawStatus && rawStatus.quickAuthEnabled),
      consentedAt: rawStatus && rawStatus.consentedAt ? String(rawStatus.consentedAt) : '',
      revokedAt: rawStatus && rawStatus.revokedAt ? String(rawStatus.revokedAt) : '',
      policyDate: rawStatus && rawStatus.policyDate ? String(rawStatus.policyDate) : '',
      effectiveDate: rawStatus && rawStatus.effectiveDate ? String(rawStatus.effectiveDate) : '',
      maskedCampusAccount:
        rawStatus && rawStatus.maskedCampusAccount ? String(rawStatus.maskedCampusAccount) : ''
    })
  },

  loadCampusCredentialStatus: function(showErrorTip) {
    var hasSession = !!auth.getSessionToken()
    if (!hasSession) {
      this.setData({
        campusCredential: createCampusCredentialState(),
        campusCredentialMessage: this.data.t.campusCredentialLoginFirst
      })
      return Promise.resolve()
    }

    return pageUtils
      .runWithNavigationLoading(
        this,
        () => {
          return campusCredentialApi.getCampusCredentialStatus()
        },
        { loadingKey: 'campusCredentialLoading' }
      )
      .then((result) => {
        if (!result.success) {
          throw new Error(result.message || this.data.t.campusCredentialLoadFailed)
        }

        this.setData({
          campusCredential: this.normalizeCampusCredentialStatus(result.data || {}),
          campusCredentialMessage: ''
        })
      })
      .catch((error) => {
        var message = (error && error.message) || this.data.t.campusCredentialLoadFailed
        this.setData({
          campusCredential: createCampusCredentialState({ hasSession: true }),
          campusCredentialMessage: message
        })
        if (showErrorTip) {
          pageUtils.showTopTips(this, message)
        }
      })
  },

  runCampusCredentialAction: function(task, successMessage) {
    if (this.data.campusCredentialActionLoading) {
      return Promise.resolve()
    }

    this.setData({ campusCredentialActionLoading: true })
    return Promise.resolve()
      .then(task)
      .then((result) => {
        if (!result.success) {
          throw new Error(result.message || this.data.t.campusCredentialActionFailed)
        }

        if (successMessage && wx.showToast) {
          wx.showToast({
            title: successMessage,
            icon: 'none'
          })
        }

        return this.loadCampusCredentialStatus(false)
      })
      .catch((error) => {
        pageUtils.showTopTips(
          this,
          (error && error.message) || this.data.t.campusCredentialActionFailed
        )
        return this.loadCampusCredentialStatus(false)
      })
      .finally(() => {
        this.setData({ campusCredentialActionLoading: false })
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

  handleCampusCredentialRevoke: function() {
    if (this.data.campusCredentialActionLoading || !this.data.campusCredential.hasSession) {
      return
    }

    wx.showModal({
      title: this.data.t.campusCredentialRevokeTitle,
      content: this.data.t.campusCredentialRevokeContent,
      success: (res) => {
        if (!res.confirm) {
          return
        }
        this.runCampusCredentialAction(
          function() {
            return campusCredentialApi.revokeCampusCredentialConsent()
          },
          this.data.t.campusCredentialRevokeSuccess
        )
      }
    })
  },

  handleCampusCredentialDelete: function() {
    if (this.data.campusCredentialActionLoading || !this.data.campusCredential.hasSession) {
      return
    }

    wx.showModal({
      title: this.data.t.campusCredentialDeleteTitle,
      content: this.data.t.campusCredentialDeleteContent,
      success: (res) => {
        if (!res.confirm) {
          return
        }
        this.runCampusCredentialAction(
          function() {
            return campusCredentialApi.deleteCampusCredential()
          },
          this.data.t.campusCredentialDeleteSuccess
        )
      }
    })
  },

  handleQuickAuthSwitch: function(event) {
    if (!this.data.campusCredential.hasSession || this.data.campusCredentialActionLoading) {
      this.setData({
        'campusCredential.quickAuthEnabled': !!this.data.campusCredential.quickAuthEnabled
      })
      return
    }

    var enabled = !!(event && event.detail && event.detail.value)
    if (enabled && !this.data.campusCredential.hasActiveConsent) {
      this.setData({ 'campusCredential.quickAuthEnabled': false })
      pageUtils.showTopTips(this, this.data.t.campusCredentialEnableNeedConsent)
      return
    }

    if (enabled && !this.data.campusCredential.hasSavedCredential) {
      this.setData({ 'campusCredential.quickAuthEnabled': false })
      pageUtils.showTopTips(this, this.data.t.campusCredentialEnableNeedCredential)
      return
    }

    this.runCampusCredentialAction(
      function() {
        return campusCredentialApi.updateQuickAuth(enabled)
      },
      enabled
        ? this.data.t.campusCredentialQuickAuthEnabled
        : this.data.t.campusCredentialQuickAuthDisabled
    )
  },

  onLoad: function() {
    this.refreshI18n()
    this.refreshPageState()
    this.loadCampusCredentialStatus(false)
  },

  onShow: function() {
    themeUtil.applyTheme(this)
    this.refreshI18n()
    this.refreshPageState()
    this.loadCampusCredentialStatus(false)
  },

  refreshI18n: function() {
    this.setData({
      t: {
        navTitle: i18n.t('settingsPage.navTitle'),
        dataSourceTitle: i18n.t('settingsPage.dataSourceTitle'),
        useMockData: i18n.t('settingsPage.useMockData'),
        currentMode: i18n.t('settingsPage.currentMode'),
        campusCredentialTitle: i18n.t('settingsPage.campusCredentialTitle'),
        campusCredentialDangerTitle: i18n.t('settingsPage.campusCredentialDangerTitle'),
        campusCredentialLoginFirst: i18n.t('settingsPage.campusCredentialLoginFirst'),
        campusCredentialLoadingText: i18n.t('settingsPage.campusCredentialLoadingText'),
        campusCredentialLoadFailed: i18n.t('settingsPage.campusCredentialLoadFailed'),
        campusCredentialAuthStatus: i18n.t('settingsPage.campusCredentialAuthStatus'),
        campusCredentialAuthorized: i18n.t('settingsPage.campusCredentialAuthorized'),
        campusCredentialUnauthorized: i18n.t('settingsPage.campusCredentialUnauthorized'),
        campusCredentialSaved: i18n.t('settingsPage.campusCredentialSaved'),
        campusCredentialQuickAuth: i18n.t('settingsPage.campusCredentialQuickAuth'),
        campusCredentialConsentedAt: i18n.t('settingsPage.campusCredentialConsentedAt'),
        campusCredentialRevokedAt: i18n.t('settingsPage.campusCredentialRevokedAt'),
        campusCredentialAccount: i18n.t('settingsPage.campusCredentialAccount'),
        campusCredentialYes: i18n.t('settingsPage.campusCredentialYes'),
        campusCredentialNo: i18n.t('settingsPage.campusCredentialNo'),
        campusCredentialRevoke: i18n.t('settingsPage.campusCredentialRevoke'),
        campusCredentialDelete: i18n.t('settingsPage.campusCredentialDelete'),
        campusCredentialRevokeTitle: i18n.t('settingsPage.campusCredentialRevokeTitle'),
        campusCredentialRevokeContent: i18n.t('settingsPage.campusCredentialRevokeContent'),
        campusCredentialDeleteTitle: i18n.t('settingsPage.campusCredentialDeleteTitle'),
        campusCredentialDeleteContent: i18n.t('settingsPage.campusCredentialDeleteContent'),
        campusCredentialRevokeSuccess: i18n.t('settingsPage.campusCredentialRevokeSuccess'),
        campusCredentialDeleteSuccess: i18n.t('settingsPage.campusCredentialDeleteSuccess'),
        campusCredentialQuickAuthEnabled: i18n.t('settingsPage.campusCredentialQuickAuthEnabled'),
        campusCredentialQuickAuthDisabled: i18n.t('settingsPage.campusCredentialQuickAuthDisabled'),
        campusCredentialEnableNeedConsent: i18n.t('settingsPage.campusCredentialEnableNeedConsent'),
        campusCredentialEnableNeedCredential: i18n.t('settingsPage.campusCredentialEnableNeedCredential'),
        campusCredentialActionFailed: i18n.t('settingsPage.campusCredentialActionFailed'),
        featureDisplayTitle: i18n.t('settingsPage.featureDisplayTitle'),
        switchSuccess: i18n.t('settingsPage.switchSuccess'),
        switchSuccessContent: i18n.t('settingsPage.switchSuccessContent')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  }
})
