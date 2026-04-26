const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')

const LOGIN_PAGE_MODULE = path.join(ROOT, 'pages/login/login.js')
const INDEX_PAGE_MODULE = path.join(ROOT, 'pages/index/index.js')
const NEWS_PAGE_MODULE = path.join(ROOT, 'pages/news/news.js')
const COMMUNITY_LIST_PAGE_MODULE = path.join(ROOT, 'pages/communityList/communityList.js')
const STORAGE_MODULE = path.join(ROOT, 'constants/storage.js')

function waitForSettled() {
  return new Promise(function (resolve) {
    setTimeout(resolve, 20)
  })
}

function setupWxRuntime(initialStorage) {
  const storage = Object.assign({}, initialStorage)
  const calls = {
    navigateTo: [],
    redirectTo: [],
    reLaunch: [],
    showModal: [],
    setNavigationBarTitle: [],
    showTopTips: [],
    stopPullDownRefresh: 0,
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
    navigateTo(options) {
      calls.navigateTo.push(options)
    },
    redirectTo(options) {
      calls.redirectTo.push(options)
    },
    reLaunch(options) {
      calls.reLaunch.push(options)
    },
    showModal(options) {
      calls.showModal.push(options)
      if (options && typeof options.success === 'function') {
        options.success({ confirm: true, cancel: false })
      }
    },
    setNavigationBarTitle(options) {
      calls.setNavigationBarTitle.push(options)
    },
    showNavigationBarLoading() {
      calls.showNavigationBarLoading += 1
    },
    hideNavigationBarLoading() {
      calls.hideNavigationBarLoading += 1
    },
    stopPullDownRefresh() {
      calls.stopPullDownRefresh += 1
    },
    getAccountInfoSync() {
      return { miniProgram: { version: '1.2.3' } }
    }
  }

  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }

  return { storage, calls }
}

function stubCommonModules(options) {
  const translations = Object.assign(
    {
      'dataSource.mock': '模拟数据',
      'dataSource.remote': '真实接口',
      'login.navTitle': '登录',
      'login.appName': '广东二师助手',
      'login.dataSourceLabel': '数据源：',
      'login.usernamePlaceholder': '请输入学号',
      'login.passwordPlaceholder': '请输入密码',
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
      'login.defaultError': '请稍后再试',
      'index.appName': '广东二师助手',
      'index.navTitle': '首页',
      'index.dataSourceLabel': '数据源：',
      'index.viewProfile': '查看资料',
      'index.settingsSection': '系统功能',
      'index.defaultNickname': '校园用户',
      'index.unreadFailed': '消息加载失败',
      'info.navTitle': '资讯',
      'info.loadingNews': '加载中',
      'info.noMoreNews': '没有更多了',
      'info.noNews': '暂无资讯',
      'info.news': '校园新闻',
      'info.loadNewsFailed': '新闻加载失败',
      'info.newsTabs': [
        { type: 1, label: '校园新闻' },
        { type: 2, label: '通知公告' }
      ],
      'community.list.search': '搜索',
      'community.list.clear': '清空',
      'community.list.loading': '加载中',
      'community.list.noMore': '没有更多了',
      'community.list.emptyTitle': '暂无内容',
      'community.list.emptySummary': '去发布第一条吧',
      'community.list.like': '点赞',
      'community.list.comment': '评论',
      'community.list.myBtn': '我的',
      'community.list.statPhotos': '照片',
      'community.list.statComments': '评论',
      'community.list.statLikes': '点赞',
      'community.common.notice': '提示',
      'community.common.unknownModule': '未知模块',
      'community.common.campusCommunity': '校园社区'
    },
    (options && options.translations) || {}
  )

  stubModule(path.join(ROOT, 'utils/i18n.js'), {
    t(key) {
      return Object.prototype.hasOwnProperty.call(translations, key) ? translations[key] : key
    },
    tReplace(key, params) {
      if (key === 'community.list.publishBtn') {
        return '发布' + ((params && params.title) || '')
      }
      return Object.prototype.hasOwnProperty.call(translations, key) ? translations[key] : key
    }
  })

  stubModule(path.join(ROOT, 'utils/theme.js'), {
    applyTheme() {}
  })

  stubModule(path.join(ROOT, 'utils/page.js'), {
    runWithNavigationLoading(ctx, fn, runtimeOptions) {
      if (runtimeOptions && runtimeOptions.loadingKey) {
        ctx.data[runtimeOptions.loadingKey] = true
      }
      return Promise.resolve()
        .then(fn)
        .finally(function () {
          if (runtimeOptions && runtimeOptions.loadingKey) {
            ctx.data[runtimeOptions.loadingKey] = false
          }
        })
    },
    showTopTips(ctx, message) {
      if (ctx && ctx.__wxCalls) {
        ctx.__wxCalls.showTopTips.push(message)
      }
    }
  })

  stubModule(path.join(ROOT, 'utils/util.js'), {
    showModal() {},
    showNoActionModal() {}
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
}

function loadPage(modulePath) {
  let capturedPageConfig = null
  global.Page = function (config) {
    capturedPageConfig = config
  }

  clearModule(modulePath)
  require(modulePath)
  assert.ok(capturedPageConfig, 'page config should be captured for ' + modulePath)
  return capturedPageConfig
}

function createPageInstance(pageConfig, wxCalls) {
  const instance = Object.create(pageConfig)
  instance.data = JSON.parse(JSON.stringify(pageConfig.data || {}))
  instance.setData = function (patch) {
    Object.assign(instance.data, patch)
  }
  instance.__wxCalls = wxCalls
  return instance
}

test('mock UI smoke covers login page bootstrap and submit flow', async function () {
  const storageKeys = require(STORAGE_MODULE)
  const runtime = setupWxRuntime({ [storageKeys.dataSourceMode]: 'mock' })
  stubCommonModules()

  const authState = { token: null, clearCalls: 0 }

  stubModule(path.join(ROOT, 'constants/features.js'), {
    getMockCredentialsHint() {
      return '账号：gdeiassistant / 密码：gdeiassistant'
    }
  })

  stubModule(path.join(ROOT, 'services/auth.js'), {
    setSessionToken(token) {
      authState.token = token
    },
    clearSession() {
      authState.clearCalls += 1
    },
    validateSessionToken() {
      return Promise.resolve(false)
    }
  })

  stubModule(path.join(ROOT, 'services/apis/auth.js'), {
    loginWithCampus(payload) {
      assert.equal(payload.username, 'gdeiassistant')
      assert.equal(payload.password, 'gdeiassistant')
      assert.equal(payload.campusCredentialConsent, true)
      assert.equal(payload.consentScene, 'LOGIN')
      assert.equal(payload.policyDate, '2026-04-25')
      assert.equal(payload.effectiveDate, '2026-05-11')
      return Promise.resolve({ success: true, data: { token: 'mock-session-token' } })
    }
  })

  stubModule(path.join(ROOT, 'services/data-source.js'), {
    DATA_SOURCE_MODES: { remote: 'remote', mock: 'mock' },
    isMockMode() {
      return true
    },
    setDataSourceMode() {
      return 'mock'
    },
    getDataSourceLabel() {
      return '模拟数据'
    }
  })

  const pageConfig = loadPage(LOGIN_PAGE_MODULE)
  const page = createPageInstance(pageConfig, runtime.calls)

  page.onLoad()
  await waitForSettled()

  assert.equal(page.data.ready, true)
  assert.equal(page.data.useMockData, true)
  assert.equal(page.data.versionCode, '1.2.3')
  assert.equal(page.data.mockCredentialsHint, '账号：gdeiassistant / 密码：gdeiassistant')
  assert.equal(runtime.calls.setNavigationBarTitle.at(-1).title, '登录')

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

  assert.equal(runtime.storage[storageKeys.username], 'gdeiassistant')
  assert.equal(authState.token, 'mock-session-token')
  assert.equal(runtime.calls.redirectTo.length, 1)
  assert.equal(runtime.calls.redirectTo[0].url, '../index/index')
  assert.equal(runtime.calls.showNavigationBarLoading, 1)
  assert.equal(runtime.calls.hideNavigationBarLoading, 1)
})

test('mock UI smoke covers index page profile, inbox badge and feature actions', async function () {
  const runtime = setupWxRuntime()
  stubCommonModules()

  stubModule(path.join(ROOT, 'constants/features.js'), {
    getSystemActions() {
      return [
        { id: 'settings', title: '设置', page: '/pages/settings/settings' },
        { id: 'logout', title: '退出登录', action: 'logout' }
      ]
    }
  })

  let logoutCalls = 0
  let clearCalls = 0
  stubModule(path.join(ROOT, 'services/auth.js'), {
    logout() {
      logoutCalls += 1
      return Promise.resolve()
    },
    clearSession() {
      clearCalls += 1
    }
  })

  stubModule(path.join(ROOT, 'services/apis/messages.js'), {
    getUnreadCount() {
      return Promise.resolve({ success: true, data: 7 })
    }
  })

  stubModule(path.join(ROOT, 'services/apis/user.js'), {
    getAvatar() {
      return Promise.resolve({ success: true, data: 'https://example.com/avatar.png' })
    },
    getProfile() {
      return Promise.resolve({ success: true, data: { nickname: '测试用户' } })
    }
  })

  stubModule(path.join(ROOT, 'services/feature-config.js'), {
    getHomeSections() {
      return [
        {
          id: 'campus',
          title: '校园服务',
          features: [
            { id: 'grade', title: '成绩查询', page: '/pages/grade/grade' },
            { id: 'news', title: '校园新闻', page: '/pages/news/news' }
          ]
        }
      ]
    }
  })

  stubModule(path.join(ROOT, 'services/data-source.js'), {
    getDataSourceLabel() {
      return '模拟数据'
    }
  })

  const pageConfig = loadPage(INDEX_PAGE_MODULE)
  const page = createPageInstance(pageConfig, runtime.calls)

  page.onLoad()
  page.onShow()
  await waitForSettled()

  assert.equal(runtime.calls.setNavigationBarTitle.at(-1).title, '首页')
  assert.equal(page.data.nickname, '测试用户')
  assert.equal(page.data.avatar, 'https://example.com/avatar.png')
  assert.equal(page.data.inboxUnreadCount, 7)
  assert.equal(page.data.inboxBadgeText, '7')
  assert.equal(page.data.homeSections.length, 1)
  assert.equal(page.data.homeSections[0].features.length, 2)
  assert.equal(page.data.systemActions.length, 2)

  page.openProfile()
  page.openInbox()
  assert.equal(runtime.calls.navigateTo.length, 2)
  assert.equal(runtime.calls.navigateTo[0].url, '/pages/profile/profile')
  assert.equal(runtime.calls.navigateTo[1].url, '/pages/inbox/inbox')

  page.handleActionTap({ currentTarget: { dataset: { action: 'logout' } } })
  await waitForSettled()

  assert.equal(logoutCalls, 1)
  assert.equal(clearCalls, 1)
  assert.equal(runtime.calls.reLaunch.length, 1)
  assert.equal(runtime.calls.reLaunch[0].url, '/pages/login/login')
})

test('mock UI smoke covers news list loading, tab switching and detail navigation', async function () {
  const storageKeys = require(STORAGE_MODULE)
  const runtime = setupWxRuntime()
  stubCommonModules()

  const requestLog = []
  stubModule(path.join(ROOT, 'services/apis/info.js'), {
    getNewsList(type, start, size) {
      requestLog.push({ type, start, size })
      if (type === 2) {
        return Promise.resolve({
          success: true,
          data: [{ id: 'announcement-1', title: '公告一', summary: '最新公告' }]
        })
      }
      return Promise.resolve({
        success: true,
        data: [
          { id: 'news-1', title: '新闻一', summary: '最新动态' },
          { id: 'news-2', title: '新闻二', summary: '更多内容' }
        ]
      })
    }
  })

  const pageConfig = loadPage(NEWS_PAGE_MODULE)
  const page = createPageInstance(pageConfig, runtime.calls)

  page.onLoad()
  await waitForSettled()

  assert.equal(runtime.calls.setNavigationBarTitle.at(-1).title, '资讯')
  assert.equal(page.data.tabs.length, 2)
  assert.equal(page.data.newsList.length, 2)
  assert.equal(page.data.newsList[0].title, '新闻一')
  assert.deepEqual(requestLog[0], { type: 1, start: 0, size: 10 })

  page.switchTab({ currentTarget: { dataset: { type: 2 } } })
  await waitForSettled()

  assert.equal(page.data.activeType, 2)
  assert.equal(page.data.newsList.length, 1)
  assert.equal(page.data.newsList[0].id, 'announcement-1')
  assert.deepEqual(requestLog[1], { type: 2, start: 0, size: 10 })

  page.openNewsDetail({ currentTarget: { dataset: { index: 0 } } })
  assert.equal(runtime.storage[storageKeys.newsDetailItem].id, 'announcement-1')
  assert.equal(runtime.calls.navigateTo.length, 1)
  assert.equal(
    runtime.calls.navigateTo[0].url,
    '/pages/newsDetail/newsDetail?mode=news&id=announcement-1'
  )
  assert.ok(runtime.calls.stopPullDownRefresh >= 2)
})

test('mock UI smoke covers community list loading, search and navigation actions', async function () {
  const runtime = setupWxRuntime()
  stubCommonModules({
    translations: {
      'community.marketplace.title': '闲置市场'
    }
  })

  const feedCalls = []
  stubModule(path.join(ROOT, 'constants/community.js'), {
    getCommunityModule(moduleId) {
      if (moduleId !== 'marketplace') {
        return null
      }
      return { moduleId: 'marketplace', title: '闲置市场' }
    }
  })

  stubModule(path.join(ROOT, 'constants/profile.js'), {
    fetchProfileOptions() {
      return Promise.resolve()
    }
  })

  stubModule(path.join(ROOT, 'services/community/registry.js'), {
    getModuleHandler(moduleId) {
      if (moduleId !== 'marketplace') {
        return null
      }
      return {
        buildListTabs() {
          return [
            { id: 'all', title: '全部' },
            { id: 'latest', title: '最新' }
          ]
        },
        buildFeedOptions(options, activeTab) {
          return Object.assign({}, options, {
            tab: activeTab ? activeTab.id : 'all'
          })
        }
      }
    }
  })

  stubModule(path.join(ROOT, 'services/apis/community.js'), {
    getFeed(moduleId, options) {
      feedCalls.push({ moduleId, options })
      return Promise.resolve({
        success: true,
        data: [
          { id: 'market-1', title: '95 新蓝牙耳机', content: '支持校内自提' },
          { id: 'market-2', title: '二手平板', content: '成色很好' }
        ]
      })
    },
    getPhotographStats() {
      return Promise.resolve({ success: true, data: null })
    }
  })

  const pageConfig = loadPage(COMMUNITY_LIST_PAGE_MODULE)
  const page = createPageInstance(pageConfig, runtime.calls)

  page.onLoad({ module: 'marketplace' })
  await waitForSettled()

  assert.equal(runtime.calls.setNavigationBarTitle.at(-1).title, '闲置市场')
  assert.equal(page.data.moduleId, 'marketplace')
  assert.equal(page.data.tabs.length, 2)
  assert.equal(page.data.items.length, 2)
  assert.equal(page.data.items[0].title, '95 新蓝牙耳机')
  assert.equal(feedCalls.length, 1)
  assert.equal(feedCalls[0].options.keyword, '')
  assert.equal(feedCalls[0].options.tab, 'all')

  page.handleSearchInput({ detail: { value: '  蓝牙耳机  ' } })
  page.submitSearch()
  await waitForSettled()

  assert.equal(page.data.searchKeyword, '蓝牙耳机')
  assert.equal(feedCalls.length, 2)
  assert.equal(feedCalls[1].options.keyword, '蓝牙耳机')

  page.openDetail({ currentTarget: { dataset: { index: 0 } } })
  page.openPublish()
  page.openCenter()

  assert.equal(runtime.calls.navigateTo.length, 3)
  assert.equal(
    runtime.calls.navigateTo[0].url,
    '/pages/communityDetail/communityDetail?module=marketplace&id=market-1'
  )
  assert.equal(
    runtime.calls.navigateTo[1].url,
    '/pages/communityPublish/communityPublish?module=marketplace'
  )
  assert.equal(
    runtime.calls.navigateTo[2].url,
    '/pages/communityCenter/communityCenter?module=marketplace'
  )
})
