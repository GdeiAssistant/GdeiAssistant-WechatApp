const config = require('../../config/index.js')
const endpoints = require('../endpoints.js')
const auth = require('../auth.js')
const dataSource = require('../data-source.js')
const mock = require('../../mock/index.js')
const { normalizePayload, pickMessage } = require('../response.js')
const { generateRequestId } = require('../request-id.js')
const { request } = require('../request.js')
const i18n = require('../../utils/i18n.js')
const socialChatImage = require('../social-chat-image.js')

function buildQuery(params) {
  const parts = []
  Object.keys(params || {}).forEach(function (key) {
    const value = params[key]
    if (value === undefined || value === null || value === '') {
      return
    }
    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)))
  })
  return parts.length ? '?' + parts.join('&') : ''
}

function getMe() {
  return request({
    url: endpoints.social.me,
    method: 'GET',
    authRequired: true
  })
}

function searchUsers(options) {
  const config = options || {}
  return request({
    url:
      endpoints.social.users +
      buildQuery({
        query: config.query,
        cursor: config.cursor,
        limit: config.limit
      }),
    method: 'GET',
    authRequired: true
  })
}

function getUser(id) {
  return request({
    url: endpoints.social.user(id),
    method: 'GET',
    authRequired: true
  })
}

function getRelationships(id, options) {
  const config = options || {}
  return request({
    url:
      endpoints.social.relationships(id) +
      buildQuery({
        kind: config.kind,
        cursor: config.cursor,
        limit: config.limit
      }),
    method: 'GET',
    authRequired: true
  })
}

function followUser(id) {
  return request({
    url: endpoints.social.follow(id),
    method: 'PUT',
    authRequired: true
  })
}

function unfollowUser(id) {
  return request({
    url: endpoints.social.follow(id),
    method: 'DELETE',
    authRequired: true
  })
}

function blockUser(id) {
  return request({
    url: endpoints.social.block(id),
    method: 'PUT',
    authRequired: true
  })
}

function unblockUser(id) {
  return request({
    url: endpoints.social.block(id),
    method: 'DELETE',
    authRequired: true
  })
}

function getBlocks(options) {
  const config = options || {}
  return request({
    url:
      endpoints.social.blocks +
      buildQuery({
        cursor: config.cursor,
        limit: config.limit
      }),
    method: 'GET',
    authRequired: true
  })
}

function getPrivacy() {
  return request({
    url: endpoints.social.privacy,
    method: 'GET',
    authRequired: true
  })
}

function updatePrivacy(dmPolicy) {
  return request({
    url: endpoints.social.privacy,
    method: 'PUT',
    authRequired: true,
    data: { dmPolicy: dmPolicy }
  })
}

function getUnread() {
  return request({
    url: endpoints.social.unread,
    method: 'GET',
    authRequired: true
  })
}

function createConversation(peerId) {
  return request({
    url: endpoints.social.conversations,
    method: 'POST',
    authRequired: true,
    data: { peerId: peerId }
  })
}

function getConversations(options) {
  const config = options || {}
  return request({
    url:
      endpoints.social.conversations +
      buildQuery({
        cursor: config.cursor,
        limit: config.limit
      }),
    method: 'GET',
    authRequired: true
  })
}

function getConversation(id) {
  return request({
    url: endpoints.social.conversation(id),
    method: 'GET',
    authRequired: true
  })
}

function getMessages(id, options) {
  const config = options || {}
  return request({
    url:
      endpoints.social.messages(id) +
      buildQuery({
        beforeSeq: config.beforeSeq,
        afterSeq: config.afterSeq,
        limit: config.limit
      }),
    method: 'GET',
    authRequired: true
  })
}

function sendMessage(id, clientMessageId, content) {
  return request({
    url: endpoints.social.messages(id),
    method: 'POST',
    authRequired: true,
    data: {
      clientMessageId: clientMessageId,
      content: content
    }
  })
}

function readMockImage(filePath) {
  return Promise.all([
    new Promise(function (resolve, reject) {
      wx.getFileInfo({
        filePath: filePath,
        digestAlgorithm: 'sha1',
        success: resolve,
        fail: reject
      })
    }),
    new Promise(function (resolve, reject) {
      wx.getImageInfo({ src: filePath, success: resolve, fail: reject })
    })
  ]).then(function (results) {
    const file = results[0]
    const info = results[1]
    return {
      path: filePath,
      fingerprint: 'sha1:' + String(file.digest || '').toLowerCase(),
      size: file.size,
      width: info.width,
      height: info.height,
      contentType:
        info.type === 'png'
          ? 'image/png'
          : info.type === 'jpg' || info.type === 'jpeg'
            ? 'image/jpeg'
            : ''
    }
  })
}

function sendImageMessage(id, clientMessageId, filePath) {
  const relativeUrl = endpoints.social.messageImage(id)
  const pathOnly = String(filePath || '').trim()
  if (!pathOnly) {
    return Promise.reject(
      Object.assign(new Error(i18n.t('social.errors.invalidRequest')), {
        errorCode: 'INVALID_REQUEST'
      })
    )
  }

  return auth.ensureSessionToken().then(function (token) {
    function requireCurrentSession() {
      if (token !== auth.getSessionToken()) {
        socialChatImage.syncSession()
        throw Object.assign(new Error(i18n.t('auth.loginExpiredMessage')), {
          errorCode: 'SESSION_CHANGED'
        })
      }
    }
    requireCurrentSession()
    if (dataSource.isMockMode()) {
      return readMockImage(pathOnly)
        .then(function (image) {
          requireCurrentSession()
          return mock.handleRequest({
            method: 'POST',
            path: relativeUrl,
            sessionToken: token,
            data: {
              clientMessageId: clientMessageId,
              image: image
            }
          })
        })
        .then(function (result) {
          requireCurrentSession()
          return normalizePayload(result)
        })
    }

    const app = typeof getApp === 'function' ? getApp() : null
    const header = {
      Authorization: 'Bearer ' + token,
      'Accept-Language': i18n.normalizeLocale(
        (app && app.globalData && app.globalData.locale) || 'zh-CN'
      ),
      'X-Request-ID': generateRequestId()
    }

    return new Promise(function (resolve, reject) {
      wx.uploadFile({
        url:
          String(config.resourceDomain || '').replace(/\/?$/, '/') + relativeUrl.replace(/^\//, ''),
        filePath: pathOnly,
        name: 'image',
        formData: {
          clientMessageId: clientMessageId
        },
        header: header,
        success: function (res) {
          try {
            requireCurrentSession()
          } catch (error) {
            reject(error)
            return
          }
          if (res.statusCode === 401) {
            auth.clearSession()
            auth.reLaunchToLogin(
              i18n.t('auth.loginExpiredTitle'),
              i18n.t('auth.loginExpiredMessage')
            )
            reject(new Error(i18n.t('auth.loginExpiredMessage')))
            return
          }

          let payload = null
          try {
            payload = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
          } catch (error) {
            reject(new Error(i18n.t('common.serviceUnavailable')))
            return
          }

          if (res.statusCode === 200) {
            resolve(normalizePayload(payload))
            return
          }

          const nextError = new Error(pickMessage(payload) || i18n.t('common.serviceUnavailable'))
          nextError.statusCode = res.statusCode
          if (payload && payload.errorCode) {
            nextError.errorCode = payload.errorCode
          }
          reject(nextError)
        },
        fail: function () {
          reject(new Error(i18n.t('common.networkTimeout')))
        }
      })
    })
  })
}

function markConversationRead(id, lastReadSeq) {
  return request({
    url: endpoints.social.read(id),
    method: 'PUT',
    authRequired: true,
    data: { lastReadSeq: String(lastReadSeq) }
  })
}

module.exports = {
  getMe,
  searchUsers,
  getUser,
  getRelationships,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  getBlocks,
  getPrivacy,
  updatePrivacy,
  getUnread,
  createConversation,
  getConversations,
  getConversation,
  getMessages,
  sendMessage,
  sendImageMessage,
  markConversationRead
}
