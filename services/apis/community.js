const endpoints = require('../endpoints.js')
const { request } = require('../request.js')
const { encodeForm } = require('../../utils/form.js')

function requestForm(options) {
  return request(Object.assign({}, options, {
    contentType: 'application/x-www-form-urlencoded'
  }))
}

function getFeed(moduleId, options) {
  const config = options || {}
  const start = Number(config.start || 0)
  const size = Number(config.size || 10)
  const keyword = String(config.keyword || '').trim()

  switch (moduleId) {
    case 'ershou':
      if (keyword) {
        return request({
          url: endpoints.community.secondhand.keyword(encodeURIComponent(keyword), start),
          method: 'GET',
          authRequired: true
        })
      }
      if (typeof config.type === 'number' && config.type >= 0) {
        return request({
          url: endpoints.community.secondhand.type(config.type, start),
          method: 'GET',
          authRequired: true
        })
      }
      return request({
        url: endpoints.community.secondhand.list(start),
        method: 'GET',
        authRequired: true
      })
    case 'lostandfound':
      if (keyword) {
        return requestForm({
          url: endpoints.community.lostAndFound.search(config.mode || 0, start),
          method: 'POST',
          authRequired: true,
          data: encodeForm({ keyword: keyword })
        })
      }
      return request({
        url: Number(config.mode || 0) === 0
          ? endpoints.community.lostAndFound.lost(start)
          : endpoints.community.lostAndFound.found(start),
        method: 'GET',
        authRequired: true
      })
    case 'secret':
      return request({
        url: endpoints.community.secret.list(start, size),
        method: 'GET',
        authRequired: true
      })
    case 'express':
      return request({
        url: keyword
          ? endpoints.community.express.keyword(encodeURIComponent(keyword), start, size)
          : endpoints.community.express.list(start, size),
        method: 'GET',
        authRequired: true
      })
    case 'topic':
      return request({
        url: keyword
          ? endpoints.community.topic.keyword(encodeURIComponent(keyword), start, size)
          : endpoints.community.topic.list(start, size),
        method: 'GET',
        authRequired: true
      })
    case 'delivery':
      return request({
        url: endpoints.community.delivery.list(start, size),
        method: 'GET',
        authRequired: true
      })
    case 'dating':
      return request({
        url: endpoints.community.dating.list(Number(config.area || 0), start),
        method: 'GET',
        authRequired: true
      })
    case 'photograph':
      return request({
        url: endpoints.community.photograph.list(Number(config.type || 1), start, size),
        method: 'GET',
        authRequired: true
      })
    default:
      return Promise.reject(new Error('未识别的社区模块'))
  }
}

function getDetail(moduleId, id) {
  switch (moduleId) {
    case 'ershou':
      return request({
        url: endpoints.community.secondhand.detail(id),
        method: 'GET',
        authRequired: true
      })
    case 'lostandfound':
      return request({
        url: endpoints.community.lostAndFound.detail(id),
        method: 'GET',
        authRequired: true
      })
    case 'secret':
      return request({
        url: endpoints.community.secret.detail(id),
        method: 'GET',
        authRequired: true
      })
    case 'express':
      return request({
        url: endpoints.community.express.detail(id),
        method: 'GET',
        authRequired: true
      })
    case 'topic':
      return request({
        url: endpoints.community.topic.detail(id),
        method: 'GET',
        authRequired: true
      })
    case 'delivery':
      return request({
        url: endpoints.community.delivery.detail(id),
        method: 'GET',
        authRequired: true
      })
    case 'dating':
      return request({
        url: endpoints.community.dating.detail(id),
        method: 'GET',
        authRequired: true
      })
    case 'photograph':
      return request({
        url: endpoints.community.photograph.detail(id),
        method: 'GET',
        authRequired: true
      })
    default:
      return Promise.reject(new Error('未识别的社区模块'))
  }
}

function getComments(moduleId, id) {
  switch (moduleId) {
    case 'secret':
      return request({
        url: endpoints.community.secret.comments(id),
        method: 'GET',
        authRequired: true
      })
    case 'express':
      return request({
        url: endpoints.community.express.comments(id),
        method: 'GET',
        authRequired: true
      })
    case 'photograph':
      return request({
        url: endpoints.community.photograph.comments(id),
        method: 'GET',
        authRequired: true
      })
    default:
      return Promise.resolve({
        success: true,
        data: []
      })
  }
}

function getCenter(moduleId, options) {
  const config = options || {}
  const start = Number(config.start || 0)
  const size = Number(config.size || 10)

  switch (moduleId) {
    case 'ershou':
      return request({
        url: endpoints.community.secondhand.profile,
        method: 'GET',
        authRequired: true
      })
    case 'lostandfound':
      return request({
        url: endpoints.community.lostAndFound.profile,
        method: 'GET',
        authRequired: true
      })
    case 'secret':
      return request({
        url: endpoints.community.secret.profile,
        method: 'GET',
        authRequired: true
      })
    case 'express':
      return request({
        url: endpoints.community.express.profile(start, size),
        method: 'GET',
        authRequired: true
      })
    case 'topic':
      return request({
        url: endpoints.community.topic.profile(start, size),
        method: 'GET',
        authRequired: true
      })
    case 'delivery':
      return request({
        url: endpoints.community.delivery.mine,
        method: 'GET',
        authRequired: true
      })
    case 'dating':
      return Promise.all([
        request({
          url: endpoints.community.dating.mine,
          method: 'GET',
          authRequired: true
        }),
        request({
          url: endpoints.community.dating.picks.sent,
          method: 'GET',
          authRequired: true
        }),
        request({
          url: endpoints.community.dating.picks.received,
          method: 'GET',
          authRequired: true
        })
      ]).then(function(resultList) {
        return {
          success: true,
          data: {
            profiles: resultList[0].data || [],
            sent: resultList[1].data || [],
            received: resultList[2].data || []
          }
        }
      })
    case 'photograph':
      return request({
        url: endpoints.community.photograph.profile(start, size),
        method: 'GET',
        authRequired: true
      })
    default:
      return Promise.reject(new Error('未识别的社区模块'))
  }
}

function publish(moduleId, payload) {
  switch (moduleId) {
    case 'ershou':
      return requestForm({
        url: endpoints.community.secondhand.publish,
        method: 'POST',
        authRequired: true,
        data: encodeForm(payload)
      })
    case 'lostandfound':
      return requestForm({
        url: endpoints.community.lostAndFound.publish,
        method: 'POST',
        authRequired: true,
        data: encodeForm(payload)
      })
    case 'secret':
      return requestForm({
        url: endpoints.community.secret.publish,
        method: 'POST',
        authRequired: true,
        data: encodeForm(payload)
      })
    case 'express':
      return requestForm({
        url: endpoints.community.express.publish,
        method: 'POST',
        authRequired: true,
        data: encodeForm(payload)
      })
    case 'topic':
      return requestForm({
        url: endpoints.community.topic.publish,
        method: 'POST',
        authRequired: true,
        data: encodeForm(payload)
      })
    case 'delivery':
      return requestForm({
        url: endpoints.community.delivery.publish,
        method: 'POST',
        authRequired: true,
        data: encodeForm(payload)
      })
    case 'dating':
      return requestForm({
        url: endpoints.community.dating.publish,
        method: 'POST',
        authRequired: true,
        data: encodeForm(payload)
      })
    case 'photograph':
      return requestForm({
        url: endpoints.community.photograph.publish,
        method: 'POST',
        authRequired: true,
        data: encodeForm(payload)
      })
    default:
      return Promise.reject(new Error('未识别的社区模块'))
  }
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
  switch (moduleId) {
    case 'secret':
      return requestForm({
        url: endpoints.community.secret.comment(id),
        method: 'POST',
        authRequired: true,
        data: encodeForm({ comment: comment })
      })
    case 'express':
      return requestForm({
        url: endpoints.community.express.comment(id),
        method: 'POST',
        authRequired: true,
        data: encodeForm({ comment: comment })
      })
    case 'photograph':
      return requestForm({
        url: endpoints.community.photograph.comment(id),
        method: 'POST',
        authRequired: true,
        data: encodeForm({ comment: comment })
      })
    default:
      return Promise.reject(new Error('该模块暂不支持评论'))
  }
}

function toggleLike(moduleId, id, value) {
  switch (moduleId) {
    case 'secret':
      return requestForm({
        url: endpoints.community.secret.like(id),
        method: 'POST',
        authRequired: true,
        data: encodeForm({ like: value ? 1 : 0 })
      })
    case 'express':
      return request({
        url: endpoints.community.express.like(id),
        method: 'POST',
        authRequired: true
      })
    case 'topic':
      return request({
        url: endpoints.community.topic.like(id),
        method: 'POST',
        authRequired: true
      })
    case 'photograph':
      return request({
        url: endpoints.community.photograph.like(id),
        method: 'POST',
        authRequired: true
      })
    default:
      return Promise.reject(new Error('该模块暂不支持点赞'))
  }
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
