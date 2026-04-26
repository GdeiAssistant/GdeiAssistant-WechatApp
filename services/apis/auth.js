const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function loginWithCampus(payload) {
  var data = {
    username: payload.username,
    password: payload.password
  }

  if (payload && payload.campusCredentialConsent) {
    data.campusCredentialConsent = true
    data.consentScene = payload.consentScene
    data.policyDate = payload.policyDate
    data.effectiveDate = payload.effectiveDate
  }

  return request({
    url: endpoints.auth.login,
    method: 'POST',
    data: data
  })
}

module.exports = {
  loginWithCampus
}
