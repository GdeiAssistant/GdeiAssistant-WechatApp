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
        ? endpoints.community.express.keyword(encodeURIComponent(keyword), start, size)
        : endpoints.community.express.list(start, size),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Detail ---
  getDetail: function(id) {
    return request({
      url: endpoints.community.express.detail(id),
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
      url: endpoints.community.express.profile(start, size),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Publish ---
  publish: function(payload) {
    return request(Object.assign({}, {
      url: endpoints.community.express.publish,
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
      title: (rawItem.nickname || i18n.t('community.list.anonStudent')) + ' -> ' + (rawItem.name || 'TA'),
      summary: rawItem.content || '',
      likeCount: Number(rawItem.likeCount || 0),
      commentCount: Number(rawItem.commentCount || 0),
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
          title: (item.nickname || i18n.t('community.list.anonStudent')) + ' -> ' + (item.name || 'TA'),
          subtitle: item.publishTime,
          summary: item.content,
          actions: []
        })
      })
    }
  },

  // --- Center page: show summary profile ---
  showSummaryProfile: false,

  searchable: true
}
