const endpoints = require('../../endpoints.js')
const { request } = require('../../request.js')
const { encodeForm } = require('../../../utils/form.js')
const i18n = require('../../../utils/i18n.js')

var TOPIC_KEYWORD_MAX_LENGTH = 15
var TOPIC_CONTENT_MAX_LENGTH = 250

function trimValue(value) {
  return String(value || '').trim()
}

function getMaxLengthMessage(value, maxLength, message) {
  return trimValue(value).length > maxLength ? message : ''
}

module.exports = {
  // --- Feed ---
  getFeed: function(options) {
    var config = options || {}
    var start = Number(config.start || 0)
    var size = Number(config.size || 10)
    var keyword = String(config.keyword || '').trim()

    return request({
      url: keyword
        ? endpoints.community.topic.keyword(encodeURIComponent(keyword), start, size)
        : endpoints.community.topic.list(start, size),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Detail ---
  getDetail: function(id) {
    return request({
      url: endpoints.community.topic.detail(id),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Center ---
  getCenter: function(options) {
    var config = options || {}
    var start = Number(config.start || 0)
    var size = Number(config.size || 10)

    return request({
      url: endpoints.community.topic.profile(start, size),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Publish ---
  publish: function(payload) {
    return request(Object.assign({}, {
      url: endpoints.community.topic.publish,
      method: 'POST',
      authRequired: true,
      data: encodeForm(payload),
      contentType: 'application/x-www-form-urlencoded'
    }))
  },

  // --- List page: tabs ---
  buildListTabs: function() {
    return []
  },

  // --- List page: normalize ---
  normalizeItem: function(item) {
    var rawItem = item || {}
    return {
      id: rawItem.id,
      title: '#' + (rawItem.topic || i18n.t('community.list.campusTopic')),
      summary: rawItem.content || '',
      cover: rawItem.imageUrls && rawItem.imageUrls.length ? rawItem.imageUrls[0] : '',
      likeCount: Number(rawItem.likeCount || 0),
      timeText: rawItem.publishTime || '',
      raw: rawItem
    }
  },

  // --- List page: build feed options ---
  buildFeedOptions: function(baseOptions) {
    return Object.assign({}, baseOptions)
  },

  // --- Center page: tabs ---
  buildCenterTabs: function() {
    return []
  },

  // --- Center page: normalize ---
  normalizeCenterData: function(payload, normalizeStandardItem) {
    return {
      default: (payload || []).map(function(item) {
        return normalizeStandardItem(item, {
          id: item.id,
          title: '#' + (item.topic || i18n.t('community.list.campusTopic')),
          subtitle: item.publishTime,
          summary: item.content,
          cover: item.imageUrls && item.imageUrls.length ? item.imageUrls[0] : '',
          actions: []
        })
      })
    }
  },

  // --- Center page: show summary profile ---
  showSummaryProfile: false,

  searchable: true,

  imageLimit: 9,

  // --- Publish: validate form ---
  validateForm: function(data) {
    var form = data.form || {}

    var topic = trimValue(form.topic)
    var content = trimValue(form.content)

    if (!topic) return i18n.t('community.publish.v.topicRequired')
    if (getMaxLengthMessage(topic, TOPIC_KEYWORD_MAX_LENGTH, i18n.tReplace('community.publish.v.topicTooLong', { max: TOPIC_KEYWORD_MAX_LENGTH }))) return getMaxLengthMessage(topic, TOPIC_KEYWORD_MAX_LENGTH, i18n.tReplace('community.publish.v.topicTooLong', { max: TOPIC_KEYWORD_MAX_LENGTH }))
    if (!content) return i18n.t('community.publish.v.topicContentRequired')
    if (getMaxLengthMessage(content, TOPIC_CONTENT_MAX_LENGTH, i18n.tReplace('community.publish.v.topicContentTooLong', { max: TOPIC_CONTENT_MAX_LENGTH }))) return getMaxLengthMessage(content, TOPIC_CONTENT_MAX_LENGTH, i18n.tReplace('community.publish.v.topicContentTooLong', { max: TOPIC_CONTENT_MAX_LENGTH }))
    return ''
  },

  // --- Publish: build payload ---
  buildPublishPayload: function(data, uploadFiles) {
    var form = data.form || {}
    var images = data.images || []

    return uploadFiles(images).then(function(imageKeys) {
      return {
        topic: String(form.topic || '').trim(),
        content: String(form.content || '').trim(),
        count: imageKeys.length,
        imageKeys: imageKeys
      }
    })
  },

  // --- Detail: build detail view ---
  buildDetailView: function() {
    return {
      title: i18n.t('community.detail.detail'),
      description: ''
    }
  },

  // --- Comments ---
  getComments: function() {
    return Promise.resolve({ success: true, data: [] })
  },

  // --- Submit comment ---
  submitComment: function() {
    return Promise.reject(new Error('该模块暂不支持评论'))
  },

  // --- Toggle like ---
  toggleLike: function() {
    return Promise.reject(new Error('该模块暂不支持点赞'))
  }
}
