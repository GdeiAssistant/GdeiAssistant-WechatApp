const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const PRIVACY_MODULE = path.join(ROOT, 'utils/privacy.js')

test('privacy listener shows only when wx.onNeedPrivacyAuthorization triggers and resolves agree/disagree', function () {
  let needPrivacyCallback = null
  let openContractCalled = 0

  global.wx = {
    onNeedPrivacyAuthorization: function (cb) {
      needPrivacyCallback = cb
    },
    getPrivacySetting: function (opts) {
      opts.success({ needAuthorization: true, privacyContractName: '《测试隐私协议》' })
    },
    openPrivacyContract: function () {
      openContractCalled += 1
    }
  }

  clearModule(PRIVACY_MODULE)
  const privacy = require(PRIVACY_MODULE)
  const states = []
  const unsubscribe = privacy.subscribe(function (state) {
    states.push(state)
  })

  assert.deepEqual(states[states.length - 1], { visible: false, contractName: '' })

  privacy.initPrivacyListener()
  assert.equal(typeof needPrivacyCallback, 'function')

  const resolvedPayloads = []
  needPrivacyCallback(function (payload) {
    resolvedPayloads.push(payload)
  })

  assert.deepEqual(states[states.length - 1], {
    visible: true,
    contractName: '《测试隐私协议》'
  })

  privacy.openPrivacyContract()
  assert.equal(openContractCalled, 1)

  privacy.agreePrivacy('agree-btn')
  assert.deepEqual(resolvedPayloads, [{ buttonId: 'agree-btn', event: 'agree' }])
  assert.equal(states[states.length - 1].visible, false)

  needPrivacyCallback(function (payload) {
    resolvedPayloads.push(payload)
  })
  assert.equal(states[states.length - 1].visible, true)

  privacy.disagreePrivacy()
  assert.deepEqual(resolvedPayloads[1], { event: 'disagree' })
  assert.equal(states[states.length - 1].visible, false)

  unsubscribe()
})
