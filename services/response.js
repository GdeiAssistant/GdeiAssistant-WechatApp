const i18n = require('../utils/i18n.js')

function getServiceUnavailableMessage() {
  return i18n.t('common.serviceUnavailable')
}

function pickMessage(payload) {
  if (!payload) {
    return getServiceUnavailableMessage()
  }

  return payload.message || payload.msg || payload.error || payload.errorMsg || getServiceUnavailableMessage()
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
    return {
      success: successCode,
      message: pickMessage(rawPayload),
      data: rawPayload.data || null,
      raw: rawPayload
    }
  }

  if (typeof rawPayload.status !== 'undefined') {
    const successStatus = Number(rawPayload.status) === 200 || Number(rawPayload.status) === 0
    return {
      success: successStatus,
      message: pickMessage(rawPayload),
      data: rawPayload.data || null,
      raw: rawPayload
    }
  }

  return {
    success: false,
    message: pickMessage(rawPayload),
    data: null,
    raw: rawPayload
  }
}

module.exports = {
  pickMessage,
  normalizePayload
}
