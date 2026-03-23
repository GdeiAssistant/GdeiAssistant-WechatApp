const endpoints = require('../endpoints.js')
const { request } = require('../request.js')
const { encodeForm } = require('../../utils/form.js')
const { getModuleHandler } = require('../community/registry.js')

function requestForm(options) {
  return request(Object.assign({}, options, {
    contentType: 'application/x-www-form-urlencoded'
  }))
}

function getFeed(moduleId, options) {
  var handler = getModuleHandler(moduleId)
  if (handler && handler.getFeed) {
    return handler.getFeed(options)
  }

  return Promise.reject(new Error('未识别的社区模块'))
}

function getDetail(moduleId, id) {
  var handler = getModuleHandler(moduleId)
  if (handler && handler.getDetail) {
    return handler.getDetail(id)
  }

  return Promise.reject(new Error('未识别的社区模块'))
}

function getComments(moduleId, id) {
  var handler = getModuleHandler(moduleId)
  if (handler && handler.getComments) {
    return handler.getComments(id)
  }

  return Promise.resolve({ success: true, data: [] })
}

function getCenter(moduleId, options) {
  var handler = getModuleHandler(moduleId)
  if (handler && handler.getCenter) {
    return handler.getCenter(options)
  }

  return Promise.reject(new Error('未识别的社区模块'))
}

function publish(moduleId, payload) {
  var handler = getModuleHandler(moduleId)
  if (handler && handler.publish) {
    return handler.publish(payload)
  }

  return Promise.reject(new Error('未识别的社区模块'))
}

function updateSecondhandItem(id, payload) {
  return requestForm({
    url: endpoints.community.secondhand.update(id),
    method: 'POST',
    authRequired: true,
    data: encodeForm(payload)
  })
}

function updateLostAndFoundItem(id, payload) {
  return requestForm({
    url: endpoints.community.lostAndFound.update(id),
    method: 'POST',
    authRequired: true,
    data: encodeForm(payload)
  })
}

function submitComment(moduleId, id, comment) {
  var handler = getModuleHandler(moduleId)
  if (handler && handler.submitComment) {
    return handler.submitComment(id, comment)
  }

  return Promise.reject(new Error('该模块暂不支持评论'))
}

function toggleLike(moduleId, id, value) {
  var handler = getModuleHandler(moduleId)
  if (handler && handler.toggleLike) {
    return handler.toggleLike(id, value)
  }

  return Promise.reject(new Error('该模块暂不支持点赞'))
}

function guessExpress(id, name) {
  return requestForm({
    url: endpoints.community.express.guess(id),
    method: 'POST',
    authRequired: true,
    data: encodeForm({ name: name })
  })
}

function updateSecondhandState(id, state) {
  return requestForm({
    url: endpoints.community.secondhand.state(id),
    method: 'POST',
    authRequired: true,
    data: encodeForm({ state: state })
  })
}

function markLostAndFoundDone(id) {
  return request({
    url: endpoints.community.lostAndFound.didFound(id),
    method: 'POST',
    authRequired: true
  })
}

function acceptDeliveryOrder(orderId) {
  return requestForm({
    url: endpoints.community.delivery.accept,
    method: 'POST',
    authRequired: true,
    data: encodeForm({ orderId: orderId })
  })
}

function finishDeliveryTrade(tradeId) {
  return request({
    url: endpoints.community.delivery.finish(tradeId),
    method: 'POST',
    authRequired: true
  })
}

function submitDatingPick(profileId, content) {
  return requestForm({
    url: endpoints.community.dating.pick,
    method: 'POST',
    authRequired: true,
    data: encodeForm({
      profileId: profileId,
      content: content
    })
  })
}

function updateDatingPickState(pickId, state) {
  return requestForm({
    url: endpoints.community.dating.pickDetail(pickId),
    method: 'POST',
    authRequired: true,
    data: encodeForm({ state: state })
  })
}

function updateDatingProfileState(profileId, state) {
  return requestForm({
    url: endpoints.community.dating.profileState(profileId),
    method: 'POST',
    authRequired: true,
    data: encodeForm({ state: state })
  })
}

function getPhotographStats() {
  return Promise.all([
    request({
      url: endpoints.community.photograph.stats.photos,
      method: 'GET',
      authRequired: true
    }),
    request({
      url: endpoints.community.photograph.stats.comments,
      method: 'GET',
      authRequired: true
    }),
    request({
      url: endpoints.community.photograph.stats.likes,
      method: 'GET',
      authRequired: true
    })
  ]).then(function(resultList) {
    return {
      success: true,
      data: {
        photos: resultList[0].data || 0,
        comments: resultList[1].data || 0,
        likes: resultList[2].data || 0
      }
    }
  }).catch(function() {
    return { success: false, data: { photos: 0, comments: 0, likes: 0 } }
  })
}

module.exports = {
  getFeed,
  getDetail,
  getComments,
  getCenter,
  publish,
  updateSecondhandItem,
  updateLostAndFoundItem,
  submitComment,
  toggleLike,
  guessExpress,
  updateSecondhandState,
  markLostAndFoundDone,
  acceptDeliveryOrder,
  finishDeliveryTrade,
  submitDatingPick,
  updateDatingPickState,
  updateDatingProfileState,
  getPhotographStats
}
