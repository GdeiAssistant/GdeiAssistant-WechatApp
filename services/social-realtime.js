const config = require('../config/index.js')
const endpoints = require('./endpoints.js')
const auth = require('./auth.js')
const dataSource = require('./data-source.js')
const i18n = require('../utils/i18n.js')

const AUTH_TIMEOUT_MS = 5000
const BASE_RECONNECT_MS = 1500
const MAX_RECONNECT_MS = 30000
const PING_INTERVAL_MS = 25000

let connectionGeneration = 0
let activeSocket = null
let activeToken = ''
let ready = false
let intentionalClose = false
let reconnectAttempt = 0
let reconnectTimer = null
let authTimer = null
let pingTimer = null
let connecting = false
let mockReady = false
let mockGeneration = 0

const listeners = {
  ready: [],
  'message.created': [],
  'conversation.read': [],
  'social.changed': [],
  disconnected: [],
  error: []
}

function emit(type, payload) {
  const handlers = listeners[type] || []
  handlers.slice().forEach(function (handler) {
    try {
      handler(payload)
    } catch (error) {
      // Ignore listener failures.
    }
  })
}

function on(type, handler) {
  if (!listeners[type]) {
    listeners[type] = []
  }
  if (typeof handler === 'function' && listeners[type].indexOf(handler) === -1) {
    listeners[type].push(handler)
  }
  return function unsubscribe() {
    off(type, handler)
  }
}

function off(type, handler) {
  if (!listeners[type]) {
    return
  }
  listeners[type] = listeners[type].filter(function (item) {
    return item !== handler
  })
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function clearAuthTimer() {
  if (authTimer) {
    clearTimeout(authTimer)
    authTimer = null
  }
}

function clearPingTimer() {
  if (pingTimer) {
    clearTimeout(pingTimer)
    pingTimer = null
  }
}

function clearTimers() {
  clearReconnectTimer()
  clearAuthTimer()
  clearPingTimer()
}

function isCurrentSocket(socket, generation, token) {
  return (
    !!socket &&
    socket === activeSocket &&
    generation === connectionGeneration &&
    token === activeToken &&
    !intentionalClose
  )
}

function buildRealtimeUrl() {
  const domain = String(config.resourceDomain || '')
  const wsDomain = domain.replace(/^http/, 'ws')
  return wsDomain.replace(/\/?$/, '/') + endpoints.social.realtime.replace(/^\//, '')
}

function schedulePing(socket, generation, token) {
  clearPingTimer()
  pingTimer = setTimeout(function () {
    pingTimer = null
    if (!isCurrentSocket(socket, generation, token) || !ready) {
      return
    }
    try {
      socket.send({
        data: JSON.stringify({ type: 'ping' })
      })
    } catch (error) {
      // Ignore ping failures; reconnect path handles disconnect.
    }
    schedulePing(socket, generation, token)
  }, PING_INTERVAL_MS)
}

function handleAuthFailure() {
  intentionalClose = true
  clearTimers()
  ready = false
  connecting = false
  mockReady = false
  const socket = activeSocket
  activeSocket = null
  activeToken = ''
  connectionGeneration += 1
  detachSocket(socket)
  try {
    auth.clearSession()
    auth.reLaunchToLogin(i18n.t('auth.loginExpiredTitle'), i18n.t('auth.loginExpiredMessage'))
  } catch (error) {
    // Ignore auth cleanup failures in non-app environments.
  }
}

function handleServerMessage(raw, socket, generation, token) {
  if (!isCurrentSocket(socket, generation, token)) {
    return
  }

  let payload = null
  try {
    payload = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (error) {
    return
  }
  if (!payload || !payload.type) {
    return
  }

  if (payload.type === 'ready') {
    ready = true
    connecting = false
    reconnectAttempt = 0
    clearAuthTimer()
    schedulePing(socket, generation, token)
    emit('ready', payload)
    return
  }

  if (payload.type === 'auth.failed' || payload.type === 'unauthorized') {
    handleAuthFailure()
    return
  }

  if (!ready) {
    return
  }

  if (payload.type === 'pong') {
    return
  }

  if (
    payload.type === 'message.created' ||
    payload.type === 'conversation.read' ||
    payload.type === 'social.changed'
  ) {
    emit(payload.type, payload)
  }
}

function scheduleReconnect(expectedGeneration, expectedToken) {
  if (intentionalClose || dataSource.isMockMode()) {
    return
  }
  if (expectedGeneration !== connectionGeneration || expectedToken !== activeToken) {
    return
  }
  const token = auth.getSessionToken()
  if (!token || token !== expectedToken) {
    return
  }
  clearReconnectTimer()
  const delay = Math.min(MAX_RECONNECT_MS, BASE_RECONNECT_MS * Math.pow(2, reconnectAttempt))
  reconnectAttempt += 1
  reconnectTimer = setTimeout(function () {
    reconnectTimer = null
    if (intentionalClose) {
      return
    }
    if (expectedGeneration !== connectionGeneration || expectedToken !== activeToken) {
      return
    }
    if (auth.getSessionToken() !== expectedToken) {
      return
    }
    connect()
  }, delay)
}

function detachSocket(socket) {
  if (!socket) {
    return
  }
  try {
    socket.close({ code: 1000, reason: 'client_close' })
  } catch (error) {
    // Ignore close failures.
  }
}

function closeActiveSocket() {
  clearTimers()
  ready = false
  connecting = false
  const socket = activeSocket
  activeSocket = null
  detachSocket(socket)
}

function connectMock() {
  const token = auth.getSessionToken()
  if (!token) {
    return
  }
  if (mockReady && activeToken === token) {
    return
  }
  intentionalClose = false
  mockGeneration += 1
  connectionGeneration += 1
  const generation = connectionGeneration
  activeToken = token
  mockReady = true
  ready = true
  connecting = false
  reconnectAttempt = 0
  setTimeout(function () {
    if (intentionalClose || generation !== connectionGeneration || activeToken !== token) {
      return
    }
    emit('ready', { type: 'ready' })
  }, 0)
}

function connect() {
  if (dataSource.isMockMode()) {
    connectMock()
    return
  }

  const token = auth.getSessionToken()
  if (!token) {
    return
  }

  // Already ready on the same token.
  if (activeSocket && ready && activeToken === token) {
    return
  }

  // Auth/handshake already in progress for the same token.
  if (connecting && activeToken === token && activeSocket) {
    return
  }

  // Token changed: tear down previous connection before creating a new one.
  if (activeSocket || connecting || mockReady) {
    intentionalClose = true
    closeActiveSocket()
    mockReady = false
  }

  intentionalClose = false
  connecting = true
  ready = false
  clearTimers()
  connectionGeneration += 1
  const generation = connectionGeneration
  activeToken = token

  let socket = null
  try {
    socket = wx.connectSocket({
      url: buildRealtimeUrl(),
      protocols: []
    })
  } catch (error) {
    connecting = false
    activeSocket = null
    emit('error', error)
    scheduleReconnect(generation, token)
    return
  }

  activeSocket = socket

  socket.onOpen(function () {
    if (!isCurrentSocket(socket, generation, token)) {
      return
    }
    try {
      socket.send({
        data: JSON.stringify({ type: 'auth', token: token })
      })
    } catch (error) {
      emit('error', error)
      if (isCurrentSocket(socket, generation, token)) {
        closeActiveSocket()
        scheduleReconnect(generation, token)
      }
      return
    }
    clearAuthTimer()
    authTimer = setTimeout(function () {
      authTimer = null
      if (!isCurrentSocket(socket, generation, token)) {
        return
      }
      if (!ready) {
        // Unknown network / slow handshake: reconnect with backoff; do not logout.
        connecting = false
        ready = false
        emit('error', { type: 'auth_timeout' })
        try {
          socket.close({ code: 1000, reason: 'auth_timeout' })
        } catch (error) {
          activeSocket = null
          scheduleReconnect(generation, token)
        }
      }
    }, AUTH_TIMEOUT_MS)
  })

  socket.onMessage(function (message) {
    handleServerMessage(message && message.data, socket, generation, token)
  })

  socket.onError(function (error) {
    if (!isCurrentSocket(socket, generation, token)) {
      return
    }
    connecting = false
    emit('error', error)
  })

  socket.onClose(function (event) {
    if (socket !== activeSocket || generation !== connectionGeneration) {
      // Stale socket from a replaced generation; ignore.
      return
    }
    const closeCode = event && typeof event.code === 'number' ? event.code : 0
    const wasReady = ready
    const closedIntentionally = intentionalClose
    connecting = false
    ready = false
    activeSocket = null
    clearAuthTimer()
    clearPingTimer()
    if (closeCode === 1008) {
      // Protocol policy violation used for authenticated realtime rejection.
      handleAuthFailure()
      return
    }
    if (wasReady) {
      emit('disconnected', null)
    }
    if (!closedIntentionally) {
      scheduleReconnect(generation, token)
    }
  })
}

function disconnect() {
  intentionalClose = true
  mockReady = false
  ready = false
  connecting = false
  reconnectAttempt = 0
  connectionGeneration += 1
  activeToken = ''
  closeActiveSocket()
  emit('disconnected', null)
}

function ensureConnected() {
  if (dataSource.isMockMode()) {
    connectMock()
    return
  }
  const token = auth.getSessionToken()
  if (!token) {
    disconnect()
    return
  }
  if (activeToken && activeToken !== token) {
    connect()
    return
  }
  if (activeSocket && (ready || connecting) && activeToken === token) {
    return
  }
  connect()
}

function isReady() {
  return !!ready
}

function getActiveToken() {
  return activeToken
}

function getConnectionGeneration() {
  return connectionGeneration
}

function publishMockEvent(type, payload) {
  if (!dataSource.isMockMode() || !ready || intentionalClose) {
    return
  }
  emit(type, Object.assign({ type: type }, payload || {}))
}

module.exports = {
  on: on,
  off: off,
  connect: connect,
  disconnect: disconnect,
  ensureConnected: ensureConnected,
  isReady: isReady,
  getActiveToken: getActiveToken,
  getConnectionGeneration: getConnectionGeneration,
  publishMockEvent: publishMockEvent
}
