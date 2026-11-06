const endpoints = require('../../endpoints.js')
const { request } = require('../../request.js')
const { encodeForm } = require('../../../utils/form.js')
const i18n = require('../../../utils/i18n.js')

function requestForm(options) {
  return request(
    Object.assign({}, options, {
      contentType: 'application/x-www-form-urlencoded'
    })
  )
}

module.exports = {
  getFeed: function (options) {
    var config = options || {}
    var start = Number(config.start || 0)
    var size = Number(config.size || 10)
    var keyword = String(config.keyword || '').trim()

    return request({
      url: keyword
        ? endpoints.community.express.keyword(encodeURIComponent(keyword), start, size)
        : endpoints.community.express.list(start, size),
      method: 'GET',
      authRequired: true
    })
  },

  getDetail: function (id) {
    return request({
      url: endpoints.community.express.detail(id),
      method: 'GET',
      authRequired: true
    })
  },

  getCenter: function (options) {
    var config = options || {}
    var start = Number(config.start || 0)
    var size = Number(config.size || 10)

    return request({
      url: endpoints.community.express.profile(start, size),
      method: 'GET',
      authRequired: true
    })
  },

  publish: function (payload) {
    return request(
      Object.assign(
        {},
        {
          url: endpoints.community.express.publish,
          method: 'POST',
          authRequired: true,
          data: encodeForm(payload),
          contentType: 'application/x-www-form-urlencoded'
        }
      )
    )
  },

  buildListTabs: function () {
    return []
  },

  normalizeItem: function (item) {
    var rawItem = item || {}
    return {
      id: rawItem.id,
      title:
        (rawItem.nickname || i18n.t('community.list.anonStudent')) +
        ' -> ' +
        (rawItem.name || 'TA'),
      summary: rawItem.content || '',
      likeCount: Number(rawItem.likeCount || 0),
      commentCount: Number(rawItem.commentCount || 0),
      timeText: rawItem.publishTime || '',
      raw: rawItem
    }
  },

  buildFeedOptions: function (baseOptions) {
    return Object.assign({}, baseOptions)
  },

  buildCenterTabs: function () {
    return []
  },

  normalizeCenterData: function (payload, normalizeStandardItem) {
    return {
      default: (payload || []).map(function (item) {
        return normalizeStandardItem(item, {
          id: item.id,
          title:
            (item.nickname || i18n.t('community.list.anonStudent')) + ' -> ' + (item.name || 'TA'),
          subtitle: item.publishTime,
          summary: item.content,
          actions: []
        })
      })
    }
  },

  showSummaryProfile: false,

  searchable: true,

  validateForm: function () {
    return i18n.t('community.publish.v.moduleNotSupported')
  },

  buildPublishPayload: function () {
    return Promise.reject(new Error(i18n.t('community.publish.v.moduleNotSupported')))
  },

  buildDetailView: function () {
    return {
      title: i18n.t('community.detail.detail'),
      description: ''
    }
  },

  getComments: function (id) {
    return request({
      url: endpoints.community.express.comments(id),
      method: 'GET',
      authRequired: true
    })
  },

  submitComment: function (id, comment) {
    return requestForm({
      url: endpoints.community.express.comment(id),
      method: 'POST',
      authRequired: true,
      data: encodeForm({ comment: comment })
    })
  },

  toggleLike: function (id) {
    return request({
      url: endpoints.community.express.like(id),
      method: 'POST',
      authRequired: true
    })
  }
}
