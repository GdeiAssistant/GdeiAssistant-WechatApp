const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, freshRequire, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const LOCALES = ['zh-CN', 'zh-HK', 'zh-TW', 'en', 'ja', 'ko']
const I18N_MODULE = path.join(ROOT, 'utils/i18n.js')
const COMMUNITY_CONSTANTS = path.join(ROOT, 'constants/community.js')
const MOCK_DATA = path.join(ROOT, 'mock/mock-data.js')
const SOCIAL_UTILS = path.join(ROOT, 'utils/social.js')
const PROFILE_PAGE = path.join(ROOT, 'pages/profile/profile.js')
const SETTINGS_PAGE = path.join(ROOT, 'pages/settings/settings.js')
const APPEARANCE_PAGE = path.join(ROOT, 'pages/appearance/appearance.js')
const COMMUNITY_CENTER_PAGE = path.join(ROOT, 'pages/communityCenter/communityCenter.js')
const CAMPUS_CREDENTIAL_HANDLERS = path.join(ROOT, 'mock/campus-credential-handlers.js')
const MOCK_MODULE = path.join(ROOT, 'mock/index.js')
const USER_API_MODULE = path.join(ROOT, 'services/apis/user.js')
const PROFILE_MODULE = path.join(ROOT, 'constants/profile.js')
const MOCK_DATA_MODULE = path.join(ROOT, 'mock/mock-data.js')
const SOCIAL_DATA = path.join(ROOT, 'mock/social-data.js')

const DM_POLICY_DESC_KEYS = ['all', 'following', 'mutual', 'none']
const SOCIAL_ERROR_DYNAMIC_KEYS = ['privacyRestricted', 'contactUnavailable']

function catalogLeaves(obj, prefix) {
  const items = {}
  if (Array.isArray(obj)) {
    obj.forEach(function (item, index) {
      const next = (prefix || '') + '[' + index + ']'
      if (item !== null && typeof item === 'object') {
        Object.assign(items, catalogLeaves(item, next))
      } else {
        items[next] = item
      }
    })
    return items
  }
  if (obj !== null && typeof obj === 'object') {
    Object.keys(obj).forEach(function (key) {
      const next = prefix ? prefix + '.' + key : key
      Object.assign(items, catalogLeaves(obj[key], next))
    })
    return items
  }
  items[prefix] = obj
  return items
}

function loadCatalog(locale) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', locale + '.json'), 'utf8'))
}

function placeholders(value) {
  if (typeof value !== 'string') return []
  return (value.match(/\{\{(\w+)\}\}/g) || []).slice().sort()
}

function setupWx(locale) {
  const storage = { locale: locale || 'zh-CN' }
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
    getSystemInfoSync() {
      return { language: locale || 'zh-CN' }
    },
    setNavigationBarTitle() {},
    showNavigationBarLoading() {},
    hideNavigationBarLoading() {},
    showLoading() {},
    hideLoading() {},
    showModal() {},
    showToast() {},
    navigateTo() {},
    reLaunch() {}
  }
  global.getApp = function () {
    return { globalData: { locale: storage.locale || 'zh-CN' } }
  }
  return storage
}

function loadPage(modulePath) {
  let captured = null
  global.Page = function (config) {
    captured = config
  }
  clearModule(modulePath)
  require(modulePath)
  assert.ok(captured, 'Page() should capture config for ' + modulePath)
  return captured
}

function createPageInstance(pageConfig) {
  const instance = Object.create(pageConfig)
  instance.data = JSON.parse(JSON.stringify(pageConfig.data || {}))
  instance.setData = function (patch) {
    Object.assign(instance.data, patch)
  }
  return instance
}

function resetMockGraph() {
  clearModule(COMMUNITY_CONSTANTS)
  clearModule(PROFILE_MODULE)
  clearModule(MOCK_DATA_MODULE)
  clearModule(path.join(ROOT, 'mock/community.js'))
  clearModule(path.join(ROOT, 'mock/social-handlers.js'))
  clearModule(path.join(ROOT, 'mock/auth-handlers.js'))
  clearModule(path.join(ROOT, 'services/auth.js'))
  clearModule(MOCK_MODULE)
  stubModule(USER_API_MODULE, {
    getProfileOptions() {
      return Promise.resolve({ success: true, data: {} })
    }
  })
}

function setupMockRouter(locale) {
  const storage = setupWx(locale || 'zh-CN')
  resetMockGraph()
  clearModule(I18N_MODULE)
  require(I18N_MODULE)
  return { mock: require(MOCK_MODULE), storage: storage }
}

async function login(mock) {
  const mockConstants = require(path.join(ROOT, 'constants/mock.js'))
  const result = await mock.handleRequest({
    method: 'POST',
    path: '/api/auth/login',
    data: {
      username: mockConstants.MOCK_ACCOUNT_USERNAME,
      password: mockConstants.MOCK_ACCOUNT_PASSWORD,
      campusCredentialConsent: true,
      policyDate: '2026-04-25',
      effectiveDate: '2026-05-11'
    }
  })
  assert.equal(result.success, true)
  return result.data.token
}

test('six locale catalogs keep recursive leaf parity, types, and placeholders', function () {
  const catalogs = {}
  LOCALES.forEach(function (locale) {
    catalogs[locale] = catalogLeaves(loadCatalog(locale), '')
  })
  const baseKeys = Object.keys(catalogs['zh-CN']).sort()
  assert.ok(baseKeys.length > 900)

  const report = {}
  LOCALES.forEach(function (locale) {
    const keys = Object.keys(catalogs[locale]).sort()
    const missing = baseKeys.filter(function (key) {
      return !Object.prototype.hasOwnProperty.call(catalogs[locale], key)
    })
    const extra = keys.filter(function (key) {
      return baseKeys.indexOf(key) === -1
    })
    const empty = []
    const placeholderMismatch = []
    const typeMismatch = []
    baseKeys.forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(catalogs[locale], key)) return
      const value = catalogs[locale][key]
      const baseValue = catalogs['zh-CN'][key]
      if (typeof value !== typeof baseValue) {
        typeMismatch.push(key)
        return
      }
      if (typeof value === 'string') {
        if (value === '') empty.push(key)
        if (placeholders(value).join(',') !== placeholders(baseValue).join(',')) {
          placeholderMismatch.push(key)
        }
      }
    })
    report[locale] = {
      leaves: keys.length,
      missing: missing.length,
      extra: extra.length,
      empty: empty.length,
      placeholderMismatch: placeholderMismatch.length,
      typeMismatch: typeMismatch.length
    }
    assert.deepEqual(missing, [], locale + ' missing keys')
    assert.deepEqual(extra, [], locale + ' extra keys')
    assert.deepEqual(empty, [], locale + ' empty strings')
    assert.deepEqual(placeholderMismatch, [], locale + ' placeholder mismatch')
    assert.deepEqual(typeMismatch, [], locale + ' type mismatch')
  })

  assert.equal(catalogs['zh-CN']['community.list.loadMore'], '加载更多')
  assert.equal(catalogs['zh-HK']['social.privacy.desc.following'], '得你關注嘅人先可以私訊你')
  assert.equal(catalogs['zh-TW']['social.privacy.desc.following'], '只有你追蹤的人能傳送私訊給你')
  assert.equal(catalogs['zh-TW']['social.privacy.desc.none'], '不接收私訊，但你仍可主動傳送')
  // Keep report visible in assertion message for operators.
  assert.ok(report['zh-CN'].leaves === report['en'].leaves, JSON.stringify(report))
})

function catalogHasPath(root, key) {
  return (
    key.split('.').reduce(function (obj, part) {
      return obj && obj[part] !== undefined ? obj[part] : null
    }, root) !== null
  )
}

test('static i18n references and enumerated dynamic privacy/error keys resolve in all locales', function () {
  const roots = {}
  LOCALES.forEach(function (locale) {
    roots[locale] = loadCatalog(locale)
  })
  const staticKeyPattern = /i18n\.t(?:Replace)?\(\s*['"]([a-zA-Z0-9_.]+)['"]/g
  const keys = new Set()
  function scanFile(filePath) {
    const text = fs.readFileSync(filePath, 'utf8')
    let match
    while ((match = staticKeyPattern.exec(text))) {
      keys.add(match[1])
    }
  }
  function walk(dir) {
    fs.readdirSync(dir).forEach(function (name) {
      if (name === 'node_modules' || name === '.git' || name === 'tests') return
      const full = path.join(dir, name)
      const stat = fs.statSync(full)
      if (stat.isDirectory()) {
        walk(full)
        return
      }
      if (name.endsWith('.js')) scanFile(full)
    })
  }
  walk(ROOT)

  DM_POLICY_DESC_KEYS.forEach(function (suffix) {
    keys.add('social.privacy.desc.' + suffix)
  })
  SOCIAL_ERROR_DYNAMIC_KEYS.forEach(function (suffix) {
    keys.add('social.errors.' + suffix)
  })
  keys.delete('social.privacy.desc.')
  keys.delete('social.errors.')

  const missing = []
  keys.forEach(function (key) {
    LOCALES.forEach(function (locale) {
      if (!catalogHasPath(roots[locale], key)) {
        missing.push(locale + ':' + key)
      }
    })
  })
  assert.deepEqual(missing, [])
  assert.ok(keys.has('community.list.loadMore'))
  assert.ok(keys.has('settingsPage.campusCredentialEnableNeedConsent'))
})

test('normalizeLocale follows root Accept-Language contract with real IO', function () {
  setupWx('zh-CN')
  resetMockGraph()
  const i18n = freshRequire(I18N_MODULE)
  const community = require(COMMUNITY_CONSTANTS)

  const cases = [
    [' zh-HK ', 'zh-HK'],
    ['zh_Hant_HK', 'zh-HK'],
    ['zh-Hant-HK-u-ca-chinese', 'zh-HK'],
    ['zh_MO', 'zh-HK'],
    ['zh-Hant-MO', 'zh-HK'],
    ['zh-Hant-MO-x-private', 'zh-HK'],
    ['zh-TW', 'zh-TW'],
    ['zh_Hant', 'zh-TW'],
    ['zh-Hant-TW', 'zh-TW'],
    ['en-US,en;q=0.8', 'en'],
    ['JA-jp', 'ja'],
    ['ko-KR;q=0.9', 'ko'],
    ['yue', 'zh-CN'],
    ['yue-HK', 'zh-CN'],
    ['fr-FR', 'zh-CN'],
    ['', 'zh-CN']
  ]
  cases.forEach(function (row) {
    assert.equal(i18n.normalizeLocale(row[0]), row[1], String(row[0]))
    assert.equal(community.normalizeCommunityLocale(row[0]), row[1], 'community:' + row[0])
  })

  // Same module object: removing normalizeLocale forces the community fallback path.
  const savedNormalize = i18n.normalizeLocale
  delete i18n.normalizeLocale
  try {
    cases.forEach(function (row) {
      assert.equal(
        community.normalizeCommunityLocale(row[0]),
        row[1],
        'community-fallback:' + row[0]
      )
    })
  } finally {
    i18n.normalizeLocale = savedNormalize
  }
})

test('runtime locale switch rebuilds page copy and mock system prompts for all six locales', function () {
  const storage = setupWx('zh-CN')
  const i18n = freshRequire(I18N_MODULE)
  const mockData = freshRequire(MOCK_DATA)
  const appearanceConfig = loadPage(APPEARANCE_PAGE)
  const appearance = createPageInstance(appearanceConfig)
  const communityConfig = loadPage(COMMUNITY_CENTER_PAGE)
  const communityPage = createPageInstance(communityConfig)
  const titles = {}

  LOCALES.forEach(function (locale) {
    i18n.setLocale(locale)
    storage.locale = locale
    getApp().globalData.locale = locale
    appearance.onLocaleSelect({ currentTarget: { dataset: { code: locale } } })
    communityPage.refreshI18n()
    titles[locale] = {
      appearance: appearance.data.t.title,
      loadMore: communityPage.data.t.loadMore,
      cardLost: mockData.localizedMockText(
        '模拟挂失失败：校园卡查询密码不正确',
        '模擬掛失失敗：校園卡查詢密碼不正確',
        'Mock loss report failed: incorrect campus card query password',
        '模擬紛失届の送信に失敗しました: キャンパスカード照会パスワードが正しくありません',
        '모의 분실신고 실패: 캠퍼스카드 조회 비밀번호가 올바르지 않습니다',
        locale,
        '模擬報失失敗：校園卡查詢密碼不正確'
      ),
      systemNotice: mockData.localizedMockText(
        '系统通知不存在',
        '系統訊息不存在',
        'System notification not found',
        'システム通知が見つかりません',
        '시스템 알림을 찾을 수 없습니다',
        locale,
        '系統通知不存在'
      )
    }
  })

  assert.equal(titles['zh-HK'].cardLost, '模擬報失失敗：校園卡查詢密碼不正確')
  assert.equal(titles['zh-TW'].cardLost, '模擬掛失失敗：校園卡查詢密碼不正確')
  assert.equal(titles['zh-HK'].systemNotice, '系統通知不存在')
  assert.equal(titles['zh-TW'].systemNotice, '系統訊息不存在')
  assert.equal(titles['en'].loadMore, 'Load more')

  const labelsByCode = Object.fromEntries(
    appearance.data.locales.map(function (item) {
      return [item.code, item.label]
    })
  )
  assert.equal(labelsByCode['zh-HK'], '粵語（香港）')
  assert.equal(labelsByCode['zh-TW'], '國語（台灣）')
})

test('privacy and block entries live in settings, profile header owns relationship stats', function () {
  setupWx('zh-CN')
  freshRequire(I18N_MODULE)
  const profileWxml = fs.readFileSync(path.join(ROOT, 'pages/profile/profile.wxml'), 'utf8')
  const settingsWxml = fs.readFileSync(path.join(ROOT, 'pages/settings/settings.wxml'), 'utf8')
  const profileWxss = fs.readFileSync(path.join(ROOT, 'pages/profile/profile.wxss'), 'utf8')
  const profileConfig = loadPage(PROFILE_PAGE)
  const settingsConfig = loadPage(SETTINGS_PAGE)
  const profile = createPageInstance(profileConfig)
  const settings = createPageInstance(settingsConfig)

  profile.refreshI18n()
  settings.refreshI18n()

  assert.match(settingsWxml, /bindtap="openDmPrivacy"/)
  assert.match(settingsWxml, /bindtap="openBlockList"/)
  assert.equal(typeof settings.openDmPrivacy, 'function')
  assert.doesNotMatch(profileWxml, /data-target="privacy"/)
  assert.doesNotMatch(profileWxml, /data-target="blocks"/)
  assert.match(profileWxml, /class="profile_stats"/)
  assert.match(profileWxss, /min-height:\s*96rpx/)
})

test('campus credential quick-auth handler rejects with i18n across six locales', async function () {
  const storage = setupWx('zh-CN')
  const i18n = freshRequire(I18N_MODULE)
  clearModule(CAMPUS_CREDENTIAL_HANDLERS)
  const handlers = require(CAMPUS_CREDENTIAL_HANDLERS)

  function makeUtils(state) {
    return {
      ensureAuthorized() {
        return null
      },
      readState() {
        return state
      },
      writeState(next) {
        Object.assign(state, next)
      },
      rejectWithMessage(message) {
        return Promise.resolve({ success: false, message: message })
      },
      resolveWithDelay(payload) {
        return Promise.resolve(payload)
      },
      buildSuccess(data) {
        return { success: true, data: data }
      },
      currentLocale() {
        return i18n.getCurrentLocale()
      }
    }
  }

  for (let i = 0; i < LOCALES.length; i++) {
    const locale = LOCALES[i]
    i18n.setLocale(locale)
    storage.locale = locale
    getApp().globalData.locale = locale

    const noConsentState = {
      profile: { username: 'gdeiassistant' },
      campusCredential: {
        hasActiveConsent: false,
        hasSavedCredential: false,
        quickAuthEnabled: false
      }
    }
    const consentOnlyState = {
      profile: { username: 'gdeiassistant' },
      campusCredential: {
        hasActiveConsent: true,
        hasSavedCredential: false,
        quickAuthEnabled: false
      }
    }

    const needConsent = await handlers.handleCampusCredentialQuickAuth(
      'token',
      { enabled: true },
      makeUtils(noConsentState)
    )
    const needCredential = await handlers.handleCampusCredentialQuickAuth(
      'token',
      { enabled: true },
      makeUtils(consentOnlyState)
    )

    assert.equal(needConsent.success, false)
    assert.equal(needCredential.success, false)
    assert.equal(needConsent.message, i18n.t('settingsPage.campusCredentialEnableNeedConsent'))
    assert.equal(
      needCredential.message,
      i18n.t('settingsPage.campusCredentialEnableNeedCredential')
    )
    assert.notEqual(
      needConsent.message,
      'Campus credential consent is required before enabling quick auth'
    )
    assert.notEqual(
      needCredential.message,
      'Saved campus credentials are required before enabling quick auth'
    )
  }
})

test('mock social user message bytes stay fixed while system errors follow locale', async function () {
  const customBody = 'Hello混合私信bytes-🔒'
  const { mock, storage } = setupMockRouter('zh-CN')
  const i18n = freshRequire(I18N_MODULE)
  const socialData = freshRequire(SOCIAL_DATA)
  const token = await login(mock)

  const conversation = await mock.handleRequest({
    method: 'POST',
    path: '/api/social/conversations',
    sessionToken: token,
    header: { 'Accept-Language': 'zh-CN' },
    data: { peerId: socialData.PEER_A_ID }
  })
  assert.equal(conversation.success, true)
  const conversationId = conversation.data.id
  const clientMessageId = 'c0ffeeee-user-4000-8000-body00000001'

  const sent = await mock.handleRequest({
    method: 'POST',
    path: '/api/social/conversations/' + conversationId + '/messages',
    sessionToken: token,
    header: { 'Accept-Language': 'zh-CN' },
    data: {
      clientMessageId: clientMessageId,
      type: 'TEXT',
      content: customBody
    }
  })
  assert.equal(sent.success, true)
  assert.equal(sent.data.content, customBody)

  const bodies = {}
  const nicknames = {}
  const systemErrors = {}
  for (let i = 0; i < LOCALES.length; i++) {
    const locale = LOCALES[i]
    i18n.setLocale(locale)
    storage.locale = locale
    getApp().globalData.locale = locale

    const listed = await mock.handleRequest({
      method: 'GET',
      path: '/api/social/conversations/' + conversationId + '/messages',
      sessionToken: token,
      header: { 'Accept-Language': locale },
      data: { limit: 50 }
    })
    assert.equal(listed.success, true)
    const found = (listed.data.items || listed.data || []).filter(function (item) {
      return item.clientMessageId === clientMessageId || item.content === customBody
    })[0]
    assert.ok(found, 'custom message missing for ' + locale)
    bodies[locale] = found.content

    const users = await mock.handleRequest({
      method: 'GET',
      path: '/api/social/users',
      sessionToken: token,
      header: { 'Accept-Language': locale },
      data: { query: '阿晴', limit: 20 }
    })
    assert.equal(users.success, true)
    const peer = (users.data.items || users.data || []).filter(function (item) {
      return item.id === socialData.PEER_A_ID || item.nickname === '阿晴'
    })[0]
    assert.ok(peer, 'peer nickname missing for ' + locale)
    nicknames[locale] = peer.nickname

    await assert.rejects(
      mock.handleRequest({
        method: 'POST',
        path: '/api/social/conversations',
        sessionToken: token,
        header: { 'Accept-Language': locale },
        data: { peerId: socialData.PEER_D_ID }
      }),
      function (error) {
        systemErrors[locale] = error.message
        return error.errorCode === 'PRIVACY_RESTRICTED'
      }
    )
  }

  LOCALES.forEach(function (locale) {
    assert.equal(bodies[locale], customBody)
    assert.equal(nicknames[locale], '阿晴')
  })
  assert.equal(systemErrors['zh-HK'], loadCatalog('zh-HK').social.errors.privacyRestricted)
  assert.equal(systemErrors['zh-TW'], loadCatalog('zh-TW').social.errors.privacyRestricted)
  assert.notEqual(systemErrors['zh-HK'], systemErrors['zh-TW'])
  assert.equal(systemErrors['en'], loadCatalog('en').social.errors.privacyRestricted)
})

test('communityMessage system errors use distinct HK/TW through real mock path', async function () {
  const { mock, storage } = setupMockRouter('zh-CN')
  const i18n = freshRequire(I18N_MODULE)
  const token = await login(mock)

  const byLocale = {}
  for (let i = 0; i < LOCALES.length; i++) {
    const locale = LOCALES[i]
    i18n.setLocale(locale)
    storage.locale = locale
    getApp().globalData.locale = locale
    await assert.rejects(
      mock.handleRequest({
        method: 'POST',
        path: '/api/secret/id/301/comment',
        sessionToken: token,
        header: { 'Accept-Language': locale },
        data: { comment: '   ' }
      }),
      function (error) {
        byLocale[locale] = error.message
        return !!error.message
      }
    )
  }

  assert.equal(byLocale['zh-HK'], '留言唔可以留空')
  assert.equal(byLocale['zh-TW'], '留言不能為空')
  assert.equal(byLocale['zh-CN'], '评论不能为空')
  assert.equal(byLocale['en'], 'Comment cannot be empty')
  assert.notEqual(byLocale['zh-HK'], byLocale['zh-TW'])
})

test('community posts and anonymous comments survive every locale switch', async function () {
  const { mock } = setupMockRouter('zh-CN')
  const i18n = require(I18N_MODULE)
  const token = await login(mock)
  const topic = '用户标题 User title 🔒'
  const content = '用户原文 Original 中文🙂'
  const comment = '我自己的留言 My comment 🙂'
  const request = function (method, requestPath, data) {
    return mock.handleRequest({
      method,
      path: requestPath,
      sessionToken: token,
      header: { 'Accept-Language': i18n.getCurrentLocale() },
      data
    })
  }
  assert.equal((await request('POST', '/api/topic', { topic, content })).success, true)
  const created = await request('GET', '/api/topic/profile/start/0/size/10')
  const post = created.data.find(function (item) {
    return item.content === content
  })
  assert.ok(post)
  await request('POST', '/api/topic/id/' + post.id + '/like')
  await request('POST', '/api/secret/id/301/comment', { comment })

  for (const locale of LOCALES) {
    i18n.setLocale(locale)
    const listed = await request('GET', '/api/topic/profile/start/0/size/10')
    const preserved = listed.data.find(function (item) {
      return item.id === post.id
    })
    assert.ok(preserved, 'submitted post missing after ' + locale)
    assert.equal(preserved.topic, topic)
    assert.equal(preserved.content, content)
    assert.equal(preserved.likeCount, 1)
    assert.equal(preserved.liked, true)
    const comments = await request('GET', '/api/secret/id/301/comments')
    const ownComment = comments.data.find(function (item) {
      return item.comment === comment
    })
    assert.ok(ownComment, 'submitted anonymous comment missing after ' + locale)
    assert.equal(Object.prototype.hasOwnProperty.call(ownComment, 'username'), false)
    assert.equal(Object.prototype.hasOwnProperty.call(ownComment, 'authorId'), false)
  }
})

test('dm privacy dynamic desc keys cover ALL/FOLLOWING/MUTUAL/NONE', function () {
  setupWx('zh-CN')
  const i18n = freshRequire(I18N_MODULE)
  const socialUtils = freshRequire(SOCIAL_UTILS)
  assert.deepEqual(socialUtils.DM_POLICY_OPTIONS, ['ALL', 'FOLLOWING', 'MUTUAL', 'NONE'])
  socialUtils.DM_POLICY_OPTIONS.forEach(function (value) {
    const key = 'social.privacy.desc.' + value.toLowerCase()
    const text = i18n.t(key)
    assert.notEqual(text, key)
  })
})
