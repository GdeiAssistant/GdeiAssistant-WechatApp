const config = require('../config/index.js')
const auth = require('./auth.js')
const dataSource = require('./data-source.js')
const mock = require('../mock/index.js')
const { normalizePayload, pickMessage } = require('./response.js')
const { generateRequestId } = require('./request-id.js')
const i18n = require('../utils/i18n.js')

const DEVICE_ID_STORAGE_KEY = '__gdei_device_id'

function getDeviceId() {
  try {
    const info = wx.getDeviceInfo()
    if (info && info.deviceId) {
      return info.deviceId
    }
  } catch (_) {
    // getDeviceInfo not available in older base libraries
  }
  let id = wx.getStorageSync(DEVICE_ID_STORAGE_KEY)
  if (!id) {
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
    wx.setStorageSync(DEVICE_ID_STORAGE_KEY, id)
  }
  return id
}

function request(options) {
  const {
    url,
    method = 'GET',
    data = {},
    authRequired = false,
    contentType = 'application/json',
    showLoading = false,
    loadingTitle = i18n.t('common.loading')
  } = options

  const execute = (sessionToken) =>
    new Promise((resolve, reject) => {
      const header = {}
      if (contentType) {
        header['Content-Type'] = contentType
      }
      if (sessionToken) {
        header.Authorization = `Bearer ${sessionToken}`
      }
      const app = getApp()
      header['Accept-Language'] = i18n.normalizeLocale(
        (app && app.globalData && app.globalData.locale) || 'zh-CN'
      )
      header['X-Device-ID'] = getDeviceId()
      header['X-Request-ID'] = options.requestId || generateRequestId()

      if (showLoading) {
        wx.showNavigationBarLoading()
        wx.showLoading({ title: loadingTitle, mask: true })
      }

      const finishLoading = function () {
        if (showLoading) {
          wx.hideNavigationBarLoading()
          wx.hideLoading()
        }
      }

      const resolvePayload = function (payload) {
        resolve(normalizePayload(payload))
      }

      const rejectPayload = function (error) {
        if (error && error.statusCode === 401) {
          auth.clearSession()
          auth.reLaunchToLogin(i18n.t('auth.loginExpiredTitle'), i18n.t('auth.loginExpiredMessage'))
          reject(new Error(i18n.t('auth.loginExpiredMessage')))
          return
        }

        reject(
          new Error(error && error.message ? error.message : i18n.t('common.serviceUnavailable'))
        )
      }

      const requestId = header['X-Request-ID']
      const startTime = Date.now()

      if (dataSource.isMockMode()) {
        mock
          .handleRequest({
            url,
            path: url,
            method,
            data,
            header,
            sessionToken
          })
          .then(resolvePayload)
          .catch(rejectPayload)
          .finally(finishLoading)
        return
      }

      wx.request({
        url: /^https?:\/\//.test(url) ? url : config.resourceDomain + url,
        method,
        header,
        timeout: config.requestTimeout,
        data,
        success: function (res) {
          var elapsed = Date.now() - startTime
          console.debug(
            'rid:' +
              requestId +
              ' | ' +
              method +
              ' ' +
              url +
              ' | ' +
              res.statusCode +
              ' | ' +
              elapsed +
              'ms'
          )

          if (res.statusCode === 200) {
            resolvePayload(res.data)
          } else if (res.statusCode === 401) {
            auth.clearSession()
            auth.reLaunchToLogin(
              i18n.t('auth.loginExpiredTitle'),
              i18n.t('auth.loginExpiredMessage')
            )
            reject(new Error(i18n.t('auth.loginExpiredMessage')))
          } else {
            reject(new Error(pickMessage(res.data)))
          }
        },
        fail: function () {
          var elapsed = Date.now() - startTime
          console.debug(
            'rid:' + requestId + ' | ' + method + ' ' + url + ' | FAILED | ' + elapsed + 'ms'
          )
          reject(new Error(i18n.t('common.networkTimeout')))
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
  request,
  generateRequestId
}
