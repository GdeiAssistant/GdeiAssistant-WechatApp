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

  const statusField =
    typeof rawPayload.code !== 'undefined'
      ? 'code'
      : typeof rawPayload.status !== 'undefined'
        ? 'status'
        : ''
  const success = statusField
    ? Number(rawPayload[statusField]) === 200 || Number(rawPayload[statusField]) === 0
    : false
  const normalized = {
    success: success,
    message: pickMessage(rawPayload),
    data: Object.prototype.hasOwnProperty.call(rawPayload, 'data') ? rawPayload.data : null,
    raw: rawPayload
  }
  if (rawPayload.errorCode) {
    normalized.errorCode = rawPayload.errorCode
  }
  return normalized
}

module.exports = {
  pickMessage,
  normalizePayload
}
