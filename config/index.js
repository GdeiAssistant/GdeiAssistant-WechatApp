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

function normalizeDomain(domain) {
  if (!domain || typeof domain !== 'string') {
    return ''
  }
  return domain.endsWith('/') ? domain : `${domain}/`
}

function getRuntimeDomainOverride() {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.GDEI_RESOURCE_DOMAIN) {
      return normalizeDomain(process.env.GDEI_RESOURCE_DOMAIN)
    }
    if (process.env.RESOURCE_DOMAIN) {
      return normalizeDomain(process.env.RESOURCE_DOMAIN)
    }
  }

  try {
    if (typeof wx !== 'undefined' && wx.getStorageSync) {
      const value = wx.getStorageSync('resourceDomainOverride')
      if (value) {
        return normalizeDomain(value)
      }
    }
  } catch (error) {
    // Ignore runtime override read failures.
  }

  return ''
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

function isDevtoolsRuntime() {
  try {
    if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
      const systemInfo = wx.getSystemInfoSync()
      return systemInfo && systemInfo.platform === 'devtools'
    }
  } catch (error) {
    // Ignore runtime platform detection failures.
  }
  return false
}

function resolveResourceDomain(currentEnv) {
  const override = getRuntimeDomainOverride()
  if (override) {
    return override
  }

  if (currentEnv === 'dev') {
    if (isDevtoolsRuntime()) {
      return normalizeDomain(ENV_CONFIG.dev.resourceDomain)
    }
    // Real-device develop builds usually cannot access localhost.
    return normalizeDomain(ENV_CONFIG.prod.resourceDomain)
  }

  return normalizeDomain(ENV_CONFIG.prod.resourceDomain)
}

const currentEnv = resolveCurrentEnv()
const envConfig = ENV_CONFIG[currentEnv] || ENV_CONFIG.prod

module.exports = {
  ...envConfig,
  resourceDomain: resolveResourceDomain(currentEnv),
  currentEnv
}
