const config = require('../config/index.js')
const auth = require('./auth.js')
const { normalizePayload, pickMessage } = require('./response.js')

function request(options) {
  const {
    url,
    method = 'GET',
    data = {},
    authRequired = false,
    contentType = 'application/json',
    showLoading = false,
    loadingTitle = '加载中'
  } = options

  const execute = (sessionToken) => new Promise((resolve, reject) => {
    const header = {}
    if (contentType) {
      header['Content-Type'] = contentType
    }
    if (sessionToken) {
      header.Authorization = `Bearer ${sessionToken}`
      header.token = sessionToken
    }

    if (showLoading) {
      wx.showNavigationBarLoading()
      wx.showLoading({ title: loadingTitle, mask: true })
    }

    wx.request({
      url: /^https?:\/\//.test(url) ? url : config.resourceDomain + url,
      method,
      header,
      timeout: config.requestTimeout,
      data,
      success: function(res) {
        if (res.statusCode === 200) {
          resolve(normalizePayload(res.data))
        } else if (res.statusCode === 401) {
          auth.clearSession()
          auth.reLaunchToLogin('登录过期', '登录凭证已过期，请重新登录')
          reject(new Error('登录凭证已过期，请重新登录'))
        } else {
          reject(new Error(pickMessage(res.data)))
        }
      },
      fail: function() {
        reject(new Error('网络连接超时，请重试'))
      },
      complete: function() {
        if (showLoading) {
          wx.hideNavigationBarLoading()
          wx.hideLoading()
        }
      }
    })
  })

  if (!authRequired) {
    return execute()
  }

  return auth.ensureSessionToken().then((token) => execute(token))
}

module.exports = {
  request
}
