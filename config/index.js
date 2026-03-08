const ENV_CONFIG = {
  dev: {
    resourceDomain: 'http://localhost:8080/',
    requestValidateToken: '',
    requestTimeout: 15000
  },
  prod: {
    resourceDomain: 'https://gdeiassistant.azurewebsites.net/',
    requestValidateToken: '7UnEVKNng3XV/eBcsL1/lRIANRfXcoPT',
    requestTimeout: 15000
  }
}

function resolveCurrentEnv() {
  try {
    if (typeof wx !== 'undefined' && wx.getAccountInfoSync) {
      const accountInfo = wx.getAccountInfoSync()
      const envVersion = accountInfo && accountInfo.miniProgram ? accountInfo.miniProgram.envVersion : ''
      if (envVersion === 'develop') {
        return 'dev'
      }
      if (envVersion === 'trial' || envVersion === 'release') {
        return 'prod'
      }
    }
  } catch (error) {
    // Ignore runtime detection failure and fallback below.
  }

  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
    return process.env.NODE_ENV === 'development' ? 'dev' : 'prod'
  }

  return 'prod'
}

const currentEnv = resolveCurrentEnv()

module.exports = {
  ...ENV_CONFIG[currentEnv],
  currentEnv
}
