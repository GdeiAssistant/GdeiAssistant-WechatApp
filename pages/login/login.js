const utils = require('../../utils/util.js')
const auth = require('../../services/auth.js')
const authApi = require('../../services/apis/auth.js')

Page({
  data: {
    login: false,
    unionid: null,
    versionCode: null
  },

  formSubmit: function(e) {
    const page = this
    const username = e.detail.value.username
    const password = e.detail.value.password

    if (!username || !password) {
      utils.showNoActionModal('请填写校园网账号信息', '校园网账号和密码不能为空')
      return
    }

    const signPayload = authApi.buildLoginSignature(utils)
    wx.showNavigationBarLoading()
    authApi.loginWithCampus({
      unionid: page.data.unionid,
      username,
      password,
      nonce: signPayload.nonce,
      timestamp: signPayload.timestamp,
      signature: signPayload.signature
    }).then((result) => {
      wx.hideNavigationBarLoading()
      if (result.success && result.data && result.data.user) {
        wx.setStorageSync('username', result.data.user.username)
        auth.setTokens(result.data.accessToken, result.data.refreshToken)
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
    const page = this

    this.setData({
      versionCode: wx.getAccountInfoSync().miniProgram.version
    })

    auth.ensureAccessTokenSignature({ interactive: false }).then(() => {
      wx.redirectTo({
        url: '../index/index'
      })
    }).catch(() => {
      wx.login({
        success: (res) => {
          if (!res.code) {
            utils.showModal('登录失败', '微信登录失败')
            return
          }

          authApi.getOpenIdByCode(res.code).then((result) => {
            const openId = authApi.extractOpenId(result)
            if (result.success && openId) {
              page.setData({
                unionid: openId,
                login: true
              })
              return
            }
            page.setData({
              unionid: null,
              login: true
            })
            utils.showModal('登录失败', result.message || '用户身份获取失败')
          }).catch(() => {
            utils.showModal('网络异常', '请检查网络连接')
          })
        }
      })
    })
  }
})
