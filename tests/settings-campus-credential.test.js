const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const SETTINGS_PAGE_MODULE = path.join(ROOT, 'pages/settings/settings.js')

function waitForSettled() {
  return new Promise(function (resolve) {
    setTimeout(resolve, 20)
  })
}

function setupWxRuntime() {
  const calls = {
    showModal: [],
    showToast: [],
    showTopTips: [],
    setNavigationBarTitle: []
  }

  global.wx = {
    showModal(options) {
      calls.showModal.push(options)
      if (options && typeof options.success === 'function') {
        options.success({ confirm: true, cancel: false })
      }
    },
    showToast(options) {
      calls.showToast.push(options)
    },
    showNavigationBarLoading() {},
    hideNavigationBarLoading() {},
    setNavigationBarTitle(options) {
      calls.setNavigationBarTitle.push(options)
    }
  }

  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }

  return calls
}

function loadPage() {
  let pageConfig = null
  global.Page = function (config) {
    pageConfig = config
  }

  clearModule(SETTINGS_PAGE_MODULE)
  require(SETTINGS_PAGE_MODULE)
  return pageConfig
}

function createPageInstance(pageConfig) {
  const instance = Object.create(pageConfig)
  instance.data = JSON.parse(JSON.stringify(pageConfig.data || {}))
  instance.setData = function (patch) {
    Object.keys(patch).forEach(function (key) {
      if (key.indexOf('.') !== -1) {
        const parts = key.split('.')
        let target = instance.data
        while (parts.length > 1) {
          const part = parts.shift()
          target[part] = target[part] || {}
          target = target[part]
        }
        target[parts[0]] = patch[key]
      } else {
        instance.data[key] = patch[key]
      }
    })
  }
  return instance
}

function stubCommon(calls, apiStub, tokenValue) {
  stubModule(path.join(ROOT, 'constants/features.js'), {
    getMockCredentialsHint() {
      return 'mock hint'
    },
    getFeatureMap() {
      return {
        grade: { id: 'grade', title: '成绩查询' }
      }
    },
    getFeatureSections() {
      return [{ id: 'campus', title: '校园服务', featureIds: ['grade'] }]
    }
  })
  stubModule(path.join(ROOT, 'services/auth.js'), {
    getSessionToken() {
      return tokenValue || ''
    },
    clearSession() {}
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
  stubModule(path.join(ROOT, 'services/feature-config.js'), {
    getFeatureVisibility() {
      return { grade: true }
    },
    setFeatureVisible() {}
  })
  stubModule(path.join(ROOT, 'services/apis/campusCredential.js'), apiStub)
  stubModule(path.join(ROOT, 'utils/theme.js'), {
    applyTheme() {}
  })
  stubModule(path.join(ROOT, 'utils/page.js'), {
    runWithNavigationLoading(ctx, task, runtimeOptions) {
      if (runtimeOptions && runtimeOptions.loadingKey) {
        ctx.setData({ [runtimeOptions.loadingKey]: true })
      }
      return Promise.resolve()
        .then(task)
        .finally(function () {
          if (runtimeOptions && runtimeOptions.loadingKey) {
            ctx.setData({ [runtimeOptions.loadingKey]: false })
          }
        })
    },
    showTopTips(ctx, message) {
      calls.showTopTips.push(message)
      ctx.setData({ errorMessage: message })
    }
  })
  stubModule(path.join(ROOT, 'utils/i18n.js'), {
    t(key) {
      const messages = {
        'settingsPage.navTitle': '设置',
        'settingsPage.dataSourceTitle': '数据源',
        'settingsPage.useMockData': '使用演示数据',
        'settingsPage.currentMode': '当前模式',
        'settingsPage.campusCredentialTitle': '校园凭证管理',
        'settingsPage.campusCredentialLoginFirst': '请先登录后查看校园凭证状态。',
        'settingsPage.campusCredentialLoadingText': '正在加载校园凭证状态...',
        'settingsPage.campusCredentialLoadFailed': '校园凭证状态加载失败，请稍后重试。',
        'settingsPage.campusCredentialAuthStatus': '授权状态',
        'settingsPage.campusCredentialAuthorized': '已授权',
        'settingsPage.campusCredentialUnauthorized': '未授权',
        'settingsPage.campusCredentialSaved': '已保存凭证',
        'settingsPage.campusCredentialQuickAuth': '快速认证',
        'settingsPage.campusCredentialConsentedAt': '授权时间',
        'settingsPage.campusCredentialRevokedAt': '撤回时间',
        'settingsPage.campusCredentialAccount': '校园账号',
        'settingsPage.campusCredentialYes': '是',
        'settingsPage.campusCredentialNo': '否',
        'settingsPage.campusCredentialRevoke': '撤回校园账号凭证授权',
        'settingsPage.campusCredentialDelete': '删除已保存的校园凭证',
        'settingsPage.campusCredentialRevokeTitle': '撤回校园账号凭证授权',
        'settingsPage.campusCredentialRevokeContent': '撤回提示',
        'settingsPage.campusCredentialDeleteTitle': '删除已保存的校园凭证',
        'settingsPage.campusCredentialDeleteContent': '删除提示',
        'settingsPage.campusCredentialRevokeSuccess': '已撤回校园凭证授权',
        'settingsPage.campusCredentialDeleteSuccess': '已删除保存的校园凭证',
        'settingsPage.campusCredentialQuickAuthEnabled': '已开启快速认证',
        'settingsPage.campusCredentialQuickAuthDisabled': '已关闭快速认证',
        'settingsPage.campusCredentialEnableNeedConsent': 'need consent',
        'settingsPage.campusCredentialEnableNeedCredential': 'need credential',
        'settingsPage.campusCredentialActionFailed': 'action failed',
        'settingsPage.featureDisplayTitle': '首页模块展示设置',
        'settingsPage.switchSuccess': '切换成功',
        'settingsPage.switchSuccessContent': '切换内容'
      }
      return messages[key] || key
    }
  })
}

test('settings loads campus credential status and calls action wrappers', async function () {
  const calls = setupWxRuntime()
  let statusCallCount = 0
  let revokeCalls = 0
  let deleteCalls = 0
  let quickAuthCalls = []

  stubCommon(
    calls,
    {
      getCampusCredentialStatus() {
        statusCallCount += 1
        return Promise.resolve({
          success: true,
          data: {
            hasActiveConsent: true,
            hasSavedCredential: true,
            quickAuthEnabled: true,
            consentedAt: '2026-05-11 10:00:00',
            maskedCampusAccount: 'gd***nt'
          }
        })
      },
      revokeCampusCredentialConsent() {
        revokeCalls += 1
        return Promise.resolve({ success: true, data: null })
      },
      deleteCampusCredential() {
        deleteCalls += 1
        return Promise.resolve({ success: true, data: null })
      },
      updateQuickAuth(enabled) {
        quickAuthCalls.push(enabled)
        return Promise.resolve({ success: true, data: null })
      }
    },
    'mock-session'
  )

  const page = createPageInstance(loadPage())
  page.onLoad()
  await waitForSettled()

  assert.equal(statusCallCount, 1)
  assert.equal(page.data.campusCredential.hasActiveConsent, true)
  assert.equal(page.data.campusCredential.maskedCampusAccount, 'gd***nt')

  page.handleQuickAuthSwitch({ detail: { value: false } })
  await waitForSettled()
  page.handleCampusCredentialRevoke()
  await waitForSettled()
  page.handleCampusCredentialDelete()
  await waitForSettled()

  assert.deepEqual(quickAuthCalls, [false])
  assert.equal(revokeCalls, 1)
  assert.equal(deleteCalls, 1)
  assert.ok(statusCallCount >= 4, 'should re-fetch status after actions')
  assert.ok(calls.showToast.length >= 3, 'should show success toast after each action')
})

test('settings blocks quick auth enablement without active consent or saved credential', async function () {
  const calls = setupWxRuntime()
  let quickAuthCalls = 0

  stubCommon(
    calls,
    {
      getCampusCredentialStatus() {
        return Promise.resolve({
          success: true,
          data: {
            hasActiveConsent: false,
            hasSavedCredential: false,
            quickAuthEnabled: false
          }
        })
      },
      revokeCampusCredentialConsent() {
        return Promise.resolve({ success: true, data: null })
      },
      deleteCampusCredential() {
        return Promise.resolve({ success: true, data: null })
      },
      updateQuickAuth() {
        quickAuthCalls += 1
        return Promise.resolve({ success: true, data: null })
      }
    },
    'mock-session'
  )

  const page = createPageInstance(loadPage())
  page.onLoad()
  await waitForSettled()

  page.handleQuickAuthSwitch({ detail: { value: true } })
  await waitForSettled()

  assert.equal(quickAuthCalls, 0)
  assert.equal(page.data.campusCredential.quickAuthEnabled, false)
  assert.equal(calls.showTopTips[0], 'need consent')
})
