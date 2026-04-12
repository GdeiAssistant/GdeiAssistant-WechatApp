const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')
const { encodeForm } = require('../utils/form.js')

const ROOT = path.resolve(__dirname, '..')
const MOCK_MODULE = path.join(ROOT, 'mock/index.js')
const USER_API_MODULE = path.join(ROOT, 'services/apis/user.js')
const PROFILE_MODULE = path.join(ROOT, 'constants/profile.js')
const COMMUNITY_MODULE = path.join(ROOT, 'constants/community.js')
const MOCK_DATA_MODULE = path.join(ROOT, 'mock/mock-data.js')
const MOCK_CONSTANTS_MODULE = path.join(ROOT, 'constants/mock.js')
const ENDPOINTS_MODULE = path.join(ROOT, 'services/endpoints.js')
const I18N_MODULE = path.join(ROOT, 'utils/i18n.js')

function setupMockRouter() {
  const storage = {}

  global.wx = {
    getStorageSync(key) {
      return storage[key]
    },
    setStorageSync(key, value) {
      storage[key] = value
    },
    removeStorageSync(key) {
      delete storage[key]
    }
  }

  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }

  clearModule(COMMUNITY_MODULE)
  clearModule(PROFILE_MODULE)
  clearModule(MOCK_DATA_MODULE)
  stubModule(USER_API_MODULE, {
    getProfileOptions() {
      return Promise.resolve({ success: true, data: {} })
    }
  })
  clearModule(MOCK_MODULE)

  return require(MOCK_MODULE)
}

function routeContract(label, method, routePath, options) {
  return Object.assign(
    {
      label: label,
      method: method,
      path: routePath,
      authRequired: true,
      data: {}
    },
    options || {}
  )
}

function buildRouteContracts(endpoints) {
  const form = encodeForm
  const mockConstants = require(MOCK_CONSTANTS_MODULE)

  return [
    routeContract('auth.login', 'POST', endpoints.auth.login, {
      authRequired: false,
      data: {
        username: mockConstants.MOCK_ACCOUNT_USERNAME,
        password: mockConstants.MOCK_ACCOUNT_PASSWORD
      }
    }),
    routeContract('auth.logout', 'POST', endpoints.auth.logout, { authRequired: false }),
    routeContract('auth.validate', 'GET', endpoints.auth.validate),
    routeContract('upload.presignedUrl', 'GET', endpoints.upload.presignedUrl, {
      data: { fileName: 'contract.jpg', contentType: 'image/jpeg' }
    }),

    routeContract('user.avatar.get', 'GET', endpoints.user.avatar),
    routeContract('user.avatar.post', 'POST', endpoints.user.avatar, {
      data: { avatarKey: 'mock/avatar.jpg', avatarHdKey: 'mock/avatar_hd.jpg' }
    }),
    routeContract('user.avatar.delete', 'DELETE', endpoints.user.avatar),
    routeContract('user.profile', 'GET', endpoints.user.profile),
    routeContract('user.locations', 'GET', endpoints.user.locations),
    routeContract('user.options', 'GET', endpoints.user.options),
    routeContract('user.nickname', 'POST', endpoints.user.nickname, {
      data: { nickname: '契约测试' }
    }),
    routeContract('user.introduction', 'POST', endpoints.user.introduction, {
      data: { introduction: 'mock route contract' }
    }),
    routeContract('user.birthday', 'POST', endpoints.user.birthday, {
      data: { year: 2004, month: 9, date: 16 }
    }),
    routeContract('user.faculty', 'POST', endpoints.user.faculty, { data: { faculty: 11 } }),
    routeContract('user.major', 'POST', endpoints.user.major, {
      data: { major: 'software_engineering' }
    }),
    routeContract('user.enrollment', 'POST', endpoints.user.enrollment, { data: { year: 2023 } }),
    routeContract('user.location', 'POST', endpoints.user.location, {
      data: { region: 'CN', state: '44', city: '1' }
    }),
    routeContract('user.hometown', 'POST', endpoints.user.hometown, {
      data: { region: 'CN', state: '44', city: '5' }
    }),

    routeContract('cet.number.get', 'GET', endpoints.cet.number),
    routeContract('cet.number.post', 'POST', endpoints.cet.number, {
      data: { number: '123456789012345', name: '林知远' }
    }),
    routeContract('cet.checkcode', 'GET', endpoints.cet.checkcode),
    routeContract('cet.query', 'GET', endpoints.cet.query, {
      data: { ticketNumber: '123456789012345', name: '林知远', checkcode: 'gd26' }
    }),

    routeContract('campus.grade', 'GET', endpoints.campus.grade, { data: { year: 2025 } }),
    routeContract('campus.schedule', 'GET', endpoints.campus.schedule, { data: { week: 6 } }),
    routeContract('campus.cardInfo', 'GET', endpoints.campus.cardInfo),
    routeContract('campus.cardBill', 'POST', endpoints.campus.cardBill, {
      data: { year: 2026, month: 3, date: 15 }
    }),
    routeContract('campus.evaluate', 'POST', endpoints.campus.evaluate, {
      data: { directSubmit: false }
    }),
    routeContract('campus.cardLost', 'POST', endpoints.campus.cardLost, {
      data: { cardPassword: '246810' }
    }),

    routeContract('library.borrow', 'GET', endpoints.library.borrow, {
      data: { password: 'library123' }
    }),
    routeContract('library.renew', 'POST', endpoints.library.renew, {
      data: { code: 'B001', sn: 'S001', password: 'library123' }
    }),
    routeContract('library.search', 'GET', endpoints.library.search, {
      authRequired: false,
      data: { keyword: 'Swift', page: 1 }
    }),
    routeContract('library.detail', 'GET', endpoints.library.detail, {
      authRequired: false,
      data: { detailURL: 'detail_swiftui' }
    }),

    routeContract('data.electricFees', 'POST', endpoints.data.electricFees, {
      authRequired: false,
      data: { year: 2026, name: '林知远', number: '20231234567' }
    }),
    routeContract('data.yellowPage', 'GET', endpoints.data.yellowPage, { authRequired: false }),
    routeContract('info.graduateExam', 'POST', endpoints.info.graduateExam, {
      authRequired: false,
      data: { name: '林知远', examNumber: '441526010203', idNumber: '440101200409160011' }
    }),
    routeContract('info.spareRoom', 'POST', endpoints.info.spareRoom, {
      data: { zone: 0, type: 0, classNumber: 1 }
    }),
    routeContract('info.news', 'GET', endpoints.info.news(1, 0, 10), { authRequired: false }),
    routeContract('info.newsDetail', 'GET', endpoints.info.newsDetail('news_1_1'), {
      authRequired: false
    }),
    routeContract('module.stateDetail', 'GET', endpoints.module.stateDetail, {
      authRequired: false
    }),

    routeContract('messages.announcements', 'GET', endpoints.messages.announcements(0, 10)),
    routeContract(
      'messages.announcementDetail',
      'GET',
      endpoints.messages.announcementDetail('announcement_001')
    ),
    routeContract('messages.interactionList', 'GET', endpoints.messages.interactionList(0, 10)),
    routeContract('messages.unreadCount', 'GET', endpoints.messages.unreadCount),
    routeContract('messages.markRead', 'POST', endpoints.messages.markRead('interaction_1')),
    routeContract('messages.markAllRead', 'POST', endpoints.messages.markAllRead),

    routeContract('secondhand.list', 'GET', endpoints.community.secondhand.list(0)),
    routeContract(
      'secondhand.keyword',
      'GET',
      endpoints.community.secondhand.keyword('keyboard', 0)
    ),
    routeContract('secondhand.type', 'GET', endpoints.community.secondhand.type(2, 0)),
    routeContract('secondhand.detail', 'GET', endpoints.community.secondhand.detail(101)),
    routeContract('secondhand.profile', 'GET', endpoints.community.secondhand.profile),
    routeContract('secondhand.publish', 'POST', endpoints.community.secondhand.publish, {
      data: form({
        name: '契约商品',
        description: '用于 mock 路由契约测试',
        price: 12,
        location: '图书馆',
        type: 2,
        qq: '123456',
        phone: '13612340001',
        imageKeys: 'mock/ershou.jpg'
      })
    }),
    routeContract('secondhand.update', 'POST', endpoints.community.secondhand.update(101), {
      data: form({
        name: '契约商品更新',
        description: '用于 mock 路由契约测试',
        price: 13,
        location: '图书馆',
        type: 2,
        qq: '123456',
        phone: '13612340001'
      })
    }),
    routeContract('secondhand.state', 'POST', endpoints.community.secondhand.state(101), {
      data: form({ state: 1 })
    }),

    routeContract('lostAndFound.lost', 'GET', endpoints.community.lostAndFound.lost(0)),
    routeContract('lostAndFound.found', 'GET', endpoints.community.lostAndFound.found(0)),
    routeContract('lostAndFound.search', 'POST', endpoints.community.lostAndFound.search(0, 0), {
      data: form({ keyword: '校园卡' })
    }),
    routeContract('lostAndFound.detail', 'GET', endpoints.community.lostAndFound.detail(201)),
    routeContract('lostAndFound.profile', 'GET', endpoints.community.lostAndFound.profile),
    routeContract('lostAndFound.publish', 'POST', endpoints.community.lostAndFound.publish, {
      data: form({
        name: '契约失物',
        description: '用于 mock 路由契约测试',
        location: '一饭',
        lostType: 0,
        itemType: 1,
        qq: '123456',
        imageKeys: 'mock/lostfound.jpg'
      })
    }),
    routeContract('lostAndFound.update', 'POST', endpoints.community.lostAndFound.update(201), {
      data: form({
        name: '契约失物更新',
        description: '用于 mock 路由契约测试',
        location: '一饭',
        lostType: 0,
        itemType: 1,
        qq: '123456'
      })
    }),
    routeContract('lostAndFound.didFound', 'POST', endpoints.community.lostAndFound.didFound(201)),

    routeContract('secret.list', 'GET', endpoints.community.secret.list(0, 10)),
    routeContract('secret.detail', 'GET', endpoints.community.secret.detail(301)),
    routeContract('secret.comments', 'GET', endpoints.community.secret.comments(301)),
    routeContract('secret.comment', 'POST', endpoints.community.secret.comment(301), {
      data: form({ comment: '契约评论' })
    }),
    routeContract('secret.like', 'POST', endpoints.community.secret.like(301), {
      data: form({ like: 1 })
    }),
    routeContract('secret.publish', 'POST', endpoints.community.secret.publish, {
      data: form({ type: 0, content: '契约树洞', theme: 1, timer: 0 })
    }),
    routeContract('secret.profile', 'GET', endpoints.community.secret.profile),
    routeContract('secret.profilePaged', 'GET', endpoints.community.secret.profilePaged(0, 10)),

    routeContract('express.list', 'GET', endpoints.community.express.list(0, 10)),
    routeContract('express.keyword', 'GET', endpoints.community.express.keyword('图书馆', 0, 10)),
    routeContract('express.detail', 'GET', endpoints.community.express.detail(401)),
    routeContract('express.comments', 'GET', endpoints.community.express.comments(401)),
    routeContract('express.comment', 'POST', endpoints.community.express.comment(401), {
      data: form({ comment: '契约评论' })
    }),
    routeContract('express.like', 'POST', endpoints.community.express.like(401)),
    routeContract('express.guess', 'POST', endpoints.community.express.guess(401), {
      data: form({ name: '林知远' })
    }),
    routeContract('express.publish', 'POST', endpoints.community.express.publish, {
      data: form({
        nickname: '契约同学',
        realname: '林知远',
        selfGender: 0,
        name: 'TA',
        personGender: 1,
        content: '契约表白'
      })
    }),
    routeContract('express.profile', 'GET', endpoints.community.express.profile(0, 10)),

    routeContract('topic.list', 'GET', endpoints.community.topic.list(0, 10)),
    routeContract('topic.keyword', 'GET', endpoints.community.topic.keyword('实习', 0, 10)),
    routeContract('topic.detail', 'GET', endpoints.community.topic.detail(501)),
    routeContract('topic.like', 'POST', endpoints.community.topic.like(501)),
    routeContract('topic.publish', 'POST', endpoints.community.topic.publish, {
      data: form({
        topic: '契约话题',
        content: '用于 mock 路由契约测试',
        imageKeys: 'mock/topic.jpg'
      })
    }),
    routeContract('topic.profile', 'GET', endpoints.community.topic.profile(0, 10)),

    routeContract('delivery.list', 'GET', endpoints.community.delivery.list(0, 10)),
    routeContract('delivery.detail', 'GET', endpoints.community.delivery.detail(601)),
    routeContract('delivery.publish', 'POST', endpoints.community.delivery.publish, {
      data: form({
        name: '快递代拿',
        number: 'C001',
        phone: '13612340001',
        price: 4,
        company: '菜鸟驿站',
        address: '南苑 5 栋',
        remarks: '轻拿轻放'
      })
    }),
    routeContract('delivery.mine', 'GET', endpoints.community.delivery.mine),
    routeContract('delivery.accept', 'POST', endpoints.community.delivery.accept, {
      data: form({ orderId: 601 }),
      allowedErrorMessage: '不能接自己发布的订单'
    }),
    routeContract('delivery.finish', 'POST', endpoints.community.delivery.finish(9001), {
      allowedErrorMessage: '只有发布者可确认完成'
    }),

    routeContract('dating.list', 'GET', endpoints.community.dating.list(0, 0)),
    routeContract('dating.detail', 'GET', endpoints.community.dating.detail(701)),
    routeContract('dating.publish', 'POST', endpoints.community.dating.publish, {
      data: form({
        nickname: '契约室友',
        grade: 3,
        faculty: '软件工程',
        hometown: '广州',
        content: '用于 mock 路由契约测试',
        qq: '123456',
        wechat: 'mock_wechat',
        area: 0,
        imageKey: 'mock/dating.jpg'
      })
    }),
    routeContract('dating.mine', 'GET', endpoints.community.dating.mine),
    routeContract('dating.pick', 'POST', endpoints.community.dating.pick, {
      data: form({ profileId: 702, content: '契约撩一下' }),
      allowedErrorMessage: '你已经发送过撩一下了'
    }),
    routeContract('dating.pickDetail', 'POST', endpoints.community.dating.pickDetail(801), {
      data: form({ state: 1 })
    }),
    routeContract('dating.picks.sent', 'GET', endpoints.community.dating.picks.sent),
    routeContract('dating.picks.received', 'GET', endpoints.community.dating.picks.received),
    routeContract('dating.profileState', 'POST', endpoints.community.dating.profileState(701), {
      data: form({ state: 0 })
    }),

    routeContract('photograph.list', 'GET', endpoints.community.photograph.list(1, 0, 10)),
    routeContract('photograph.detail', 'GET', endpoints.community.photograph.detail(901)),
    routeContract('photograph.comments', 'GET', endpoints.community.photograph.comments(901)),
    routeContract('photograph.comment', 'POST', endpoints.community.photograph.comment(901), {
      data: form({ comment: '契约评论' })
    }),
    routeContract('photograph.like', 'POST', endpoints.community.photograph.like(901)),
    routeContract('photograph.publish', 'POST', endpoints.community.photograph.publish, {
      data: form({
        title: '契约照片',
        content: '用于 mock 路由契约测试',
        type: 1,
        imageKeys: 'mock/photograph.jpg'
      })
    }),
    routeContract('photograph.profile', 'GET', endpoints.community.photograph.profile(0, 10)),
    routeContract('photograph.stats.photos', 'GET', endpoints.community.photograph.stats.photos),
    routeContract(
      'photograph.stats.comments',
      'GET',
      endpoints.community.photograph.stats.comments
    ),
    routeContract('photograph.stats.likes', 'GET', endpoints.community.photograph.stats.likes)
  ]
}

async function login(router) {
  const mockData = require(MOCK_DATA_MODULE)
  const response = await router.handleRequest({
    path: '/api/auth/login',
    method: 'POST',
    data: {
      username: mockData.MOCK_ACCOUNT_DATA.username,
      password: mockData.MOCK_ACCOUNT_DATA.password
    },
    header: { 'Accept-Language': 'zh-CN' }
  })

  assert.equal(response.success, true, 'login should succeed before contract checks')
  return response.data.token
}

function isAllowedContractError(contract, error) {
  return !!(contract.allowedErrorMessage && error && error.message === contract.allowedErrorMessage)
}

async function assertMockRouteHandled(router, contract, token) {
  const i18n = require(I18N_MODULE)
  const unsupportedRouteMessage = i18n.t('common.serviceUnavailable')

  try {
    await router.handleRequest({
      path: contract.path,
      method: contract.method,
      data: contract.data,
      sessionToken: contract.authRequired ? token : undefined,
      header: { 'Accept-Language': 'zh-CN' }
    })
  } catch (error) {
    assert.notEqual(
      error && error.message,
      unsupportedRouteMessage,
      contract.label + ' should be backed by a mock route: ' + contract.method + ' ' + contract.path
    )

    if (isAllowedContractError(contract, error)) {
      return
    }

    throw error
  }
}

test('mock router handles all WeChat endpoint route contracts', async function () {
  const router = setupMockRouter()
  const token = await login(router)
  const endpoints = require(ENDPOINTS_MODULE)
  const contracts = buildRouteContracts(endpoints)

  for (const contract of contracts) {
    await assertMockRouteHandled(router, contract, token)
  }
})
