const config = require('../config/index.js')
const auth = require('./auth.js')

function request(options) {
  const {
    url,
    method = 'POST',
    data = {},
    authRequired = false,
    showLoading = false,
    loadingTitle = '加载中'
  } = options

  const execute = (tokenSignature) => new Promise((resolve, reject) => {
    const header = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    const finalData = tokenSignature ? { ...data, token: tokenSignature } : data

    if (showLoading) {
      wx.showNavigationBarLoading()
      wx.showLoading({ title: loadingTitle, mask: true })
    }

    wx.request({
      url: /^https?:\/\//.test(url) ? url : config.resourceDomain + url,
      method,
      header,
      timeout: config.requestTimeout,
      data: finalData,
      success: function(res) {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error((res.data && res.data.message) || '服务暂不可用，请稍后再试'))
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

  return auth.ensureAccessTokenSignature().then((signature) => execute(signature))
}

module.exports = {
  request
}
