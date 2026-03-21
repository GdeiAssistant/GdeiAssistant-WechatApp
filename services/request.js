const config = require('../config/index.js')
const auth = require('./auth.js')
const dataSource = require('./data-source.js')
const mock = require('../mock/index.js')
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
    }
    const app = getApp()
    header['Accept-Language'] = (app && app.globalData && app.globalData.locale) || 'zh-CN'

    if (showLoading) {
      wx.showNavigationBarLoading()
      wx.showLoading({ title: loadingTitle, mask: true })
    }

    const finishLoading = function() {
      if (showLoading) {
        wx.hideNavigationBarLoading()
        wx.hideLoading()
      }
    }

    const resolvePayload = function(payload) {
      resolve(normalizePayload(payload))
    }

    const rejectPayload = function(error) {
      if (error && error.statusCode === 401) {
        auth.clearSession()
        auth.reLaunchToLogin('登录过期', '登录凭证已过期，请重新登录')
        reject(new Error('登录凭证已过期，请重新登录'))
        return
      }

      reject(new Error(error && error.message ? error.message : '服务暂不可用，请稍后再试'))
    }

    if (dataSource.isMockMode()) {
      mock.handleRequest({
        url,
        path: url,
        method,
        data,
        header,
        sessionToken
      }).then(resolvePayload).catch(rejectPayload).finally(finishLoading)
      return
    }

    wx.request({
      url: /^https?:\/\//.test(url) ? url : config.resourceDomain + url,
      method,
      header,
      timeout: config.requestTimeout,
      data,
      success: function(res) {
        if (res.statusCode === 200) {
          resolvePayload(res.data)
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
      complete: finishLoading
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
