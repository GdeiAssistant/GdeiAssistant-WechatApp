const config = require('../config/index.js')
const endpoints = require('./endpoints.js')
const { normalizePayload, pickMessage } = require('./response.js')

let refreshingPromise = null

function validateTokenTimestamp(expireTime) {
  if (!expireTime) {
    return false
  }
  return Math.floor((expireTime - Date.now()) / (3600 * 1000)) >= 1
}

function getAccessToken() {
  return wx.getStorageSync('accessToken')
}

function getRefreshToken() {
  return wx.getStorageSync('refreshToken')
}

function setTokens(accessToken, refreshToken) {
  wx.setStorageSync('accessToken', accessToken)
  wx.setStorageSync('refreshToken', refreshToken)
}

function clearSession() {
  wx.clearStorageSync()
}

function reLaunchToLogin(title, content) {
  wx.showModal({
    title,
    content,
    showCancel: false,
    success: function(res) {
      if (res.confirm) {
        wx.reLaunch({ url: '/pages/login/login' })
      }
    }
  })
}

function refreshAccessToken(interactive) {
  if (refreshingPromise) {
    return refreshingPromise
  }

  const refreshToken = getRefreshToken()
  if (!refreshToken || !validateTokenTimestamp(refreshToken.expireTime)) {
    if (interactive) {
      clearSession()
      reLaunchToLogin('令牌过期', '用户登录凭证已过期，请重新登录')
    }
    return Promise.reject(new Error('登录凭证过期'))
  }

  refreshingPromise = new Promise((resolve, reject) => {
    wx.request({
      url: config.resourceDomain + endpoints.auth.refreshToken,
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: config.requestTimeout,
      data: {
        token: refreshToken.signature
      },
      success: function(result) {
        if (result.statusCode !== 200) {
          reject(new Error(pickMessage(result.data)))
          return
        }

        const payload = normalizePayload(result.data)
        if (payload.success && payload.data && payload.data.accessToken && payload.data.refreshToken) {
          setTokens(payload.data.accessToken, payload.data.refreshToken)
          resolve(payload.data.accessToken.signature)
          return
        }

        if (interactive) {
          clearSession()
          reLaunchToLogin('更新令牌失败', payload.message || '请重新登录')
        }
        reject(new Error(payload.message || '刷新令牌失败'))
      },
      fail: function() {
        reject(new Error('网络异常，请稍后重试'))
      },
      complete: function() {
        refreshingPromise = null
      }
    })
  })

  return refreshingPromise
}

function ensureAccessTokenSignature(options) {
  const interactive = !options || options.interactive !== false
  const accessToken = getAccessToken()
  if (accessToken && validateTokenTimestamp(accessToken.expireTime)) {
    return Promise.resolve(accessToken.signature)
  }

  return refreshAccessToken(interactive)
}

function expireToken(signature) {
  if (!signature) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    wx.request({
      url: config.resourceDomain + endpoints.auth.expireToken,
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: config.requestTimeout,
      data: { token: signature },
      complete: function() {
        resolve()
      }
    })
  })
}

module.exports = {
  validateTokenTimestamp,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearSession,
  reLaunchToLogin,
  refreshAccessToken,
  ensureAccessTokenSignature,
  expireToken
}
