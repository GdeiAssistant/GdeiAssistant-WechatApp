const storageKeys = require('../../constants/storage.js')
const { getMockCredentialsHint } = require('../../constants/features.js')
const utils = require('../../utils/util.js')
const auth = require('../../services/auth.js')
const authApi = require('../../services/apis/auth.js')
const dataSource = require('../../services/data-source.js')
const { createSubmitGuard } = require('../../utils/debounce.js')
var themeUtil = require('../../utils/theme')
var i18n = require('../../utils/i18n')

const loginGuard = createSubmitGuard()

Page({
  data: {
    themeClass: '',
    fontStyle: '',
    t: {},
    ready: false,
    versionCode: '',
    useMockData: false,
    dataSourceLabel: '',
    mockCredentialsHint: ''
  },

  refreshI18n: function () {
    var dataSourceRaw = dataSource.getDataSourceLabel()
    this.setData({
      t: {
        navTitle: i18n.t('login.navTitle'),
        appName: i18n.t('login.appName'),
        dataSourceLabel: i18n.t('login.dataSourceLabel') + dataSourceRaw,
        usernamePlaceholder: i18n.t('login.usernamePlaceholder'),
        passwordPlaceholder: i18n.t('login.passwordPlaceholder'),
        button: i18n.t('login.button'),
        debugSettings: i18n.t('login.debugSettings'),
        useMockData: i18n.t('login.useMockData'),
        moreSettings: i18n.t('login.moreSettings')
      },
      mockCredentialsHint: getMockCredentialsHint()
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },

  formSubmit: function(e) {
    if (!loginGuard.acquire()) return

    const username = String(e.detail.value.username || '').trim()
    const password = String(e.detail.value.password || '').trim()

    if (!username) {
      utils.showNoActionModal(i18n.t('login.fillCredentials'), i18n.t('login.usernameEmpty'))
      loginGuard.release()
      return
    }

    if (!password) {
      utils.showNoActionModal(i18n.t('login.fillCredentials'), i18n.t('login.passwordEmpty'))
      loginGuard.release()
      return
    }

    wx.showNavigationBarLoading()
    authApi.loginWithCampus({
      username,
      password
    }).then((result) => {
      wx.hideNavigationBarLoading()
      if (result.success && result.data && result.data.token) {
        wx.setStorageSync(storageKeys.username, username)
        auth.setSessionToken(result.data.token)
        wx.redirectTo({
          url: '../index/index'
        })
        return
      }
      utils.showModal(i18n.t('login.loginFailed'), result.message || i18n.t('login.defaultError'))
    }).catch((error) => {
      wx.hideNavigationBarLoading()
      utils.showModal(i18n.t('login.loginFailed'), error.message)
    }).finally(function () {
      loginGuard.release()
    })
  },

  refreshRuntimeState: function() {
    this.setData({
      useMockData: dataSource.isMockMode()
    })
  },

  handleDataSourceChange: function(event) {
    const useMockData = !!event.detail.value
    dataSource.setDataSourceMode(useMockData ? dataSource.DATA_SOURCE_MODES.mock : dataSource.DATA_SOURCE_MODES.remote)
    auth.clearSession()
    this.refreshRuntimeState()
    this.refreshI18n()
  },

  onLoad: function() {
    let versionCode = ''
    try {
      versionCode = wx.getAccountInfoSync().miniProgram.version || ''
    } catch (error) {
      versionCode = ''
    }

    this.setData({ versionCode: versionCode })
    this.refreshRuntimeState()
    this.refreshI18n()

    auth.validateSessionToken().then((valid) => {
      if (valid) {
        wx.redirectTo({
          url: '../index/index'
        })
        return
      }

      auth.clearSession()
      this.setData({
        ready: true
      })
    }).catch(() => {
      auth.clearSession()
      this.setData({
        ready: true
      })
    })
  },

  onShow: function() {
    themeUtil.applyTheme(this)
    this.refreshRuntimeState()
    this.refreshI18n()
  }
})
