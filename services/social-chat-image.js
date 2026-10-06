const config = require('../config/index.js')
const auth = require('./auth.js')
const dataSource = require('./data-source.js')
const endpoints = require('./endpoints.js')

const CHAT_IMAGE_PATH = /^\/api\/social\/conversations\/\d+\/messages\/\d+\/image$/
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const cacheByKey = {}
const ownedFiles = {}
let cacheSessionEpoch = 0
let scopedSessionId = ''

function currentToken() {
  try {
    return auth.getSessionToken() || ''
  } catch (error) {
    return ''
  }
}

function bumpCacheEpoch() {
  cacheSessionEpoch += 1
  Object.keys(cacheByKey).forEach(function (key) {
    delete cacheByKey[key]
  })
  Object.keys(ownedFiles).forEach(releaseFile)
}

function releaseFile(filePath) {
  if (!ownedFiles[filePath]) return
  delete ownedFiles[filePath]
  try {
    wx.getFileSystemManager().unlink({ filePath: filePath, fail: function () {} })
  } catch (error) {
    // The path is never an original album file. Cleanup is best effort.
  }
}

function rememberFile(filePath, token) {
  ownedFiles[filePath] = token
  return filePath
}

function ensureCacheScope() {
  const sessionId = currentToken()
  if (sessionId !== scopedSessionId) {
    scopedSessionId = sessionId
    bumpCacheEpoch()
  }
  return cacheSessionEpoch
}

function clearCache() {
  scopedSessionId = ''
  bumpCacheEpoch()
}

function parseOriginParts(absoluteUrl) {
  const value = String(absoluteUrl || '').trim()
  const match = value.match(/^(https?):\/\/([^/?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i)
  if (!match) {
    return null
  }
  const scheme = match[1].toLowerCase()
  const authority = match[2]
  if (authority.indexOf('@') !== -1) {
    return null
  }
  let host = authority
  let port = ''
  if (authority.charAt(0) === '[') {
    const end = authority.indexOf(']')
    if (end < 0) {
      return null
    }
    host = authority.slice(0, end + 1)
    const rest = authority.slice(end + 1)
    if (rest) {
      if (rest.charAt(0) !== ':') {
        return null
      }
      port = rest.slice(1)
    }
  } else {
    const colon = authority.lastIndexOf(':')
    if (colon > -1) {
      host = authority.slice(0, colon)
      port = authority.slice(colon + 1)
    }
  }
  if (!host || /[^A-Za-z0-9.\[\]:_-]/.test(host)) {
    return null
  }
  if (port && !/^\d+$/.test(port)) {
    return null
  }
  return {
    scheme: scheme,
    host: host.toLowerCase(),
    effectivePort: port || (scheme === 'https' ? '443' : '80'),
    path: match[3] || '/',
    hasQueryOrFragment: !!match[4] || !!match[5]
  }
}

function resourceOrigin() {
  return parseOriginParts(String(config.resourceDomain || '').replace(/\/?$/, '/'))
}

function sameOrigin(left, right) {
  return (
    !!left &&
    !!right &&
    left.scheme === right.scheme &&
    left.host === right.host &&
    left.effectivePort === right.effectivePort
  )
}

function isChatImagePath(pathname) {
  return CHAT_IMAGE_PATH.test(String(pathname || ''))
}

function buildAbsoluteUrl(url) {
  const value = String(url || '').trim()
  if (!value) {
    return ''
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    if (!/^https?:\/\//i.test(value)) {
      return ''
    }
    return value
  }
  const domain = String(config.resourceDomain || '').replace(/\/?$/, '/')
  return domain + value.replace(/^\//, '')
}

function shouldAttachBearer(absoluteUrl) {
  const target = parseOriginParts(absoluteUrl)
  const origin = resourceOrigin()
  if (!target || !origin || !sameOrigin(target, origin)) {
    return false
  }
  return !target.hasQueryOrFragment && isChatImagePath(target.path)
}

function imageApiPath(conversationId, messageId) {
  if (!conversationId || !messageId) {
    return ''
  }
  const path = endpoints.social.messageImageContent(conversationId, messageId)
  return isChatImagePath(path) ? path : ''
}

function canUseLocalFile(filePath) {
  ensureCacheScope()
  const token = currentToken()
  return (
    !!token &&
    (ownedFiles[filePath] === token ||
      (dataSource.isMockMode() && /^\/image\/[\w.-]+$/.test(filePath || '')))
  )
}

function prepareImage(filePath, token) {
  const epoch = ensureCacheScope()
  return new Promise(function (resolve, reject) {
    function invalid(key) {
      reject(Object.assign(new Error(key), { imageError: key }))
    }
    function isCurrent() {
      return !!token && token === currentToken() && epoch === cacheSessionEpoch
    }
    if (!isCurrent()) {
      invalid('sessionChanged')
      return
    }
    wx.getImageInfo({
      src: filePath,
      success: function (info) {
        if (!isCurrent()) return invalid('sessionChanged')
        const type = String(info.type || '').toLowerCase()
        if (type !== 'jpg' && type !== 'jpeg' && type !== 'png') {
          invalid('imageTypeInvalid')
          return
        }
        const width = Number(info.width)
        const height = Number(info.height)
        if (
          !(width > 0 && height > 0) ||
          width > 4096 ||
          height > 4096 ||
          width * height > 16000000
        ) {
          invalid('imageTooLarge')
          return
        }
        const fs = wx.getFileSystemManager()
        fs.getFileInfo({
          filePath: filePath,
          success: function (file) {
            if (!isCurrent()) return invalid('sessionChanged')
            if (!(file.size > 0) || file.size > MAX_IMAGE_BYTES) {
              invalid('imageTooLarge')
              return
            }
            const root = wx.env && wx.env.USER_DATA_PATH
            if (!root) return invalid('imageReadFailed')
            const copyPath =
              root +
              '/gdei-chat-image-' +
              Date.now() +
              '-' +
              Math.random().toString(16).slice(2) +
              (type === 'png' ? '.png' : '.jpg')
            fs.copyFile({
              srcPath: filePath,
              destPath: copyPath,
              success: function () {
                rememberFile(copyPath, token)
                if (!isCurrent()) {
                  releaseFile(copyPath)
                  invalid('sessionChanged')
                  return
                }
                resolve(copyPath)
              },
              fail: function () {
                rememberFile(copyPath, token)
                releaseFile(copyPath)
                invalid('imageReadFailed')
              }
            })
          },
          fail: function () {
            invalid('imageReadFailed')
          }
        })
      },
      fail: function () {
        invalid('imageTypeInvalid')
      }
    })
  })
}

function resolveMessageImage(message) {
  const epoch = ensureCacheScope()
  const item = message || {}
  const token = currentToken()
  if (!token) return Promise.resolve('')

  if (item.localPath && (item.status === 'pending' || item.status === 'failed' || !item.id)) {
    return Promise.resolve(canUseLocalFile(item.localPath) ? item.localPath : '')
  }

  if (!item.id || !item.conversationId) {
    return Promise.resolve('')
  }

  const relativePath = imageApiPath(item.conversationId, item.id)
  const absoluteUrl = buildAbsoluteUrl(relativePath)
  if (!absoluteUrl || !shouldAttachBearer(absoluteUrl)) {
    return Promise.resolve('')
  }

  if (dataSource.isMockMode()) {
    // Mock responses expose a local demo asset for authenticated preview.
    return Promise.resolve(
      /^\/image\/[\w.-]+$/.test(item.mockAssetPath || '') ? item.mockAssetPath : '/image/logo.png'
    )
  }

  const cacheKey = String(epoch) + '|' + absoluteUrl
  if (cacheByKey[cacheKey]) {
    return Promise.resolve(cacheByKey[cacheKey])
  }

  return new Promise(function (resolvePath) {
    wx.downloadFile({
      url: absoluteUrl,
      header: {
        Authorization: 'Bearer ' + token
      },
      success: function (result) {
        const path = result && result.tempFilePath
        if (path) rememberFile(path, token)
        if (epoch !== cacheSessionEpoch || token !== currentToken()) {
          ensureCacheScope()
          if (path) releaseFile(path)
          resolvePath('')
          return
        }
        if (result && result.statusCode === 200 && path) {
          cacheByKey[cacheKey] = path
          resolvePath(path)
          return
        }
        if (path) releaseFile(path)
        resolvePath('')
      },
      fail: function () {
        resolvePath('')
      }
    })
  })
}

function attachDisplayPaths(messages) {
  const list = Array.isArray(messages) ? messages : []
  return Promise.all(
    list.map(function (item) {
      if (!item || String(item.type || 'TEXT').toUpperCase() !== 'IMAGE') {
        return Promise.resolve(item)
      }
      return resolveMessageImage(item).then(function (displayPath) {
        return Object.assign({}, item, { displayPath: displayPath })
      })
    })
  )
}

module.exports = {
  clearCache: clearCache,
  syncSession: ensureCacheScope,
  prepareImage: prepareImage,
  canUseLocalFile: canUseLocalFile,
  releaseFile: releaseFile,
  resolveMessageImage: resolveMessageImage,
  attachDisplayPaths: attachDisplayPaths,
  shouldAttachBearer: shouldAttachBearer,
  isChatImagePath: isChatImagePath,
  imageApiPath: imageApiPath,
  buildAbsoluteUrl: buildAbsoluteUrl
}
