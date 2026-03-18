const config = require('../config/index.js')
const storageKeys = require('../constants/storage.js')
const endpoints = require('./endpoints.js')
const dataSource = require('./data-source.js')
const mock = require('../mock/index.js')
const { normalizePayload } = require('./response.js')
let reLaunching = false
const SESSION_STORAGE_KEYS = [storageKeys.sessionToken, storageKeys.username, 'accessToken', 'refreshToken']

function getSessionToken() {
  return wx.getStorageSync(storageKeys.sessionToken)
}

function setSessionToken(token) {
  wx.setStorageSync(storageKeys.sessionToken, token)
}

function clearSession() {
  SESSION_STORAGE_KEYS.forEach(function(key) {
    try {
      wx.removeStorageSync(key)
    } catch (error) {
      // Ignore storage cleanup failures.
    }
  })
}

function reLaunchToLogin(title, content) {
  if (reLaunching) {
    return
  }
  reLaunching = true

  wx.showModal({
    title,
    content,
    showCancel: false,
    success: function(res) {
      reLaunching = false
      if (res.confirm) {
        wx.reLaunch({ url: '/pages/login/login' })
      }
    },
    fail: function() {
      reLaunching = false
    }
  })
}

function ensureSessionToken(options) {
  const interactive = !options || options.interactive !== false
  const token = getSessionToken()

  if (token) {
    return Promise.resolve(token)
  }

  if (interactive) {
    clearSession()
    reLaunchToLogin('登录失效', '未检测到登录凭证，请重新登录')
  }

  return Promise.reject(new Error('未检测到登录凭证'))
}

function logout() {
  const token = getSessionToken()
  if (!token) {
    return Promise.resolve()
  }

  if (dataSource.isMockMode()) {
    return mock.handleLogout(token)
  }

  return new Promise((resolve) => {
    wx.request({
      url: config.resourceDomain + endpoints.auth.logout,
      method: 'POST',
      header: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: config.requestTimeout,
      complete: function() {
        resolve()
      }
    })
  })
}

function validateSessionToken() {
  const token = getSessionToken()
  if (!token) {
    return Promise.resolve(false)
  }

  if (dataSource.isMockMode()) {
    return Promise.resolve(mock.isSessionTokenValid(token))
  }

  return new Promise((resolve) => {
    wx.request({
      url: config.resourceDomain + endpoints.user.profile,
      method: 'GET',
      header: {
        Authorization: `Bearer ${token}`
      },
      timeout: config.requestTimeout,
      success: function(result) {
        if (result.statusCode === 200) {
          const payload = normalizePayload(result.data)
          resolve(!!payload.success)
          return
        }

        resolve(false)
      },
      fail: function() {
        resolve(false)
      }
    })
  })
}

module.exports = {
  getSessionToken,
  setSessionToken,
  clearSession,
  reLaunchToLogin,
  ensureSessionToken,
  logout,
  validateSessionToken
}
