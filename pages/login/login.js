const storageKeys = require('../../constants/storage.js')
const { MOCK_CREDENTIALS_HINT } = require('../../constants/features.js')
const utils = require('../../utils/util.js')
const auth = require('../../services/auth.js')
const authApi = require('../../services/apis/auth.js')
const dataSource = require('../../services/data-source.js')
const { createSubmitGuard } = require('../../utils/debounce.js')
var themeUtil = require('../../utils/theme')

const loginGuard = createSubmitGuard()

Page({
  data: {
    themeClass: '',
    ready: false,
    versionCode: '',
    useMockData: false,
    dataSourceLabel: '真实接口',
    mockCredentialsHint: MOCK_CREDENTIALS_HINT
  },

  formSubmit: function(e) {
    if (!loginGuard.acquire()) return

    const username = String(e.detail.value.username || '').trim()
    const password = String(e.detail.value.password || '').trim()

    if (!username) {
      utils.showNoActionModal('请填写校园网账号信息', '用户名不能为空')
      loginGuard.release()
      return
    }

    if (!password) {
      utils.showNoActionModal('请填写校园网账号信息', '密码不能为空')
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
      utils.showModal('登录失败', result.message || '账号或密码错误')
    }).catch((error) => {
      wx.hideNavigationBarLoading()
      utils.showModal('登录失败', error.message)
    }).finally(function () {
      loginGuard.release()
    })
  },

  refreshRuntimeState: function() {
    this.setData({
      useMockData: dataSource.isMockMode(),
      dataSourceLabel: dataSource.getDataSourceLabel()
    })
  },

  handleDataSourceChange: function(event) {
    const useMockData = !!event.detail.value
    dataSource.setDataSourceMode(useMockData ? dataSource.DATA_SOURCE_MODES.mock : dataSource.DATA_SOURCE_MODES.remote)
    auth.clearSession()
    this.refreshRuntimeState()
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
  }
})
