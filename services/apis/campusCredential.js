const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function getCampusCredentialStatus() {
  return request({
    url: endpoints.campusCredential.status,
    method: 'GET',
    authRequired: true
  })
}

function recordCampusCredentialConsent(payload) {
  return request({
    url: endpoints.campusCredential.consent,
    method: 'POST',
    authRequired: true,
    data: payload || {}
  })
}

function revokeCampusCredentialConsent() {
  return request({
    url: endpoints.campusCredential.revoke,
    method: 'POST',
    authRequired: true
  })
}

function deleteCampusCredential() {
  return request({
    url: endpoints.campusCredential.credential,
    method: 'DELETE',
    authRequired: true
  })
}

function updateQuickAuth(enabled) {
  return request({
    url: endpoints.campusCredential.quickAuth,
    method: 'POST',
    authRequired: true,
    data: {
      enabled: !!enabled
    }
  })
}

module.exports = {
  getCampusCredentialStatus: getCampusCredentialStatus,
  recordCampusCredentialConsent: recordCampusCredentialConsent,
  revokeCampusCredentialConsent: revokeCampusCredentialConsent,
  deleteCampusCredential: deleteCampusCredential,
  updateQuickAuth: updateQuickAuth
}
