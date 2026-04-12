const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const MOCK_MODULE = path.join(ROOT, 'mock/index.js')
const USER_API_MODULE = path.join(ROOT, 'services/apis/user.js')
const PROFILE_MODULE = path.join(ROOT, 'constants/profile.js')
const COMMUNITY_MODULE = path.join(ROOT, 'constants/community.js')
const MOCK_DATA_MODULE = path.join(ROOT, 'mock/mock-data.js')

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

function assertSuccess(response, label) {
  assert.equal(response.success, true, label + ' should succeed')
  assert.equal(response.code, 200, label + ' should return code 200')
}

async function request(router, requestPath, options) {
  const response = await router.handleRequest({
    path: requestPath,
    method: (options && options.method) || 'GET',
    data: options && options.data,
    sessionToken: options && options.token,
    header: { 'Accept-Language': 'zh-CN' }
  })

  assertSuccess(response, requestPath)
  return response
}

async function login(router) {
  const mockData = require(MOCK_DATA_MODULE)
  const response = await request(router, '/api/auth/login', {
    method: 'POST',
    data: {
      username: mockData.MOCK_ACCOUNT_DATA.username,
      password: mockData.MOCK_ACCOUNT_DATA.password
    }
  })

  assert.ok(response.data.token, 'login should return token')
  return response.data.token
}

test('mock smoke covers auth and profile flows', async function () {
  const router = setupMockRouter()
  const token = await login(router)

  const profile = await request(router, '/api/user/profile', { token })
  assert.ok(profile.data.username)

  const avatarState = await request(router, '/api/profile/avatar', { token })
  assert.equal(typeof avatarState.data, 'string')

  const locations = await request(router, '/api/profile/locations', { token })
  assert.ok(Array.isArray(locations.data) && locations.data.length > 0)

  const nicknameUpdate = await request(router, '/api/profile/nickname', {
    method: 'POST',
    token,
    data: { nickname: '测试昵称' }
  })
  assert.equal(nicknameUpdate.data.nickname, '测试昵称')

  const introductionUpdate = await request(router, '/api/introduction', {
    method: 'POST',
    token,
    data: { introduction: 'mock smoke intro' }
  })
  assert.equal(introductionUpdate.data.introduction, 'mock smoke intro')

  const updatedProfile = await request(router, '/api/user/profile', { token })
  assert.equal(updatedProfile.data.nickname, '测试昵称')
  assert.equal(updatedProfile.data.introduction, 'mock smoke intro')
})

test('mock smoke covers academic, campus, info and message flows', async function () {
  const router = setupMockRouter()
  const token = await login(router)

  const grade = await request(router, '/api/grade?year=2025', { token })
  assert.ok(Array.isArray(grade.data.firstTermGradeList))

  const schedule = await request(router, '/api/schedule?week=6', { token })
  assert.ok(Array.isArray(schedule.data.scheduleList) && schedule.data.scheduleList.length > 0)

  const cardInfo = await request(router, '/api/card/info', { token })
  assert.ok(cardInfo.data.cardNumber)

  const cardQuery = await request(router, '/api/card/query', {
    method: 'POST',
    token,
    data: { date: '2026-03-01' }
  })
  assert.ok(Array.isArray(cardQuery.data.cardList) && cardQuery.data.cardList.length > 0)

  const librarySearch = await request(router, '/api/library/search?keyword=Swift&page=1')
  assert.ok(
    Array.isArray(librarySearch.data.collectionList) && librarySearch.data.collectionList.length > 0
  )

  const libraryDetail = await request(router, '/api/library/detail?detailURL=detail_swiftui')
  assert.ok(libraryDetail.data.bookname)

  const borrowed = await request(router, '/api/library/borrow?password=library123', { token })
  assert.ok(Array.isArray(borrowed.data) && borrowed.data.length > 0)

  const renew = await request(router, '/api/library/renew', {
    method: 'POST',
    token,
    data: {
      code: borrowed.data[0].code,
      password: 'library123'
    }
  })
  assert.equal(renew.data, null)

  const captcha = await request(router, '/api/cet/checkcode', { token })
  assert.ok(captcha.data.length > 20)

  const cet = await request(
    router,
    '/api/cet/query?ticketNumber=123456789012345&name=林知远&checkcode=gd26',
    { token }
  )
  assert.ok(cet.data.totalScore)

  const spare = await request(router, '/api/spare/query', {
    method: 'POST',
    token,
    data: { zone: 0, type: 0, classNumber: 1 }
  })
  assert.ok(Array.isArray(spare.data) && spare.data.length > 0)

  const graduateExam = await request(router, '/api/graduate-exam/query', {
    method: 'POST',
    data: {
      name: '林知远',
      examNumber: '441526010203',
      idNumber: '440101200409160011'
    }
  })
  assert.ok(graduateExam.data.totalScore)

  const electricity = await request(router, '/api/data/electricfees', {
    method: 'POST',
    data: {
      year: 2026,
      name: '林知远',
      number: '20231234567'
    }
  })
  assert.ok(electricity.data.totalElectricBill)

  const yellowPage = await request(router, '/api/data/yellowpage')
  assert.ok(Array.isArray(yellowPage.data.data) && yellowPage.data.data.length > 0)

  const moduleState = await request(router, '/api/module/state/detail')
  assert.equal(moduleState.data.extension.NEWS, true)

  const announcements = await request(router, '/api/information/announcement/start/0/size/10', {
    token
  })
  assert.ok(Array.isArray(announcements.data) && announcements.data.length > 0)

  const announcementDetail = await request(
    router,
    `/api/information/announcement/id/${announcements.data[0].id}`,
    { token }
  )
  assert.ok(announcementDetail.data.title)

  const news = await request(router, '/api/information/news/type/1/start/0/size/10')
  assert.ok(Array.isArray(news.data) && news.data.length > 0)

  const newsDetail = await request(router, `/api/information/news/id/${news.data[0].id}`)
  assert.ok(newsDetail.data.title)

  const interactions = await request(
    router,
    '/api/information/message/interaction/start/0/size/10',
    { token }
  )
  assert.ok(Array.isArray(interactions.data) && interactions.data.length > 0)

  const unread = await request(router, '/api/information/message/unread', { token })
  assert.ok(unread.data >= 0)

  const readOne = await request(
    router,
    `/api/information/message/id/${interactions.data[0].id}/read`,
    {
      method: 'POST',
      token
    }
  )
  assert.equal(readOne.data, null)

  const readAll = await request(router, '/api/information/message/readall', {
    method: 'POST',
    token
  })
  assert.equal(readAll.data, null)
})

test('mock smoke covers community feature flows', async function () {
  const router = setupMockRouter()
  const token = await login(router)

  const marketplace = await request(router, '/api/ershou/item/start/0', { token })
  assert.ok(Array.isArray(marketplace.data) && marketplace.data.length > 0)
  const marketplaceDetail = await request(router, `/api/ershou/item/id/${marketplace.data[0].id}`, {
    token
  })
  assert.equal(marketplaceDetail.data.secondhandItem.id, marketplace.data[0].id)
  const marketplaceProfile = await request(router, '/api/ershou/profile', { token })
  assert.ok(Object.prototype.hasOwnProperty.call(marketplaceProfile.data, 'doing'))

  const lostFound = await request(router, '/api/lostandfound/lostitem/start/0', { token })
  assert.ok(Array.isArray(lostFound.data) && lostFound.data.length > 0)
  const lostFoundDetail = await request(
    router,
    `/api/lostandfound/item/id/${lostFound.data[0].id}`,
    { token }
  )
  assert.equal(lostFoundDetail.data.item.id, lostFound.data[0].id)

  const secret = await request(router, '/api/secret/info/start/0/size/10', { token })
  assert.ok(Array.isArray(secret.data) && secret.data.length > 0)
  const secretDetail = await request(router, `/api/secret/id/${secret.data[0].id}`, { token })
  assert.equal(secretDetail.data.id, secret.data[0].id)
  const secretComments = await request(router, `/api/secret/id/${secret.data[0].id}/comments`, {
    token
  })
  assert.ok(Array.isArray(secretComments.data))
  const secretProfile = await request(router, '/api/secret/profile/start/0/size/10', { token })
  assert.ok(Array.isArray(secretProfile.data))
  assert.ok(secretProfile.data.length <= 10)

  const dating = await request(router, '/api/dating/profile/area/0/start/0', { token })
  assert.ok(Array.isArray(dating.data) && dating.data.length > 0)
  const datingDetail = await request(router, `/api/dating/profile/id/${dating.data[0].profileId}`, {
    token
  })
  assert.equal(datingDetail.data.profile.profileId, dating.data[0].profileId)
  const datingMine = await request(router, '/api/dating/profile/my', { token })
  assert.ok(Array.isArray(datingMine.data))

  const express = await request(router, '/api/express/start/0/size/10', { token })
  assert.ok(Array.isArray(express.data) && express.data.length > 0)
  const expressDetail = await request(router, `/api/express/id/${express.data[0].id}`, { token })
  assert.equal(expressDetail.data.id, express.data[0].id)
  const expressComments = await request(router, `/api/express/id/${express.data[0].id}/comment`, {
    token
  })
  assert.ok(Array.isArray(expressComments.data))

  const topic = await request(router, '/api/topic/start/0/size/10', { token })
  assert.ok(Array.isArray(topic.data) && topic.data.length > 0)
  const topicDetail = await request(router, `/api/topic/id/${topic.data[0].id}`, { token })
  assert.equal(topicDetail.data.id, topic.data[0].id)

  const delivery = await request(router, '/api/delivery/order/start/0/size/10', { token })
  assert.ok(Array.isArray(delivery.data) && delivery.data.length > 0)
  const deliveryDetail = await request(
    router,
    `/api/delivery/order/id/${delivery.data[0].orderId}`,
    { token }
  )
  assert.equal(deliveryDetail.data.order.orderId, delivery.data[0].orderId)
  const deliveryMine = await request(router, '/api/delivery/mine', { token })
  assert.ok(Object.prototype.hasOwnProperty.call(deliveryMine.data, 'published'))

  const photoStats = await Promise.all([
    request(router, '/api/photograph/statistics/photos', { token }),
    request(router, '/api/photograph/statistics/comments', { token }),
    request(router, '/api/photograph/statistics/likes', { token })
  ])
  photoStats.forEach(function (item) {
    assert.ok(item.data >= 0)
  })

  const photographs = await request(router, '/api/photograph/type/0/start/0/size/10', { token })
  assert.ok(Array.isArray(photographs.data) && photographs.data.length > 0)
  const photographDetail = await request(router, `/api/photograph/id/${photographs.data[0].id}`, {
    token
  })
  assert.equal(photographDetail.data.id, photographs.data[0].id)
  const photographComments = await request(
    router,
    `/api/photograph/id/${photographs.data[0].id}/comment`,
    { token }
  )
  assert.ok(Array.isArray(photographComments.data))
})
