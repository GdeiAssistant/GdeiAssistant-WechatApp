const path = require('node:path')
const fs = require('node:fs')
const test = require('node:test')
const assert = require('node:assert/strict')

const {
  parseOriginParts,
  resourceOrigin,
  sameOrigin,
  buildAbsoluteUrl
} = require('../services/url-origin.js')

const ROOT = path.resolve(__dirname, '..')

test('parseOriginParts exposes scheme, host, effective port, path and query flags', function () {
  assert.deepEqual(parseOriginParts('https://API.example.com/x/y'), {
    scheme: 'https',
    host: 'api.example.com',
    effectivePort: '443',
    path: '/x/y',
    hasQueryOrFragment: false
  })

  assert.equal(parseOriginParts('http://api.example.com:8080/x').effectivePort, '8080')
  assert.equal(parseOriginParts('https://api.example.com/x?a=1').hasQueryOrFragment, true)
  assert.equal(parseOriginParts('https://api.example.com/x#top').hasQueryOrFragment, true)
  assert.equal(parseOriginParts('https://api.example.com:443/x').effectivePort, '443')
})

test('parseOriginParts rejects URLs that must never receive a Bearer token', function () {
  assert.equal(parseOriginParts('https://user:pass@api.example.com/x'), null)
  assert.equal(parseOriginParts('ftp://api.example.com/x'), null)
  assert.equal(parseOriginParts('https://api.example.com:notaport/x'), null)
  assert.equal(parseOriginParts('https://bad host.example.com/x'), null)
  assert.equal(parseOriginParts('https://[::1/x'), null)
  assert.equal(parseOriginParts('not-a-url'), null)
})

test('parseOriginParts understands IPv6 authorities', function () {
  const parsed = parseOriginParts('https://[::1]:8443/x')
  assert.equal(parsed.host, '[::1]')
  assert.equal(parsed.effectivePort, '8443')
  assert.equal(parseOriginParts('https://[::1]/x').effectivePort, '443')
})

test('sameOrigin compares scheme, host and effective port', function () {
  const origin = resourceOrigin('https://api.example.com')
  assert.equal(sameOrigin(parseOriginParts('https://api.example.com:443/x'), origin), true)
  assert.equal(sameOrigin(parseOriginParts('https://api.example.com:8443/x'), origin), false)
  assert.equal(sameOrigin(parseOriginParts('http://api.example.com/x'), origin), false)
  assert.equal(sameOrigin(parseOriginParts('https://cdn.example.net/x'), origin), false)
  assert.equal(sameOrigin(null, origin), false)
})

test('buildAbsoluteUrl resolves relative paths and rejects non-http schemes', function () {
  assert.equal(
    buildAbsoluteUrl('/api/x', 'https://api.example.com'),
    'https://api.example.com/api/x'
  )
  assert.equal(
    buildAbsoluteUrl('api/x', 'https://api.example.com/'),
    'https://api.example.com/api/x'
  )
  assert.equal(
    buildAbsoluteUrl('https://cdn.example.net/x', 'https://api.example.com'),
    'https://cdn.example.net/x'
  )
  assert.equal(buildAbsoluteUrl('javascript:alert(1)', 'https://api.example.com'), '')
  assert.equal(buildAbsoluteUrl('', 'https://api.example.com'), '')
})

test('URL origin parsing lives in exactly one production module', function () {
  const servicesDir = path.join(ROOT, 'services')
  const owner = path.join(servicesDir, 'url-origin.js')
  const offenders = []

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.name.endsWith('.js') && full !== owner) {
        const source = fs.readFileSync(full, 'utf8')
        // The two image services keep a one-line buildAbsoluteUrl wrapper for their
        // public API, but it has to delegate to the shared implementation.
        const copiedParser = /^function (parseOriginParts|resourceOrigin|sameOrigin)\(/m.test(
          source
        )
        const independentBuilder =
          /^function buildAbsoluteUrl\(/m.test(source) &&
          !source.includes('urlOrigin.buildAbsoluteUrl(')
        if (copiedParser || independentBuilder) {
          offenders.push(path.relative(ROOT, full))
        }
      }
    }
  }

  walk(servicesDir)
  assert.deepEqual(offenders, [], 'URL parsing must not be copied into another service')
})
