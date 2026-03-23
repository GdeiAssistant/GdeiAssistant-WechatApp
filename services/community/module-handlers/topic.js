const endpoints = require('../../endpoints.js')
const { request } = require('../../request.js')
const { encodeForm } = require('../../../utils/form.js')
const i18n = require('../../../utils/i18n.js')

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

  searchable: true
}
