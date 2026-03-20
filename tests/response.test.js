const test = require('node:test')
const assert = require('node:assert/strict')

const { normalizePayload, pickMessage } = require('../services/response.js')

test('normalizePayload treats array payloads as successful data', function() {
  const payload = ['news-1', 'news-2']

  assert.deepEqual(normalizePayload(payload), {
    success: true,
    message: '',
    data: payload,
    raw: payload
  })
})

test('normalizePayload normalizes code and status based responses', function() {
  assert.deepEqual(
    normalizePayload({ code: 200, msg: 'ok', data: { id: 1 } }),
    {
      success: true,
      message: 'ok',
      data: { id: 1 },
      raw: { code: 200, msg: 'ok', data: { id: 1 } }
    }
  )

  assert.deepEqual(
    normalizePayload({ status: 500, errorMsg: 'bad request', data: { reason: 'x' } }),
    {
      success: false,
      message: 'bad request',
      data: { reason: 'x' },
      raw: { status: 500, errorMsg: 'bad request', data: { reason: 'x' } }
    }
  )
})

test('pickMessage prefers available aliases and falls back to a default message', function() {
  assert.equal(pickMessage({ error: 'network error' }), 'network error')
  assert.equal(pickMessage({}), '服务暂不可用，请稍后再试')
  assert.equal(pickMessage(null), '服务暂不可用，请稍后再试')
})
