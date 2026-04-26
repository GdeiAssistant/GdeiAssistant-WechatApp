const { maskAccount } = require('../utils/mask.js')

function nowText() {
  return '2026-05-11 10:00:00'
}

function createDefaultCampusCredentialState(username) {
  return {
    hasActiveConsent: false,
    hasSavedCredential: false,
    quickAuthEnabled: false,
    consentedAt: '',
    revokedAt: '',
    policyDate: '',
    effectiveDate: '',
    maskedCampusAccount: username ? maskAccount(username) : ''
  }
}

function getCampusCredentialState(state) {
  var username = state && state.profile ? state.profile.username : ''
  return Object.assign(
    createDefaultCampusCredentialState(username),
    (state && state.campusCredential) || {}
  )
}

function writeCampusCredentialState(state, nextCredentialState) {
  state.campusCredential = Object.assign(
    createDefaultCampusCredentialState(state && state.profile ? state.profile.username : ''),
    nextCredentialState || {}
  )
  return state
}

function buildStatusPayload(state) {
  return getCampusCredentialState(state)
}

function handleCampusCredentialStatus(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  return utils.resolveWithDelay(utils.buildSuccess(buildStatusPayload(utils.readState())))
}

function handleCampusCredentialConsent(token, payload, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var nextState = utils.readState()
  var current = getCampusCredentialState(nextState)
  writeCampusCredentialState(nextState, {
    hasActiveConsent: true,
    hasSavedCredential: current.hasSavedCredential,
    quickAuthEnabled: current.hasSavedCredential && current.quickAuthEnabled !== false,
    consentedAt: nowText(),
    revokedAt: '',
    policyDate: String((payload && payload.policyDate) || '2026-04-25'),
    effectiveDate: String((payload && payload.effectiveDate) || '2026-05-11'),
    maskedCampusAccount: nextState.profile && nextState.profile.username
      ? maskAccount(nextState.profile.username)
      : current.maskedCampusAccount
  })
  utils.writeState(nextState)
  return utils.resolveWithDelay(utils.buildSuccess(buildStatusPayload(nextState)))
}

function handleCampusCredentialRevoke(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var nextState = utils.readState()
  var current = getCampusCredentialState(nextState)
  writeCampusCredentialState(nextState, {
    hasActiveConsent: false,
    hasSavedCredential: false,
    quickAuthEnabled: false,
    consentedAt: current.consentedAt,
    revokedAt: current.revokedAt || nowText(),
    policyDate: current.policyDate,
    effectiveDate: current.effectiveDate,
    maskedCampusAccount: current.maskedCampusAccount
  })
  utils.writeState(nextState)
  return utils.resolveWithDelay(utils.buildSuccess(buildStatusPayload(nextState)))
}

function handleCampusCredentialDelete(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var nextState = utils.readState()
  var current = getCampusCredentialState(nextState)
  writeCampusCredentialState(nextState, {
    hasActiveConsent: false,
    hasSavedCredential: false,
    quickAuthEnabled: false,
    consentedAt: current.consentedAt,
    revokedAt: current.revokedAt || nowText(),
    policyDate: current.policyDate,
    effectiveDate: current.effectiveDate,
    maskedCampusAccount: current.maskedCampusAccount
  })
  utils.writeState(nextState)
  return utils.resolveWithDelay(utils.buildSuccess(buildStatusPayload(nextState)))
}

function handleCampusCredentialQuickAuth(token, payload, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var enabled = !!(payload && payload.enabled)
  var nextState = utils.readState()
  var current = getCampusCredentialState(nextState)

  if (enabled && !current.hasActiveConsent) {
    return utils.rejectWithMessage('Campus credential consent is required before enabling quick auth')
  }
  if (enabled && !current.hasSavedCredential) {
    return utils.rejectWithMessage('Saved campus credentials are required before enabling quick auth')
  }

  writeCampusCredentialState(nextState, {
    hasActiveConsent: current.hasActiveConsent,
    hasSavedCredential: current.hasSavedCredential,
    quickAuthEnabled: enabled,
    consentedAt: current.consentedAt,
    revokedAt: current.revokedAt,
    policyDate: current.policyDate,
    effectiveDate: current.effectiveDate,
    maskedCampusAccount: current.maskedCampusAccount
  })
  utils.writeState(nextState)
  return utils.resolveWithDelay(utils.buildSuccess(buildStatusPayload(nextState)))
}

function applyLoginCampusCredentialState(state, username, payload) {
  var hasConsent = !!(payload && payload.campusCredentialConsent)
  writeCampusCredentialState(state, {
    hasActiveConsent: hasConsent,
    hasSavedCredential: hasConsent,
    quickAuthEnabled: hasConsent,
    consentedAt: hasConsent ? nowText() : '',
    revokedAt: '',
    policyDate: hasConsent ? String(payload.policyDate || '2026-04-25') : '',
    effectiveDate: hasConsent ? String(payload.effectiveDate || '2026-05-11') : '',
    maskedCampusAccount: username ? maskAccount(username) : ''
  })
  return state
}

module.exports = {
  createDefaultCampusCredentialState: createDefaultCampusCredentialState,
  handleCampusCredentialStatus: handleCampusCredentialStatus,
  handleCampusCredentialConsent: handleCampusCredentialConsent,
  handleCampusCredentialRevoke: handleCampusCredentialRevoke,
  handleCampusCredentialDelete: handleCampusCredentialDelete,
  handleCampusCredentialQuickAuth: handleCampusCredentialQuickAuth,
  applyLoginCampusCredentialState: applyLoginCampusCredentialState
}
