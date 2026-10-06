const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')
const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const PROFILE = path.join(ROOT, 'constants/profile.js')
const PAGE = path.join(ROOT, 'pages/profile/profile.js')
const HANDLERS = path.join(ROOT, 'mock/profile-handlers.js')
const TREE = require('../constants/location-regions.js')
const EXPECTED = {
  'zh-CN': ['中国 广东 广州', '中国 广东 汕头', '广东', ['中国', '广东', '广州']],
  'zh-HK': ['中國 廣東 廣州', '中國 廣東 汕頭', '廣東', ['中國', '廣東', '廣州']],
  'zh-TW': ['中國 廣東 廣州', '中國 廣東 汕頭', '廣東', ['中國', '廣東', '廣州']],
  en: [
    'Guangzhou, Guangdong, China',
    'Shantou, Guangdong, China',
    'Guangdong',
    ['China', 'Guangdong', 'Guangzhou']
  ],
  ja: ['広州, 広東, 中国', '汕頭, 広東, 中国', '広東', ['中国', '広東', '広州']],
  ko: ['광저우, 광둥, 중국', '산터우, 광둥, 중국', '광둥', ['중국', '광둥', '광저우']]
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function setup(locale, options) {
  const storage = { locale: locale || 'zh-CN' }
  const app = { globalData: { locale: storage.locale } }
  global.wx = {
    getStorageSync(key) {
      return storage[key]
    },
    setStorageSync(key, value) {
      storage[key] = value
    },
    getSystemInfoSync() {
      return { language: storage.locale, theme: 'light' }
    },
    setNavigationBarTitle() {},
    setNavigationBarColor() {},
    showNavigationBarLoading() {},
    hideNavigationBarLoading() {}
  }
  global.getApp = function () {
    return app
  }
  clearModule(path.join(ROOT, 'utils/i18n.js'))
  const i18n = require('../utils/i18n.js')
  const requests = []
  const raw = {
    username: 'demo',
    nickname: '中国广东用户',
    introduction: '我在中国广东，也写 English🙂',
    faculty: { code: 0, label: '未选择' },
    major: { code: 'unselected', label: '未选择' },
    location: { region: 'CN', state: '44', city: '1', displayName: '中国 广东 广州' },
    hometown: { region: 'CN', state: '44', city: '5', displayName: '中国 广东 汕头' },
    ipArea: '广东'
  }
  stubModule(path.join(ROOT, 'services/apis/user.js'), {
    getAvatar() {
      return Promise.resolve({ success: true, data: '' })
    },
    getProfile() {
      return Promise.resolve({ success: true, data: raw })
    },
    getProfileOptions() {
      return Promise.resolve({ success: true, data: options || {} })
    },
    updateLocation(codes) {
      requests.push(['location', clone(codes)])
      return Promise.resolve({ success: true })
    },
    updateHometown(codes) {
      requests.push(['hometown', clone(codes)])
      return Promise.resolve({ success: true })
    }
  })
  stubModule(path.join(ROOT, 'services/apis/social.js'), {
    getMe() {
      return Promise.resolve({ success: true, data: { id: 'demo' } })
    }
  })
  clearModule(PROFILE)
  let config
  global.Page = function (value) {
    config = value
  }
  clearModule(PAGE)
  require(PAGE)
  const page = Object.create(config)
  page.data = clone(config.data)
  page.setData = function (patch) {
    Object.entries(patch).forEach(function ([key, value]) {
      const parts = key.split('.')
      const last = parts.pop()
      let target = page.data
      parts.forEach(function (part) {
        if (!target[part]) target[part] = {}
        target = target[part]
      })
      target[last] = value
    })
  }
  return { page, raw, requests, i18n, helpers: require(PROFILE) }
}

test('HK profile load localizes location, hometown, IP and picker without rewriting user content', async function () {
  const { page, raw } = setup('zh-HK')
  const before = clone(raw)
  await page.loadProfilePage()
  assert.equal(page.data.profile.location, EXPECTED['zh-HK'][0])
  assert.equal(page.data.form.location, EXPECTED['zh-HK'][0])
  assert.equal(page.data.form.hometown, EXPECTED['zh-HK'][1])
  assert.equal(page.data.profile.displayIpArea, '廣東')
  assert.equal(page.data.profile.ipArea, '广东')
  assert.deepEqual(page.data.form.locationCodes, { region: 'CN', state: '44', city: '1' })
  assert.equal(page.data.form.nickname, raw.nickname)
  assert.equal(page.data.form.introduction, raw.introduction)
  assert.deepEqual(raw, before)
  assert.match(
    fs.readFileSync(path.join(ROOT, 'pages/profile/profile.wxml'), 'utf8'),
    /profile\.displayIpArea/
  )
})

test('six locale onShow refreshes system regions and picker but preserves drafts and codes', async function () {
  const { page, raw, requests, i18n } = setup()
  await page.loadProfilePage()
  page.data.form.nickname = '尚未保存的广东昵称'
  page.data.form.introduction = '未保存：中国广东 English🙂'
  const codes = clone(page.data.form.locationCodes)
  for (const [locale, expected] of Object.entries(EXPECTED)) {
    i18n.setLocale(locale)
    page.onShow()
    assert.equal(page.data.profile.location, expected[0], locale)
    assert.equal(page.data.form.location, expected[0], locale)
    assert.equal(page.data.form.hometown, expected[1], locale)
    assert.equal(page.data.profile.displayIpArea, expected[2], locale)
    const indices = page.data.locationPickerIndex
    assert.deepEqual(
      page.data.locationRanges.map((range, column) => range[indices[column]]),
      expected[3],
      locale
    )
    assert.deepEqual(page.data.form.locationCodes, codes)
    assert.equal(page.data.form.nickname, '尚未保存的广东昵称')
    assert.equal(page.data.form.introduction, '未保存：中国广东 English🙂')
    assert.equal(page.data.profile.nickname, raw.nickname)
    assert.equal(page.data.profile.introduction, raw.introduction)
  }
  assert.deepEqual(requests, [])
})

test('localized picker saves original codes and an unrelated patch preserves location codes', async function () {
  const { page, requests } = setup('ja')
  await page.loadProfilePage()
  const indices = page.data.locationPickerIndex.slice()
  const state = TREE[indices[0]].states[indices[1]]
  indices[2] = state.cities.findIndex((city) => city.code === '6')
  page.handleLocationChange({
    currentTarget: { dataset: { target: 'location' } },
    detail: { value: indices }
  })
  await page._saveQueue
  assert.deepEqual(requests, [['location', { region: 'CN', state: '44', city: '6' }]])
  assert.equal(page.data.form.location, '仏山, 広東, 中国')
  assert.deepEqual(page.data.form.locationCodes, { region: 'CN', state: '44', city: '6' })
  page.applyProfilePatch({ nickname: '广东新昵称' })
  assert.equal(page.data.form.location, '仏山, 広東, 中国')
  assert.deepEqual(page.data.form.locationCodes, { region: 'CN', state: '44', city: '6' })
  assert.deepEqual(page.data.form.hometownCodes, { region: 'CN', state: '44', city: '5' })
  page.onUnload()
})

test('partial and unknown location codes do not invent first descendants or convert custom display', async function () {
  const { page, raw } = setup('zh-HK')
  raw.location = { region: 'CN', state: '', city: '', displayName: '中国' }
  raw.hometown = { region: 'CUSTOM', state: '广东', city: '1', displayName: '我的中国广东' }
  raw.ipArea = '广东某处'
  await page.loadProfilePage()
  assert.equal(page.data.form.location, '中國')
  assert.deepEqual(page.data.form.locationCodes, { region: 'CN', state: '', city: '' })
  assert.equal(page.data.form.hometown, '我的中国广东')
  assert.equal(page.data.profile.displayIpArea, '广东某处')
  assert.equal(page.data.profile.hometownRegion, 'CUSTOM')
})

test('IP display matches complete known names across locales, preserving unknown and ambiguous aliases', function () {
  const { helpers } = setup()
  for (const [locale, expected] of Object.entries(EXPECTED)) {
    for (const name of ['广东', '廣東', 'Guangdong', '広東', '광둥']) {
      assert.equal(helpers.localizeIpArea(name, locale), expected[2], locale + ': ' + name)
    }
  }
  assert.equal(helpers.localizeIpArea('我的广东简介', 'zh-HK'), '我的广东简介')
  assert.equal(helpers.localizeIpArea('Guangdong / Guangzhou', 'zh-HK'), 'Guangdong / Guangzhou')
  assert.equal(helpers.localizeIpArea('广东 广州', 'zh-HK'), '廣東 廣州')
  assert.equal(helpers.localizeIpArea('广东广州', 'zh-HK'), '廣東 廣州')
  assert.equal(helpers.localizeIpArea('中国广东广州', 'zh-HK'), '中國 廣東 廣州')
  assert.equal(helpers.localizeIpArea('中國廣東廣州', 'zh-CN'), '中国 广东 广州')
  assert.equal(helpers.localizeIpArea('廣東 廣州', 'en'), 'Guangzhou, Guangdong')
  assert.equal(helpers.localizeIpArea('Guangzhou, Guangdong', 'ja'), '広州, 広東')
  assert.equal(helpers.localizeIpArea('中国 广东 广州', 'zh-TW'), '中國 廣東 廣州')
  assert.equal(helpers.localizeIpArea('China Guangdong Guangzhou', 'ko'), '광저우, 광둥, 중국')
  assert.equal(helpers.localizeIpArea('我的中国 广东 广州', 'zh-HK'), '我的中国 广东 广州')
  assert.equal(helpers.localizeIpArea('我的中国广东广州', 'zh-HK'), '我的中国广东广州')
  // The catalog uses Shanxi for both 山西 and 陕西; guessing would translate incorrectly.
  assert.equal(helpers.localizeIpArea('Shanxi', 'zh-HK'), 'Shanxi')
})

test('mock profile relocalizes persisted system regions on reads without rewriting state or authors', async function () {
  const { raw, i18n } = setup()
  clearModule(path.join(ROOT, 'mock/mock-data.js'))
  clearModule(HANDLERS)
  const handlers = require(HANDLERS)
  let state = { profile: clone(raw) }
  const utils = {
    ensureAuthorized() {
      return null
    },
    readState() {
      return clone(state)
    },
    writeState(value) {
      state = clone(value)
    },
    currentLocale() {
      return i18n.getCurrentLocale()
    },
    resolveWithDelay(value) {
      return Promise.resolve(value)
    },
    buildSuccess(data) {
      return { success: true, data }
    },
    rejectWithMessage(message) {
      return Promise.reject(new Error(message))
    }
  }
  const before = clone(state)
  for (const [locale, expected] of Object.entries(EXPECTED)) {
    i18n.setLocale(locale)
    const result = await handlers.handleProfile('demo', utils)
    assert.equal(result.data.location.displayName, expected[0], locale)
    assert.equal(result.data.hometown.displayName, expected[1], locale)
    assert.equal(result.data.ipArea, expected[2], locale)
    assert.equal(result.data.nickname, raw.nickname)
    assert.equal(result.data.introduction, raw.introduction)
    assert.deepEqual(state, before)
  }
  state.profile.ipArea = '用户填写的广东'
  state.profile.hometown = { region: 'UNKNOWN', state: '', city: '', displayName: '中国广东自定义' }
  i18n.setLocale('zh-HK')
  const custom = await handlers.handleProfile('demo', utils)
  assert.equal(custom.data.ipArea, '用户填写的广东')
  assert.equal(custom.data.hometown.displayName, '中国广东自定义')
  await assert.rejects(
    handlers.handleLocationUpdate(
      'demo',
      { region: 'CN', state: 'UNKNOWN', city: '1' },
      'location',
      utils
    ),
    /地區選項/
  )
})

test('catalog preserves existing hierarchy and has complete HK/TW labels for all 4279 nodes', function () {
  let counts = [0, 0, 0]
  function visit(nodes, level) {
    nodes.forEach(function (node) {
      counts[level] += 1
      assert.ok(node.code && node.name && node.latinName)
      assert.ok(node.localizedNames && node.localizedNames['zh-HK'], node.name + ' HK')
      assert.ok(node.localizedNames['zh-TW'], node.name + ' TW')
      if (level < 2) visit(node[level === 0 ? 'states' : 'cities'] || [], level + 1)
    })
  }
  visit(TREE, 0)
  assert.deepEqual(counts, [236, 266, 3777])
  const china = TREE.find((node) => node.code === 'CN')
  const guangdong = china.states.find((node) => node.code === '44')
  assert.equal(china.name, '中国')
  assert.equal(guangdong.name, '广东')
  const foshan = guangdong.cities.find((node) => node.code === '6')
  assert.equal(foshan.name, '佛山')
  assert.equal(foshan.latinName, 'Foshan')
})

test('Japan keeps all 47 prefecture codes with sourced foreign labels and the Tochigi correction', function () {
  const { helpers } = setup()
  const japan = TREE.find((node) => node.code === 'JPN')
  const prefectures = japan.states.find((node) => node.code === 'JPN').cities
  assert.equal(prefectures.length, 47)
  assert.equal(new Set(prefectures.map((node) => node.code)).size, 47)
  prefectures.forEach(function (node) {
    ;['en', 'ja', 'ko'].forEach(function (locale) {
      assert.ok(node.localizedNames[locale], node.code + ':' + locale)
    })
    assert.match(node.localizedNames.ja, /[都道府県]$/)
  })
  const tochigi = { region: 'JPN', state: 'JPN', city: '9' }
  assert.equal(helpers.getLocationDisplay(tochigi, '', 'zh-CN'), '日本 栃木')
  assert.equal(helpers.getLocationDisplay(tochigi, '', 'zh-HK'), '日本 栃木')
  assert.equal(helpers.getLocationDisplay(tochigi, '', 'zh-TW'), '日本 栃木')
  assert.equal(helpers.getLocationDisplay(tochigi, '', 'en'), 'Tochigi, Japan')
  assert.equal(helpers.getLocationDisplay(tochigi, '', 'ja'), '栃木県, 日本')
  assert.equal(helpers.getLocationDisplay(tochigi, '', 'ko'), '도치기 현, 일본')
  assert.equal(helpers.findLocationNodes(tochigi).city.name, '枥木')
  assert.equal(
    helpers.getLocationDisplay({ region: 'JPN', state: 'JPN', city: '13' }, '', 'ja'),
    '東京都, 日本'
  )
})

test('sourced global city labels keep full hierarchies and unknown text remains unchanged', function () {
  const { helpers } = setup()
  const cases = [
    [
      'GBR',
      'ENG',
      'LND',
      'London, England, United Kingdom',
      'ロンドン, イングランド, イギリス',
      '런던, 잉글랜드, 영국'
    ],
    ['FRA', 'FRA', 'PAR', 'Paris, France', 'パリ, フランス', '파리, 프랑스'],
    [
      'USA',
      'CA',
      'LAX',
      'Los Angeles, California, United States',
      'ロサンゼルス, カリフォルニア, アメリカ合衆国',
      '로스앤젤레스, 캘리포니아주, 미국'
    ]
  ]
  cases.forEach(function ([region, state, city, en, ja, ko]) {
    const codes = { region: region, state: state, city: city }
    assert.deepEqual(
      ['en', 'ja', 'ko'].map((locale) => helpers.getLocationDisplay(codes, '', locale)),
      [en, ja, ko]
    )
    assert.equal(helpers.findLocationNodes(codes).city.code, city)
  })
  const state = { region: 'USA', state: 'NY', city: '' }
  const city = { region: 'USA', state: 'NY', city: 'QEE' }
  assert.equal(helpers.findLocationNodes(state).city, null)
  assert.equal(helpers.findLocationNodes(city).city.code, 'QEE')
  assert.equal(helpers.getLocationDisplay(state, '', 'en'), 'New York, United States')
  assert.equal(helpers.getLocationDisplay(city, '', 'en'), 'New York City, New York, United States')
  assert.equal(helpers.getLocationDisplay(state, '', 'ja'), 'ニューヨーク州, アメリカ合衆国')
  assert.equal(
    helpers.getLocationDisplay(city, '', 'ja'),
    'ニューヨーク, ニューヨーク州, アメリカ合衆国'
  )
  assert.equal(helpers.getLocationDisplay(state, '', 'ko'), '뉴욕주, 미국')
  assert.equal(helpers.getLocationDisplay(city, '', 'ko'), '뉴욕, 뉴욕주, 미국')
  assert.equal(helpers.localizeIpArea('뉴욕 / New York', 'en'), '뉴욕 / New York')
  assert.equal(
    helpers.localizeIpArea('我的 London / New York 旅行', 'ja'),
    '我的 London / New York 旅行'
  )
  assert.equal(
    helpers.getLocationDisplay({ region: 'CUSTOM', state: 'NY', city: 'QEE' }, '自填地区', 'en'),
    '自填地区'
  )
})

test('French Guiana and Guyana remain independent country choices and ambiguous old names stay raw', function () {
  const { helpers } = setup()
  const frenchGuiana = TREE.find((node) => node.code === 'GUF')
  const guyana = TREE.find((node) => node.code === 'GUY')
  assert.equal(frenchGuiana.iso, 'GF')
  assert.equal(guyana.iso, 'GY')
  assert.equal(frenchGuiana.name, '圭亚那')
  const expected = {
    'zh-CN': '法属圭亚那',
    'zh-HK': '法屬圭亞那',
    'zh-TW': '法屬圭亞那',
    en: 'French Guiana',
    ja: '仏領ギアナ',
    ko: '프랑스령 기아나'
  }
  Object.entries(expected).forEach(function ([locale, name]) {
    assert.equal(helpers.getLocationNodeName(frenchGuiana, locale), name)
    assert.notEqual(helpers.getLocationNodeName(guyana, locale), name)
    assert.equal(helpers.localizeIpArea('圭亚那', locale), '圭亚那')
    assert.equal(helpers.localizeIpArea('French Guiana', locale), name)
  })
  assert.equal(helpers.localizeIpArea('法属圭亚那', 'ja'), '仏領ギアナ')
  assert.equal(helpers.getLocationDisplay({ region: 'GUF' }, '', 'en'), 'French Guiana')
  assert.equal(helpers.getLocationDisplay({ region: 'GUY' }, '', 'en'), 'Guyana')
})

test('labeled remote dictionaries and faculty/major page codes survive six locale switches', async function () {
  const catalog = require('../constants/profile-catalog.js')
  const options = catalog.buildDefaultProfileOptionsPayload('zh-CN')
  options.faculties.push({
    code: 999,
    label: '自定义院系广东',
    majors: [{ code: 'custom', label: '自定义专业中国' }]
  })
  options.marketplaceItemTypes.push({ code: 999, label: '自定义分类广东' })
  const { page, raw, i18n, helpers, requests } = setup('zh-CN', options)
  raw.faculty = { code: 11, label: '计算机科学系' }
  raw.major = { code: 'software_engineering', label: '软件工程' }
  await page.loadProfilePage()
  assert.equal(page.data.form.facultyCode, 11)
  assert.equal(page.data.form.majorCode, 'software_engineering')
  for (const locale of Object.keys(EXPECTED)) {
    i18n.setLocale(locale)
    page.onShow()
    const expected = catalog.buildDefaultProfileOptionsPayload(locale)
    const faculty = expected.faculties.find((node) => node.code === 11)
    const major = faculty.majors.find((node) => node.code === 'software_engineering')
    assert.equal(page.data.form.faculty, faculty.label, locale)
    assert.equal(page.data.form.major, major.label, locale)
    assert.equal(page.data.displayFaculty, faculty.label, locale)
    assert.equal(page.data.displayMajor, major.label, locale)
    assert.equal(page.data.form.facultyCode, 11)
    assert.equal(page.data.form.majorCode, 'software_engineering')
    const cached = await helpers.fetchProfileOptions()
    assert.equal(
      cached.marketplaceItemTypes[0].label,
      expected.marketplaceItemTypes[0].label,
      locale
    )
    assert.equal(cached.lostFoundItemTypes[0].label, expected.lostFoundItemTypes[0].label, locale)
    assert.equal(cached.lostFoundModes[1].label, expected.lostFoundModes[1].label, locale)
    assert.equal(cached.faculties.find((node) => node.code === 999).label, '自定义院系广东')
    assert.equal(
      cached.faculties.find((node) => node.code === 999).majors[0].label,
      '自定义专业中国'
    )
    assert.equal(
      cached.marketplaceItemTypes.find((node) => node.code === 999).label,
      '自定义分类广东'
    )
  }
  page.applyProfilePatch({ nickname: '中国广东' })
  assert.equal(page.data.form.facultyCode, 11)
  assert.equal(page.data.form.majorCode, 'software_engineering')
  assert.deepEqual(requests, [])
})

function capturePage(relativePath) {
  let config
  global.Page = function (value) {
    config = value
  }
  const file = path.join(ROOT, relativePath)
  clearModule(file)
  require(file)
  const page = Object.create(config)
  page.data = clone(config.data)
  page.setData = function (patch) {
    Object.assign(page.data, patch)
  }
  return page
}

test('community picker/category/gender/status locale refresh retains form, selections and cached author content', function () {
  const { i18n } = setup()
  clearModule(path.join(ROOT, 'constants/community.js'))
  const community = require('../constants/community.js')
  const publish = capturePage('pages/communityPublish/communityPublish.js')
  const list = capturePage('pages/communityList/communityList.js')
  const delivery = require('../services/community/module-handlers/delivery.js')
  publish.data.form = { title: '我的广东标题', content: '中国 广东 广州 用户正文' }
  publish.data.expressGenderIndex = 1
  publish.data.secondhandTypeIndex = 3
  list.data.moduleId = 'delivery'
  list.data.activeTabIndex = 1
  const item = { orderId: 1, state: 1, company: '广东订单', remarks: '中国广东用户备注', price: 10 }
  list.data.items = [delivery.normalizeItem(item)]
  for (const locale of Object.keys(EXPECTED)) {
    i18n.setLocale(locale)
    publish.onShow()
    list.onShow()
    assert.deepEqual(
      publish.data.secondhandTypeOptions,
      community.getSecondhandCategoryOptions().slice(1),
      locale
    )
    assert.deepEqual(
      publish.data.lostFoundItemOptions,
      community.getLostFoundItemDictionaryOptions(),
      locale
    )
    assert.deepEqual(publish.data.expressGenderOptions, community.getExpressGenderOptions(), locale)
    assert.deepEqual(publish.data.datingAreaOptions, community.getDatingAreaOptions(), locale)
    assert.equal(publish.data.expressGenderIndex, 1)
    assert.equal(publish.data.secondhandTypeIndex, 3)
    assert.deepEqual(publish.data.form, {
      title: '我的广东标题',
      content: '中国 广东 广州 用户正文'
    })
    assert.equal(
      list.data.items[0].badgeText,
      community.getDeliveryStatusOptions().find((option) => option.value === 1).label,
      locale
    )
    assert.equal(list.data.items[0].title, '广东订单')
    assert.equal(list.data.items[0].metaText, '中国广东用户备注')
    assert.deepEqual(list.data.items[0].raw, item)
    assert.equal(list.data.activeTabIndex, 1)
  }
})

test('delivery detail locale refresh recalculates system state and role without requests or losing content', async function () {
  const { i18n } = setup()
  const payload = {
    detailType: 0,
    order: {
      orderId: 3,
      state: 1,
      company: '广东取件点',
      address: '中国广东地址',
      remarks: '未翻译正文 English🙂',
      price: 10
    },
    trade: { tradeId: 5 }
  }
  let calls = 0
  stubModule(path.join(ROOT, 'services/apis/community.js'), {
    getDetail() {
      calls += 1
      return Promise.resolve({ success: true, data: payload })
    }
  })
  const detail = capturePage('pages/communityDetail/communityDetail.js')
  detail.data.moduleId = 'delivery'
  detail.data.detailId = '3'
  await detail.loadDetail()
  const handler = require('../services/community/module-handlers/delivery.js')
  for (const locale of Object.keys(EXPECTED)) {
    i18n.setLocale(locale)
    detail.onShow()
    const expected = handler.buildDetailView(payload)
    assert.equal(detail.data.detail.statusDescription, expected.statusDescription, locale)
    assert.equal(detail.data.detail.userRoleTitle, expected.userRoleTitle, locale)
    assert.equal(detail.data.detail.sensitiveHint, expected.sensitiveHint, locale)
    assert.equal(detail.data.detail.pickupAddress, '广东取件点')
    assert.equal(detail.data.detail.deliveryAddress, '中国广东地址')
    assert.equal(detail.data.detail.description, '未翻译正文 English🙂')
    assert.equal(detail.data.detail.tradeId, 5)
    assert.equal(detail.data.detail.canFinish, true)
  }
  assert.equal(calls, 1)
  assert.equal(payload.order.state, 1)
  detail.onUnload()
  assert.equal(detail._detailPayload, null)
})

test('chat locale refresh updates sending states without touching text, image paths or client ids', function () {
  const { i18n } = setup()
  const chat = capturePage('pages/chat/chat.js')
  chat.data.selfId = 'self'
  chat.data.draft = '尚未发送的中国广东'
  chat.data.messages = [
    chat.decorateMessage(
      {
        id: '1',
        senderId: 'self',
        clientMessageId: 'a',
        status: 'pending',
        content: '中国 广东 广州'
      },
      'self'
    ),
    chat.decorateMessage(
      {
        id: '2',
        senderId: 'self',
        clientMessageId: 'b',
        status: 'failed',
        type: 'IMAGE',
        displayPath: '/private/广东.png'
      },
      'self'
    ),
    chat.decorateMessage({ id: '3', senderId: 'peer', status: 'sent', content: '用户正文' }, 'self')
  ]
  const before = clone(chat.data.messages)
  for (const locale of Object.keys(EXPECTED)) {
    i18n.setLocale(locale)
    chat.refreshI18n()
    assert.equal(chat.data.messages[0].statusLabel, i18n.t('social.chat.pending'), locale)
    assert.equal(chat.data.messages[1].statusLabel, i18n.t('social.chat.failedRetry'), locale)
    assert.equal(chat.data.messages[2].statusLabel, '')
    assert.equal(chat.data.draft, '尚未发送的中国广东')
    assert.deepEqual(
      chat.data.messages.map(({ statusLabel, ...rest }) => rest),
      before.map(({ statusLabel, ...rest }) => rest)
    )
  }
})

test('profile catalog first import avoids the real API/mock circular dependency', async function () {
  setup('zh-HK')
  const childProcess = require('node:child_process')
  const result = childProcess.spawnSync(
    process.execPath,
    [
      '-e',
      `
    global.wx={getStorageSync(){return 'zh-HK'}};
    global.getApp=()=>({globalData:{locale:'zh-HK'}});
    const profile=require('./constants/profile');
    const handlers=require('./mock/profile-handlers');
    const utils={ensureAuthorized(){return null},readState(){return {profile:{}}},currentLocale(){return 'zh-HK'},resolveWithDelay(v){return Promise.resolve(v)},buildSuccess(data){return {data}}};
    handlers.handleProfile('demo',utils).then(r=>{if(r.data.location.displayName!=='中國 廣東 廣州')throw Error('location');console.log('ok')}).catch(e=>{console.error(e.message);process.exitCode=1});
  `
    ],
    { cwd: ROOT, encoding: 'utf8' }
  )
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stderr, '')
  assert.equal(result.stdout.trim(), 'ok')
})
