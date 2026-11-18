const config = require('../config/index.js')
const storageKeys = require('../constants/storage.js')
const endpoints = require('./endpoints.js')
const dataSource = require('./data-source.js')
const { normalizePayload } = require('./response.js')
const { generateRequestId } = require('./request-id.js')
const i18n = require('../utils/i18n.js')

const loadNodeModule =
  typeof module !== 'undefined' && typeof module.require === 'function'
    ? module.require.bind(module)
    : null

function loadMock() {
  if (typeof require.async === 'function') {
    return require.async('../mock/index.js')
  }
  return Promise.resolve(loadNodeModule ? loadNodeModule('../mock/index.js') : null)
}
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

function buildAuthHeader(token) {
  const resolvedToken = token === undefined ? getSessionToken() : token
  return resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}
}

function clearSession() {
  SESSION_STORAGE_KEYS.forEach(function (key) {
    try {
      wx.removeStorageSync(key)
    } catch (error) {
      // Ignore storage cleanup failures.
    }
  })
  try {
    const socialRealtime = require('./social-realtime.js')
    socialRealtime.disconnect()
  } catch (error) {
    // Ignore realtime cleanup failures.
  }
  try {
    const socialAvatar = require('./social-avatar.js')
    socialAvatar.clearCache()
  } catch (error) {
    // Ignore avatar cache cleanup failures.
  }
  try {
    const socialChatImage = require('./social-chat-image.js')
    socialChatImage.clearCache()
  } catch (error) {
    // Ignore chat image cache cleanup failures.
  }
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
  try {
    const socialRealtime = require('./social-realtime.js')
    socialRealtime.disconnect()
  } catch (error) {
    // Ignore realtime cleanup failures.
  }

  if (!token) {
    return Promise.resolve()
  }

  if (dataSource.isMockMode()) {
    return loadMock().then(function (mock) {
      return mock.handleLogout(token)
    })
  }

  var requestId = generateRequestId()
  var startTime = Date.now()

  return new Promise((resolve) => {
    wx.request({
      url: config.resourceDomain + endpoints.auth.logout,
      method: 'POST',
      header: Object.assign(buildAuthHeader(token), {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      }),
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
    return loadMock()
      .then(function (mock) {
        return mock.isSessionTokenValid(token)
      })
      .catch(function () {
        return false
      })
  }

  var requestId = generateRequestId()
  var startTime = Date.now()

  return new Promise((resolve) => {
    wx.request({
      url: config.resourceDomain + endpoints.auth.validate,
      method: 'GET',
      header: Object.assign(buildAuthHeader(token), {
        'X-Request-ID': requestId
      }),
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
  buildAuthHeader,
  clearSession,
  reLaunchToLogin,
  ensureSessionToken,
  logout,
  validateSessionToken
}
