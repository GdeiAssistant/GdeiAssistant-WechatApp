const config = require('../config/index.js')
const auth = require('./auth.js')
const dataSource = require('./data-source.js')
const { PLACEHOLDER_AVATAR } = require('../utils/social.js')

const AUTH_AVATAR_PATH =
  /^\/api\/social\/users\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/avatar$/

const cacheByKey = {}
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
}

function ensureCacheScope() {
  // Compare session identity for epoch rotation only; never put the raw token in cache keys.
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

function isPlaceholderOrLocal(url) {
  const value = String(url || '')
  if (!value) {
    return true
  }
  if (value === PLACEHOLDER_AVATAR || value.indexOf('/image/') === 0) {
    return true
  }
  if (value.indexOf('wxfile://') === 0 || value.indexOf('http://tmp/') === 0) {
    return true
  }
  return false
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
    // Reject URLs with username/password userinfo.
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
  const effectivePort = port || (scheme === 'https' ? '443' : '80')
  const path = match[3] || '/'
  return {
    scheme: scheme,
    host: host.toLowerCase(),
    effectivePort: effectivePort,
    path: path
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

function isAuthAvatarPath(pathname) {
  return AUTH_AVATAR_PATH.test(String(pathname || ''))
}

function isAuthAvatarUrl(url) {
  const value = String(url || '').trim()
  if (!value) {
    return false
  }
  if (value.indexOf('://') === -1) {
    const path = value.charAt(0) === '/' ? value.split('?')[0] : '/' + value.split('?')[0]
    return isAuthAvatarPath(path)
  }
  const parsed = parseOriginParts(value)
  return !!(parsed && isAuthAvatarPath(parsed.path))
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
  if (!target || !origin) {
    return false
  }
  if (!sameOrigin(target, origin)) {
    return false
  }
  return isAuthAvatarPath(target.path)
}

function resolve(avatarUrl) {
  const epoch = ensureCacheScope()

  if (avatarUrl == null || avatarUrl === '') {
    return Promise.resolve(PLACEHOLDER_AVATAR)
  }

  const raw = String(avatarUrl).trim()
  if (!raw) {
    return Promise.resolve(PLACEHOLDER_AVATAR)
  }

  if (isPlaceholderOrLocal(raw) && !isAuthAvatarUrl(raw)) {
    return Promise.resolve(raw || PLACEHOLDER_AVATAR)
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw)) {
    return Promise.resolve(PLACEHOLDER_AVATAR)
  }

  const absoluteUrl = buildAbsoluteUrl(raw)
  const parsed = parseOriginParts(absoluteUrl)
  if (!parsed) {
    return Promise.resolve(PLACEHOLDER_AVATAR)
  }

  const withBearer = shouldAttachBearer(absoluteUrl)
  if (withBearer) {
    const token = currentToken()
    if (!token) {
      return Promise.resolve(PLACEHOLDER_AVATAR)
    }
    if (dataSource.isMockMode()) {
      return Promise.resolve(PLACEHOLDER_AVATAR)
    }
  }

  const cacheKey = String(epoch) + '|' + absoluteUrl
  if (cacheByKey[cacheKey]) {
    return Promise.resolve(cacheByKey[cacheKey])
  }

  return new Promise(function (resolvePath) {
    const header = {}
    if (withBearer) {
      header.Authorization = 'Bearer ' + currentToken()
    }
    wx.downloadFile({
      url: absoluteUrl,
      header: header,
      success: function (result) {
        if (epoch !== cacheSessionEpoch) {
          resolvePath(PLACEHOLDER_AVATAR)
          return
        }
        if (result && result.statusCode === 200 && result.tempFilePath) {
          cacheByKey[cacheKey] = result.tempFilePath
          resolvePath(result.tempFilePath)
          return
        }
        resolvePath(PLACEHOLDER_AVATAR)
      },
      fail: function () {
        if (epoch !== cacheSessionEpoch) {
          resolvePath(PLACEHOLDER_AVATAR)
          return
        }
        resolvePath(PLACEHOLDER_AVATAR)
      }
    })
  })
}

function attachDisplayAvatar(user) {
  const target = user || {}
  return resolve(target.avatarUrl).then(function (displayAvatar) {
    return Object.assign({}, target, { displayAvatar: displayAvatar })
  })
}

function attachDisplayAvatars(users) {
  const list = Array.isArray(users) ? users : []
  return Promise.all(list.map(attachDisplayAvatar))
}

module.exports = {
  PLACEHOLDER_AVATAR: PLACEHOLDER_AVATAR,
  clearCache: clearCache,
  resolve: resolve,
  attachDisplayAvatar: attachDisplayAvatar,
  attachDisplayAvatars: attachDisplayAvatars,
  isAuthAvatarUrl: isAuthAvatarUrl,
  buildAbsoluteUrl: buildAbsoluteUrl,
  shouldAttachBearer: shouldAttachBearer,
  parseOriginParts: parseOriginParts
}
