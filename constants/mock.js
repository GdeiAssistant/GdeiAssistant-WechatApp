const i18n = require('../utils/i18n.js')

const MOCK_ACCOUNT_USERNAME = 'gdeiassistant'
const MOCK_ACCOUNT_PASSWORD = 'gdeiassistant'

function getMockCredentialsHint() {
  return i18n.tReplace('mock.credentialsHint', {
    username: MOCK_ACCOUNT_USERNAME,
    password: MOCK_ACCOUNT_PASSWORD
  })
}

module.exports = {
  MOCK_ACCOUNT_USERNAME,
  MOCK_ACCOUNT_PASSWORD,
  getMockCredentialsHint
}
