const utils = require('../../utils/util.js')
const auth = require('../../services/auth.js')
const authApi = require('../../services/apis/auth.js')

Page({
  data: {
    login: false,
    versionCode: null
  },

  formSubmit: function(e) {
    const username = e.detail.value.username
    const password = e.detail.value.password

    if (!username || !password) {
      utils.showNoActionModal('请填写校园网账号信息', '校园网账号和密码不能为空')
      return
    }

    wx.showNavigationBarLoading()
    authApi.loginWithCampus({
      username,
      password
    }).then((result) => {
      wx.hideNavigationBarLoading()
      if (result.success && result.data && result.data.token) {
        wx.setStorageSync('username', username)
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
    })
  },

  onLoad: function() {
    this.setData({
      versionCode: wx.getAccountInfoSync().miniProgram.version
    })

    auth.validateSessionToken().then((valid) => {
      if (valid) {
        wx.redirectTo({
          url: '../index/index'
        })
        return
      }

      auth.clearSession()
      this.setData({
        login: true
      })
    })
  }
})
