const test = require('node:test')
const assert = require('node:assert/strict')

const {
  maskPhone,
  maskEmail,
  maskAccount,
  maskToken,
  maskContactId,
  maskAddress,
  maskPickupCode,
  maskGenericSensitiveText
} = require('../utils/mask.js')

test('maskPhone preserves limited digits for mainland style numbers', function () {
  assert.equal(maskPhone('13812345678'), '138****5678')
  assert.notEqual(maskPhone('13000000000'), '13000000000')
})

test('maskEmail keeps domain and masks local part', function () {
  assert.equal(maskEmail('abc@example.com'), 'a***@example.com')
  assert.equal(maskEmail(''), '')
  assert.equal(maskEmail(null), '')
})

test('maskAccount and maskContactId do not expose short or long identifiers', function () {
  assert.equal(maskAccount('202312345678'), '20***78')
  assert.equal(maskAccount('abc'), 'a***')
  assert.equal(maskContactId('mock_contact_id'), 'mo***id')
})

test('maskToken never returns the original token', function () {
  assert.notEqual(maskToken('token-value-123456'), 'token-value-123456')
  assert.equal(maskToken(null), '')
})

test('maskAddress and maskPickupCode keep only coarse information', function () {
  assert.equal(maskAddress('示例楼栋 A 区 301'), '示例楼栋***')
  assert.equal(maskAddress('Room301'), 'Room***')
  assert.equal(maskPickupCode('ABC123456'), 'A***')
  assert.equal(maskPickupCode('12'), '****')
})

test('maskGenericSensitiveText routes known field types to the correct masker', function () {
  assert.equal(maskGenericSensitiveText('phone', '13812345678'), '138****5678')
  assert.equal(maskGenericSensitiveText('email', 'abc@example.com'), 'a***@example.com')
  assert.equal(maskGenericSensitiveText('address', '示例楼栋 301'), '示例楼栋***')
  assert.equal(maskGenericSensitiveText('pickupCode', 'ABC123456'), 'A***')
  assert.equal(maskGenericSensitiveText('custom', 'plain text'), 'plain text')
})
