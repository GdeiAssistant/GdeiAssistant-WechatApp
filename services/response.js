const i18n = require('../utils/i18n.js')

function getServiceUnavailableMessage() {
  return i18n.t('common.serviceUnavailable')
}

function pickMessage(payload) {
  if (!payload) {
    return getServiceUnavailableMessage()
  }

  return (
    payload.message ||
    payload.msg ||
    payload.error ||
    payload.errorMsg ||
    getServiceUnavailableMessage()
  )
}

function normalizePayload(rawPayload) {
  if (!rawPayload) {
    return {
      success: false,
      message: getServiceUnavailableMessage(),
      data: null
    }
  }

  if (Array.isArray(rawPayload)) {
    return {
      success: true,
      message: '',
      data: rawPayload,
      raw: rawPayload
    }
  }

  if (typeof rawPayload !== 'object') {
    return {
      success: false,
      message: getServiceUnavailableMessage(),
      data: null,
      raw: rawPayload
    }
  }

  if (typeof rawPayload.success === 'boolean') {
    return rawPayload
  }

  if (typeof rawPayload.code !== 'undefined') {
    const successCode = Number(rawPayload.code) === 200 || Number(rawPayload.code) === 0
    const normalized = {
      success: successCode,
      message: pickMessage(rawPayload),
      data: Object.prototype.hasOwnProperty.call(rawPayload, 'data') ? rawPayload.data : null,
      raw: rawPayload
    }
    if (rawPayload.errorCode) {
      normalized.errorCode = rawPayload.errorCode
    }
    return normalized
  }

  if (typeof rawPayload.status !== 'undefined') {
    const successStatus = Number(rawPayload.status) === 200 || Number(rawPayload.status) === 0
    const normalized = {
      success: successStatus,
      message: pickMessage(rawPayload),
      data: Object.prototype.hasOwnProperty.call(rawPayload, 'data') ? rawPayload.data : null,
      raw: rawPayload
    }
    if (rawPayload.errorCode) {
      normalized.errorCode = rawPayload.errorCode
    }
    return normalized
  }

  const fallback = {
    success: false,
    message: pickMessage(rawPayload),
    data: null,
    raw: rawPayload
  }
  if (rawPayload.errorCode) {
    fallback.errorCode = rawPayload.errorCode
  }
  return fallback
}

module.exports = {
  pickMessage,
  normalizePayload
}
