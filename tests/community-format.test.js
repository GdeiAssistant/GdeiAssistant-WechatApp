const path = require('node:path')
const fs = require('node:fs')
const test = require('node:test')
const assert = require('node:assert/strict')

const {
  trimValue,
  getMaxLengthMessage,
  findLabel,
  formatPrice
} = require('../services/community/format.js')

const ROOT = path.resolve(__dirname, '..')
const HANDLERS_DIR = path.join(ROOT, 'services/community/module-handlers')

test('shared helpers keep the behaviour of every former local copy', function () {
  assert.equal(trimValue('  hello  '), 'hello')
  assert.equal(trimValue(null), '')
  assert.equal(getMaxLengthMessage('  abc  ', 2, 'too long'), 'too long')
  assert.equal(getMaxLengthMessage('ab', 2, 'too long'), '')
  assert.equal(formatPrice(12.3), '12.30')
  assert.equal(formatPrice(0), '0.00')
  assert.equal(formatPrice('nope'), '0.00')
})

test('findLabel matches both value and feedValue, as the divergent copies did', function () {
  const options = [
    { value: 0, label: 'zero' },
    { value: 1, feedValue: 2, label: 'two' }
  ]

  assert.equal(findLabel(options, 0, 'fallback'), 'zero')
  assert.equal(findLabel(options, 1, 'fallback'), 'two')
  assert.equal(findLabel(options, 2, 'fallback'), 'two')
  assert.equal(findLabel(options, 99, 'fallback'), 'fallback')
  assert.equal(findLabel(options, undefined, 'fallback'), 'fallback')
  assert.equal(findLabel(null, 1, 'fallback'), 'fallback')
})

test('module handlers no longer carry private copies of the shared helpers', function () {
  const offenders = []
  for (const entry of fs.readdirSync(HANDLERS_DIR, { withFileTypes: true })) {
    if (!entry.name.endsWith('.js')) continue
    const source = fs.readFileSync(path.join(HANDLERS_DIR, entry.name), 'utf8')
    if (
      /^function (trimValue|getMaxLengthMessage|findLabel|formatPrice|requestForm)\(/m.test(source)
    ) {
      offenders.push(entry.name)
    }
  }

  assert.deepEqual(offenders, [], 'add shared behaviour to services/community/format.js instead')
})
