function pickMessage(payload) {
  if (!payload) {
    return '服务暂不可用，请稍后再试'
  }

  return payload.message || payload.msg || payload.error || payload.errorMsg || '服务暂不可用，请稍后再试'
}

function normalizePayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return {
      success: false,
      message: '服务暂不可用，请稍后再试',
      data: null
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
    success: true,
    message: pickMessage(rawPayload),
    data: rawPayload,
    raw: rawPayload
  }
}

module.exports = {
  pickMessage,
  normalizePayload
}
