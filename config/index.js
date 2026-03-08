const ENV_CONFIG = {
  prod: {
    resourceDomain: 'https://gdeiassistant.azurewebsites.net/',
    requestValidateToken: '7UnEVKNng3XV/eBcsL1/lRIANRfXcoPT',
    requestTimeout: 15000
  }
}

const currentEnv = 'prod'

module.exports = {
  ...ENV_CONFIG[currentEnv],
  currentEnv
}
