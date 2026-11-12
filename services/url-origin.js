// One parser for "is this URL safe to attach a Bearer token to".
// Both authenticated image services used to carry their own copy; the chat
// image copy had an extra query/fragment guard that the avatar copy lacked.
// Parsing is deliberately pure: callers pass resourceDomain in, so no module
// state can outlive a session change or a test stub.

const ORIGIN_PATTERN = /^(https?):\/\/([^/?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i

function parseOriginParts(absoluteUrl) {
  const value = String(absoluteUrl || '').trim()
  const match = value.match(ORIGIN_PATTERN)
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
  return {
    scheme: scheme,
    host: host.toLowerCase(),
    effectivePort: port || (scheme === 'https' ? '443' : '80'),
    path: match[3] || '/',
    hasQueryOrFragment: !!match[4] || !!match[5]
  }
}

function resourceOrigin(resourceDomain) {
  return parseOriginParts(String(resourceDomain || '').replace(/\/?$/, '/'))
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

function buildAbsoluteUrl(url, resourceDomain) {
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
  const domain = String(resourceDomain || '').replace(/\/?$/, '/')
  return domain + value.replace(/^\//, '')
}

module.exports = { parseOriginParts, resourceOrigin, sameOrigin, buildAbsoluteUrl }
