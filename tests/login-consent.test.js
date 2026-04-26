const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const LOGIN_PAGE_MODULE = path.join(ROOT, 'pages/login/login.js')
const STORAGE_MODULE = path.join(ROOT, 'constants/storage.js')

function waitForSettled() {
  return new Promise(function (resolve) {
    setTimeout(resolve, 20)
  })
}

function setupWxRuntime() {
  const storage = {}
  const calls = {
    noActionModal: [],
    redirectTo: [],
    showNavigationBarLoading: 0,
    hideNavigationBarLoading: 0
  }

  global.wx = {
    getStorageSync(key) {
      return storage[key]
    },
    setStorageSync(key, value) {
      storage[key] = value
    },
    removeStorageSync(key) {
      delete storage[key]
    },
    showNavigationBarLoading() {
      calls.showNavigationBarLoading += 1
    },
    hideNavigationBarLoading() {
      calls.hideNavigationBarLoading += 1
    },
    redirectTo(options) {
      calls.redirectTo.push(options)
    },
    setNavigationBarTitle() {},
    getAccountInfoSync() {
      return { miniProgram: { version: '1.0.0' } }
    }
  }

  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }

  return { storage, calls }
}

function loadPage() {
  let pageConfig = null
  global.Page = function (config) {
    pageConfig = config
  }

  clearModule(LOGIN_PAGE_MODULE)
  require(LOGIN_PAGE_MODULE)
  return pageConfig
}

function createPageInstance(pageConfig) {
  const instance = Object.create(pageConfig)
  instance.data = JSON.parse(JSON.stringify(pageConfig.data || {}))
  instance.setData = function (patch) {
    Object.assign(instance.data, patch)
  }
  return instance
}

function stubCommon(loginSpy, modalCalls) {
  stubModule(path.join(ROOT, 'constants/features.js'), {
    getMockCredentialsHint() {
      return 'mock hint'
    }
  })
  stubModule(path.join(ROOT, 'utils/debounce.js'), {
    createSubmitGuard() {
      return {
        acquire() {
          return true
        },
        release() {}
      }
    }
  })
  stubModule(path.join(ROOT, 'utils/util.js'), {
    showNoActionModal(title, content) {
      modalCalls.push({ title, content })
    },
    showModal() {}
  })
  stubModule(path.join(ROOT, 'services/auth.js'), {
    setSessionToken() {},
    clearSession() {},
    validateSessionToken() {
      return Promise.resolve(false)
    }
  })
  stubModule(path.join(ROOT, 'services/data-source.js'), {
    DATA_SOURCE_MODES: { remote: 'remote', mock: 'mock' },
    isMockMode() {
      return false
    },
    setDataSourceMode() {},
    getDataSourceLabel() {
      return '真实接口'
    }
  })
  stubModule(path.join(ROOT, 'utils/theme.js'), {
    applyTheme() {}
  })
  stubModule(path.join(ROOT, 'utils/i18n.js'), {
    t(key) {
      const messages = {
        'login.navTitle': '登录',
        'login.appName': '广东二师助手',
        'login.dataSourceLabel': '数据源：',
        'login.usernamePlaceholder': '请输入校园网账号',
        'login.passwordPlaceholder': '请输入校园网密码',
        'login.button': '登录',
        'login.campusCredentialConsentText': 'consent text',
        'login.campusCredentialConsentRequired': '请先勾选校园凭证单独授权后再登录',
        'login.debugSettings': '调试设置',
        'login.useMockData': '使用模拟数据',
        'login.moreSettings': '更多设置',
        'login.fillCredentials': '请补全信息',
        'login.usernameEmpty': '请输入账号',
        'login.passwordEmpty': '请输入密码',
        'login.loginFailed': '登录失败',
        'login.defaultError': '默认错误'
      }
      return messages[key] || key
    }
  })
  stubModule(path.join(ROOT, 'services/apis/auth.js'), {
    loginWithCampus(payload) {
      return loginSpy(payload)
    }
  })
}

test('login blocks submit when campus credential consent is not checked', async function () {
  const runtime = setupWxRuntime()
  let loginCallCount = 0
  stubCommon(function () {
    loginCallCount += 1
    return Promise.resolve({ success: true, data: { token: 'token' } })
  }, runtime.calls.noActionModal)

  const page = createPageInstance(loadPage())
  page.onLoad()
  await waitForSettled()

  page.formSubmit({
    detail: {
      value: {
        username: 'gdeiassistant',
        password: 'gdeiassistant'
      }
    }
  })
  await waitForSettled()

  assert.equal(loginCallCount, 0)
  assert.equal(runtime.calls.noActionModal.length, 1)
  assert.equal(runtime.calls.noActionModal[0].content, '请先勾选校园凭证单独授权后再登录')
})

test('login sends campus credential consent metadata when checked', async function () {
  const runtime = setupWxRuntime()
  const storageKeys = require(STORAGE_MODULE)
  let capturedPayload = null

  stubCommon(function (payload) {
    capturedPayload = payload
    return Promise.resolve({ success: true, data: { token: 'mock-session-token' } })
  }, runtime.calls.noActionModal)

  const page = createPageInstance(loadPage())
  page.onLoad()
  await waitForSettled()

  page.handleConsentChange({ detail: { value: ['agree'] } })
  page.formSubmit({
    detail: {
      value: {
        username: 'gdeiassistant',
        password: 'gdeiassistant'
      }
    }
  })
  await waitForSettled()

  assert.deepEqual(capturedPayload, {
    username: 'gdeiassistant',
    password: 'gdeiassistant',
    campusCredentialConsent: true,
    consentScene: 'LOGIN',
    policyDate: '2026-04-25',
    effectiveDate: '2026-05-11'
  })
  assert.equal(runtime.storage[storageKeys.username], 'gdeiassistant')
  assert.equal(runtime.calls.redirectTo[0].url, '../index/index')
})
