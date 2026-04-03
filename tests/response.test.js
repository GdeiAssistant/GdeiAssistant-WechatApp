const test = require('node:test')
const assert = require('node:assert/strict')

const { normalizePayload, pickMessage } = require('../services/response.js')

test('normalizePayload treats array payloads as successful data', function () {
  const payload = ['news-1', 'news-2']

  assert.deepEqual(normalizePayload(payload), {
    success: true,
    message: '',
    data: payload,
    raw: payload
  })
})

test('normalizePayload keeps payloads that already declare success explicitly', function () {
  const payload = { success: false, message: '校验失败', data: { field: 'name' } }

  assert.equal(normalizePayload(payload), payload)
})

test('normalizePayload normalizes code and status based responses', function () {
  assert.deepEqual(normalizePayload({ code: 200, msg: 'ok', data: { id: 1 } }), {
    success: true,
    message: 'ok',
    data: { id: 1 },
    raw: { code: 200, msg: 'ok', data: { id: 1 } }
  })

  assert.deepEqual(normalizePayload({ code: 0, error: 'done', data: ['item'] }), {
    success: true,
    message: 'done',
    data: ['item'],
    raw: { code: 0, error: 'done', data: ['item'] }
  })

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

test('normalizePayload falls back for invalid or message-only payloads', function () {
  assert.deepEqual(normalizePayload(null), {
    success: false,
    message: '服务暂不可用，请稍后再试',
    data: null
  })

  assert.deepEqual(normalizePayload({ message: '接口升级中' }), {
    success: false,
    message: '接口升级中',
    data: null,
    raw: { message: '接口升级中' }
  })
})

test('pickMessage prefers available aliases and falls back to a default message', function () {
  assert.equal(pickMessage({ error: 'network error' }), 'network error')
  assert.equal(pickMessage({ errorMsg: 'fallback alias' }), 'fallback alias')
  assert.equal(pickMessage({}), '服务暂不可用，请稍后再试')
  assert.equal(pickMessage(null), '服务暂不可用，请稍后再试')
})
