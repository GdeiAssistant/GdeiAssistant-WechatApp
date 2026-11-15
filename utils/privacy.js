const pendingResolvers = []
const listeners = []
let initialized = false
let visible = false
let contractName = ''

function notifyListeners() {
  const snapshot = {
    visible: visible,
    contractName: contractName
  }
  listeners.slice().forEach(function (listener) {
    try {
      listener(snapshot)
    } catch (_) {
      // Ignore listener notification failures.
    }
  })
}

function flushResolvers(payload) {
  while (pendingResolvers.length) {
    const resolve = pendingResolvers.shift()
    try {
      resolve(payload)
    } catch (_) {
      // Ignore stale privacy resolver failures.
    }
  }
}

function initPrivacyListener() {
  if (initialized) {
    return
  }
  initialized = true
  if (typeof wx === 'undefined' || !wx || typeof wx.onNeedPrivacyAuthorization !== 'function') {
    return
  }

  wx.onNeedPrivacyAuthorization(function (resolve) {
    if (typeof resolve === 'function') {
      pendingResolvers.push(resolve)
    }
    if (typeof wx.getPrivacySetting === 'function') {
      wx.getPrivacySetting({
        success: function (res) {
          contractName = (res && res.privacyContractName) || ''
          visible = true
          notifyListeners()
        },
        fail: function () {
          visible = true
          notifyListeners()
        }
      })
      return
    }
    visible = true
    notifyListeners()
  })
}

function subscribe(listener) {
  if (typeof listener !== 'function') {
    return function () {}
  }
  if (listeners.indexOf(listener) === -1) {
    listeners.push(listener)
  }
  listener({ visible: visible, contractName: contractName })
  return function () {
    const index = listeners.indexOf(listener)
    if (index !== -1) {
      listeners.splice(index, 1)
    }
  }
}

function agreePrivacy(buttonId) {
  visible = false
  notifyListeners()
  flushResolvers({ buttonId: buttonId || 'agree-btn', event: 'agree' })
}

function disagreePrivacy() {
  visible = false
  notifyListeners()
  flushResolvers({ event: 'disagree' })
}

function openPrivacyContract() {
  if (typeof wx !== 'undefined' && wx && typeof wx.openPrivacyContract === 'function') {
    wx.openPrivacyContract({
      fail: function () {}
    })
  }
}

module.exports = {
  initPrivacyListener: initPrivacyListener,
  subscribe: subscribe,
  agreePrivacy: agreePrivacy,
  disagreePrivacy: disagreePrivacy,
  openPrivacyContract: openPrivacyContract
}
