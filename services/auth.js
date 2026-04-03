const config = require('../config/index.js')
const storageKeys = require('../constants/storage.js')
const endpoints = require('./endpoints.js')
const dataSource = require('./data-source.js')
const mock = require('../mock/index.js')
const { normalizePayload } = require('./response.js')
const { generateRequestId } = require('./request-id.js')
const i18n = require('../utils/i18n.js')
let reLaunching = false
const SESSION_STORAGE_KEYS = [
  storageKeys.sessionToken,
  storageKeys.username,
  'accessToken',
  'refreshToken'
]

function getSessionToken() {
  return wx.getStorageSync(storageKeys.sessionToken)
}

function setSessionToken(token) {
  wx.setStorageSync(storageKeys.sessionToken, token)
}

function clearSession() {
  SESSION_STORAGE_KEYS.forEach(function (key) {
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
    success: function (res) {
      reLaunching = false
      if (res.confirm) {
        wx.reLaunch({ url: '/pages/login/login' })
      }
    },
    fail: function () {
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
    reLaunchToLogin(i18n.t('auth.loginRequiredTitle'), i18n.t('auth.loginRequiredMessage'))
  }

  return Promise.reject(new Error(i18n.t('auth.loginRequiredError')))
}

function logout() {
  const token = getSessionToken()
  if (!token) {
    return Promise.resolve()
  }

  if (dataSource.isMockMode()) {
    return mock.handleLogout(token)
  }

  var requestId = generateRequestId()
  var startTime = Date.now()

  return new Promise((resolve) => {
    wx.request({
      url: config.resourceDomain + endpoints.auth.logout,
      method: 'POST',
      header: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      },
      timeout: config.requestTimeout,
      complete: function (res) {
        var elapsed = Date.now() - startTime
        var status = (res && res.statusCode) || 'FAILED'
        console.debug(
          'rid:' +
            requestId +
            ' | POST ' +
            endpoints.auth.logout +
            ' | ' +
            status +
            ' | ' +
            elapsed +
            'ms'
        )
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

  var requestId = generateRequestId()
  var startTime = Date.now()

  return new Promise((resolve) => {
    wx.request({
      url: config.resourceDomain + endpoints.auth.validate,
      method: 'GET',
      header: {
        Authorization: `Bearer ${token}`,
        'X-Request-ID': requestId
      },
      timeout: config.requestTimeout,
      success: function (result) {
        var elapsed = Date.now() - startTime
        console.debug(
          'rid:' +
            requestId +
            ' | GET ' +
            endpoints.auth.validate +
            ' | ' +
            result.statusCode +
            ' | ' +
            elapsed +
            'ms'
        )

        if (result.statusCode === 200) {
          const payload = normalizePayload(result.data)
          resolve(!!payload.success)
          return
        }

        resolve(false)
      },
      fail: function () {
        var elapsed = Date.now() - startTime
        console.debug(
          'rid:' + requestId + ' | GET ' + endpoints.auth.validate + ' | FAILED | ' + elapsed + 'ms'
        )
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
