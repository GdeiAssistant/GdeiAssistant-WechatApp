const path = require('node:path')
const fs = require('node:fs')
const test = require('node:test')
const assert = require('node:assert/strict')

const { stubModule, freshRequire } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const REQUEST_MODULE = path.join(ROOT, 'services/request.js')
const REQUEST_FORM_MODULE = path.join(ROOT, 'services/request-form.js')

const PRODUCTION_DIRS = [
  'services',
  'utils',
  'pages',
  'mock',
  'constants',
  'config',
  'custom-tab-bar',
  'scripts'
]

function productionFiles() {
  const found = []
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.name.endsWith('.js')) {
        found.push(full)
      }
    }
  }
  for (const dir of PRODUCTION_DIRS) {
    walk(path.join(ROOT, dir))
  }
  found.push(path.join(ROOT, 'app.js'))
  return found
}

test('the urlencoded content type is owned by request-form.js alone', function () {
  const owner = path.join(ROOT, 'services/request-form.js')
  const offenders = productionFiles()
    .filter(function (file) {
      return (
        file !== owner &&
        fs.readFileSync(file, 'utf8').includes('application/x-www-form-urlencoded')
      )
    })
    .map(function (file) {
      return path.relative(ROOT, file)
    })

  assert.deepEqual(offenders, [], 'form posts must go through requestForm / postForm')
})

test('no service redefines requestForm locally', function () {
  const owner = path.join(ROOT, 'services/request-form.js')
  const offenders = productionFiles()
    .filter(function (file) {
      return file !== owner && /^function requestForm\(/m.test(fs.readFileSync(file, 'utf8'))
    })
    .map(function (file) {
      return path.relative(ROOT, file)
    })

  assert.deepEqual(offenders, [])
})

test('requestForm adds the content type and postForm encodes the payload', function () {
  const calls = []
  stubModule(REQUEST_MODULE, {
    request: function (options) {
      calls.push(options)
      return Promise.resolve(options)
    }
  })
  const { FORM_CONTENT_TYPE, requestForm, postForm } = freshRequire(REQUEST_FORM_MODULE)

  requestForm({ url: '/api/x', method: 'POST', data: 'a=1' })
  assert.equal(calls[0].contentType, FORM_CONTENT_TYPE)
  assert.equal(calls[0].data, 'a=1')
  assert.equal(calls[0].url, '/api/x')

  postForm('/api/community/publish', { title: 'a b', price: 0, empty: '' })
  assert.equal(calls[1].url, '/api/community/publish')
  assert.equal(calls[1].method, 'POST')
  assert.equal(calls[1].authRequired, true)
  assert.equal(calls[1].contentType, FORM_CONTENT_TYPE)
  assert.equal(calls[1].data, 'title=a%20b&price=0')
})
