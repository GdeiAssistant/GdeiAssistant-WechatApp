var storageKeys = require('../constants/storage.js')
var data = require('./mock-data.js')
var communityMock = require('./community.js')
var authHandlers = require('./auth-handlers.js')
var profileHandlers = require('./profile-handlers.js')
var campusHandlers = require('./campus-handlers.js')
var infoHandlers = require('./info-handlers.js')
var messageHandlers = require('./message-handlers.js')

// ---------------------------------------------------------------------------
// Shared utilities — passed to handler modules via the `utils` object
// ---------------------------------------------------------------------------

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value))
}

function readState() {
  var defaultState = {
    token: '',
    savedCetNumber: '',
    savedCetName: '',
    cardLostState: '正常',
    renewedBookCodes: [],
    profile: cloneValue(data.BASE_PROFILE),
    interactionMessages: cloneValue(data.INTERACTION_MESSAGES)
  }

  try {
    var state = wx.getStorageSync(storageKeys.mockState)
    if (state && typeof state === 'object') {
      return {
        token: state.token || '',
        savedCetNumber: state.savedCetNumber || '',
        savedCetName: state.savedCetName || '',
        cardLostState: state.cardLostState || '正常',
        renewedBookCodes: Array.isArray(state.renewedBookCodes) ? state.renewedBookCodes : [],
        profile: Object.assign({}, cloneValue(data.BASE_PROFILE), state.profile || {}),
        interactionMessages: Array.isArray(state.interactionMessages) ? state.interactionMessages : cloneValue(data.INTERACTION_MESSAGES)
      }
    }
  } catch (error) {
    // Ignore mock storage read failures.
  }

  return defaultState
}

function writeState(nextState) {
  try {
    wx.setStorageSync(storageKeys.mockState, nextState)
  } catch (error) {
    // Ignore mock storage write failures.
  }
}

function buildSuccess(payload, message) {
  return {
    success: true,
    code: 200,
    message: message || 'success',
    data: payload === undefined ? null : payload
  }
}

function rejectWithMessage(message, options) {
  var error = new Error(message)
  error.message = message
  error.statusCode = options && options.statusCode ? options.statusCode : 400
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      reject(error)
    }, 180)
  })
}

function resolveWithDelay(payload) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(cloneValue(payload))
    }, 180)
  })
}

function isSessionTokenValid(token) {
  var state = readState()
  return !!token && token === state.token
}

function ensureAuthorized(token) {
  if (!isSessionTokenValid(token)) {
    return rejectWithMessage('登录凭证已过期，请重新登录', { statusCode: 401 })
  }
  return null
}

var utils = {
  cloneValue: cloneValue,
  readState: readState,
  writeState: writeState,
  buildSuccess: buildSuccess,
  rejectWithMessage: rejectWithMessage,
  resolveWithDelay: resolveWithDelay,
  ensureAuthorized: ensureAuthorized
}

// ---------------------------------------------------------------------------
// URL parsing
// ---------------------------------------------------------------------------

function parseQueryString(queryString) {
  if (!queryString) {
    return {}
  }

  return queryString.split('&').reduce(function(result, item) {
    if (!item) {
      return result
    }

    var segments = item.split('=')
    var key = decodeURIComponent(segments[0] || '')
    var value = decodeURIComponent(segments.slice(1).join('=') || '')
    if (result[key] === undefined) {
      result[key] = value
    } else if (Array.isArray(result[key])) {
      result[key].push(value)
    } else {
      result[key] = [result[key], value]
    }
    return result
  }, {})
}

function parseRequestParts(rawUrl, requestData) {
  var normalizedUrl = (rawUrl || '').replace(/^https?:\/\/[^/]+/, '')
  var urlParts = normalizedUrl.split('?')
  var parsedBody = typeof requestData === 'string'
    ? parseQueryString(requestData)
    : requestData
  return {
    path: urlParts[0],
    query: Object.assign({}, parseQueryString(urlParts[1]), parsedBody || {})
  }
}

// ---------------------------------------------------------------------------
// Request router
// ---------------------------------------------------------------------------

function handleRequest(options) {
  var requestOptions = options || {}
  var method = String(requestOptions.method || 'GET').toUpperCase()
  var requestParts = parseRequestParts(requestOptions.path || requestOptions.url || '', requestOptions.data)
  var path = requestParts.path
  var payload = requestOptions.data || {}
  var query = requestParts.query
  var token = requestOptions.sessionToken || requestOptions.token || ''

  // --- Auth ---
  if (path === '/api/auth/login' && method === 'POST') {
    return authHandlers.handleLogin(payload, utils)
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    return resolveWithDelay(buildSuccess(null))
  }

  if (path === '/api/upload/presignedUrl' && method === 'GET') {
    return authHandlers.handlePresignedUrl(query, utils)
  }

  if (path === '/api/wechat/app/userid' && method === 'POST') {
    return authHandlers.handleWechatOpenId(payload, utils)
  }

  // --- Profile ---
  if (path === '/api/profile/avatar' && method === 'GET') {
    return profileHandlers.handleAvatar(token, utils)
  }

  if (path === '/api/profile/avatar' && method === 'POST') {
    return profileHandlers.handleAvatarUpdate(token, payload, utils)
  }

  if (path === '/api/profile/avatar' && method === 'DELETE') {
    return profileHandlers.handleAvatarDelete(token, utils)
  }

  if (path === '/api/user/profile' && method === 'GET') {
    return profileHandlers.handleProfile(token, utils)
  }

  if (path === '/api/locationList' && method === 'GET') {
    return profileHandlers.handleLocationList(token, utils)
  }

  if (path === '/api/profile/nickname' && method === 'POST') {
    return profileHandlers.handleNicknameUpdate(token, payload, utils)
  }

  if (path === '/api/introduction' && method === 'POST') {
    return profileHandlers.handleIntroductionUpdate(token, payload, utils)
  }

  if (path === '/api/profile/birthday' && method === 'POST') {
    return profileHandlers.handleBirthdayUpdate(token, payload, utils)
  }

  if (path === '/api/profile/faculty' && method === 'POST') {
    return profileHandlers.handleFacultyUpdate(token, payload, utils)
  }

  if (path === '/api/profile/major' && method === 'POST') {
    return profileHandlers.handleMajorUpdate(token, payload, utils)
  }

  if (path === '/api/profile/enrollment' && method === 'POST') {
    return profileHandlers.handleEnrollmentUpdate(token, payload, utils)
  }

  if (path === '/api/profile/location' && method === 'POST') {
    return profileHandlers.handleLocationUpdate(token, payload, 'location', utils)
  }

  if (path === '/api/profile/hometown' && method === 'POST') {
    return profileHandlers.handleLocationUpdate(token, payload, 'hometown', utils)
  }

  // --- Campus / Academic ---
  if (path === '/api/grade' && method === 'GET') {
    return campusHandlers.handleGrade(token, query, utils)
  }

  if (path === '/api/schedule' && method === 'GET') {
    return campusHandlers.handleSchedule(token, query, utils)
  }

  if (path === '/api/card/info' && method === 'GET') {
    return campusHandlers.handleCardInfo(token, utils)
  }

  if (path === '/api/card/query' && method === 'POST') {
    return campusHandlers.handleCardQuery(token, utils)
  }

  if (path === '/api/evaluate/submit' && method === 'POST') {
    return campusHandlers.handleEvaluateSubmit(token, utils)
  }

  if (path === '/api/card/lost' && method === 'POST') {
    return campusHandlers.handleCardLost(token, query, utils)
  }

  if (path === '/api/collection/search' && method === 'GET') {
    return campusHandlers.handleCollectionSearch(query, utils)
  }

  if (path === '/api/collection/detail' && method === 'GET') {
    return campusHandlers.handleCollectionDetail(query, utils)
  }

  if (path === '/api/book/borrow' && method === 'GET') {
    return campusHandlers.handleBookBorrow(token, query, utils)
  }

  if (path === '/api/book/renew' && method === 'POST') {
    return campusHandlers.handleBookRenew(token, payload, utils)
  }

  if (path === '/api/collection/borrow' && method === 'GET') {
    return campusHandlers.handleCollectionBorrow(token, query, utils)
  }

  if (path === '/api/collection/renew' && method === 'POST') {
    return campusHandlers.handleCollectionRenew(token, query, utils)
  }

  if (path === '/api/cet/number' && method === 'GET') {
    return campusHandlers.handleCetNumberGet(token, utils)
  }

  if (path === '/api/cet/number' && method === 'POST') {
    return campusHandlers.handleCetNumberSave(token, payload, utils)
  }

  if (path === '/api/cet/checkcode' && method === 'GET') {
    return resolveWithDelay(buildSuccess('data:image/png;base64,iVBOR...mockCaptcha'))
  }

  if (path === '/api/cet/query' && method === 'GET') {
    return campusHandlers.handleCetQuery(token, query, utils)
  }

  if (path === '/api/spare/query' && method === 'POST') {
    return campusHandlers.handleSpareRoom(token, utils)
  }

  // --- Info / Data ---
  if (path === '/api/kaoyan/query' && method === 'POST') {
    return infoHandlers.handleGraduateExam(payload, utils)
  }

  if (/^\/api\/news\/type\/\d+\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    return infoHandlers.handleNews(path, utils)
  }

  if (path === '/api/reading' && method === 'GET') {
    return infoHandlers.handleReading(utils)
  }

  if (path === '/api/data/electricfees' && method === 'POST') {
    return infoHandlers.handleElectricFees(payload, utils)
  }

  if (path === '/api/data/yellowpage' && method === 'GET') {
    return infoHandlers.handleYellowPage(utils)
  }

  if (path === '/api/module/state/detail' && method === 'GET') {
    return infoHandlers.handleModuleStateDetail(utils)
  }

  // --- Messages ---
  if (/^\/api\/announcement\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    return messageHandlers.handleAnnouncementList(token, path, utils)
  }

  if (/^\/api\/message\/interaction\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    return messageHandlers.handleInteractionList(token, path, utils)
  }

  if (path === '/api/message/unread' && method === 'GET') {
    return messageHandlers.handleUnreadCount(token, utils)
  }

  if (/^\/api\/message\/id\/.+\/read$/.test(path) && method === 'POST') {
    return messageHandlers.handleMessageRead(token, path, utils)
  }

  if (path === '/api/message/readall' && method === 'POST') {
    return messageHandlers.handleMessageReadAll(token, utils)
  }

  // --- Community (delegated to community.js) ---
  var communityResponse = communityMock.handleRequest({
    path: path,
    method: method,
    payload: payload,
    query: query,
    token: token,
    utils: utils
  })
  if (communityResponse) {
    return communityResponse
  }

  return rejectWithMessage('该模拟接口暂未实现')
}

module.exports = {
  handleRequest: handleRequest,
  isSessionTokenValid: isSessionTokenValid,
  handleLogout: function(token) {
    return authHandlers.handleLogout(token, utils)
  }
}
