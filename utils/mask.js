function toText(value) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}

function repeatMask(length) {
  return '*'.repeat(Math.max(2, Number(length) || 0))
}

function maskWithEdges(value, prefixLength, suffixLength) {
  var raw = toText(value)
  if (!raw) {
    return ''
  }

  if (raw.length <= Math.max(prefixLength, suffixLength) + 1) {
    return raw.charAt(0) + repeatMask(3)
  }

  return raw.slice(0, prefixLength) + '***' + raw.slice(raw.length - suffixLength)
}

function maskPhone(value) {
  var raw = toText(value).replace(/\s+/g, '')
  if (!raw) {
    return ''
  }

  if (/^\d{11}$/.test(raw)) {
    return raw.slice(0, 3) + '****' + raw.slice(-4)
  }

  var digitsOnly = raw.replace(/\D/g, '')
  if (digitsOnly.length >= 7) {
    return maskWithEdges(raw, raw.charAt(0) === '+' ? 2 : 2, 2)
  }

  if (raw.length <= 4) {
    return raw.charAt(0) + repeatMask(3)
  }

  return maskWithEdges(raw, 1, 1)
}

function maskEmail(value) {
  var raw = toText(value)
  if (!raw) {
    return ''
  }

  var atIndex = raw.indexOf('@')
  if (atIndex <= 0 || atIndex === raw.length - 1) {
    return maskWithEdges(raw, 1, 1)
  }

  return raw.charAt(0) + '***' + raw.slice(atIndex)
}

function maskAccount(value) {
  var raw = toText(value)
  if (!raw) {
    return ''
  }

  if (raw.length <= 3) {
    return raw.charAt(0) + repeatMask(3)
  }

  if (raw.length <= 7) {
    return maskWithEdges(raw, 1, 1)
  }

  return maskWithEdges(raw, 2, 2)
}

function maskToken(value) {
  var raw = toText(value)
  if (!raw) {
    return ''
  }

  if (raw.length <= 8) {
    return raw.charAt(0) + repeatMask(4)
  }

  return raw.slice(0, 4) + '***' + raw.slice(-3)
}

function maskContactId(value) {
  return maskAccount(value)
}

function maskAddress(value) {
  var raw = toText(value).replace(/\s+/g, ' ')
  if (!raw) {
    return ''
  }

  var segments = raw.split(' ').filter(Boolean)
  if (segments.length > 1) {
    return segments[0] + '***'
  }

  if (raw.length <= 4) {
    return raw.charAt(0) + repeatMask(3)
  }

  return raw.slice(0, Math.min(4, raw.length)) + '***'
}

function maskPickupCode(value) {
  var raw = toText(value)
  if (!raw) {
    return ''
  }

  if (raw.length <= 2) {
    return repeatMask(4)
  }

  return raw.charAt(0) + '***'
}

function maskGenericSensitiveText(type, value) {
  var normalizedType = toText(type).toLowerCase()

  if (!normalizedType) {
    return toText(value)
  }

  if (normalizedType.indexOf('phone') !== -1 || normalizedType.indexOf('mobile') !== -1) {
    return maskPhone(value)
  }
  if (normalizedType.indexOf('email') !== -1) {
    return maskEmail(value)
  }
  if (
    normalizedType.indexOf('token') !== -1 ||
    normalizedType.indexOf('session') !== -1 ||
    normalizedType.indexOf('cookie') !== -1
  ) {
    return maskToken(value)
  }
  if (normalizedType.indexOf('pickup') !== -1 || normalizedType.indexOf('code') !== -1) {
    return maskPickupCode(value)
  }
  if (normalizedType.indexOf('address') !== -1 || normalizedType.indexOf('location') !== -1) {
    return maskAddress(value)
  }
  if (
    normalizedType.indexOf('account') !== -1 ||
    normalizedType.indexOf('username') !== -1 ||
    normalizedType.indexOf('student') !== -1
  ) {
    return maskAccount(value)
  }
  if (
    normalizedType.indexOf('qq') !== -1 ||
    normalizedType.indexOf('wechat') !== -1 ||
    normalizedType.indexOf('contact') !== -1
  ) {
    return maskContactId(value)
  }

  return toText(value)
}

module.exports = {
  maskPhone: maskPhone,
  maskEmail: maskEmail,
  maskAccount: maskAccount,
  maskToken: maskToken,
  maskContactId: maskContactId,
  maskAddress: maskAddress,
  maskPickupCode: maskPickupCode,
  maskGenericSensitiveText: maskGenericSensitiveText
}
