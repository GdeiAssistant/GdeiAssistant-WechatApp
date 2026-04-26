const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const REQUEST_MODULE = path.join(ROOT, 'services/request.js')
const API_MODULE = path.join(ROOT, 'services/apis/campusCredential.js')

function setup() {
  const calls = []

  stubModule(REQUEST_MODULE, {
    request(options) {
      calls.push(options)
      return Promise.resolve({ success: true, data: null })
    }
  })

  clearModule(API_MODULE)
  const api = require(API_MODULE)

  return { api, calls }
}

test('campus credential api wrappers build the expected requests', async function () {
  const { api, calls } = setup()

  await api.getCampusCredentialStatus()
  await api.recordCampusCredentialConsent({
    scene: 'LOGIN',
    policyDate: '2026-04-25',
    effectiveDate: '2026-05-11'
  })
  await api.revokeCampusCredentialConsent()
  await api.deleteCampusCredential()
  await api.updateQuickAuth(true)

  assert.deepEqual(
    calls.map(function (call) {
      return {
        url: call.url,
        method: call.method,
        authRequired: call.authRequired,
        data: call.data
      }
    }),
    [
      {
        url: '/api/campus-credential/status',
        method: 'GET',
        authRequired: true,
        data: undefined
      },
      {
        url: '/api/campus-credential/consent',
        method: 'POST',
        authRequired: true,
        data: {
          scene: 'LOGIN',
          policyDate: '2026-04-25',
          effectiveDate: '2026-05-11'
        }
      },
      {
        url: '/api/campus-credential/revoke',
        method: 'POST',
        authRequired: true,
        data: undefined
      },
      {
        url: '/api/campus-credential',
        method: 'DELETE',
        authRequired: true,
        data: undefined
      },
      {
        url: '/api/campus-credential/quick-auth',
        method: 'POST',
        authRequired: true,
        data: { enabled: true }
      }
    ]
  )
})
