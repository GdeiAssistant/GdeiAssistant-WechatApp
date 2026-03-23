const endpoints = require('../../endpoints.js')
const { request } = require('../../request.js')
const { encodeForm } = require('../../../utils/form.js')
const i18n = require('../../../utils/i18n.js')
const {
  getPhotographTabOptions
} = require('../../../constants/community.js')

module.exports = {
  // --- Feed ---
  getFeed: function(options) {
    var config = options || {}
    var start = Number(config.start || 0)
    var size = Number(config.size || 10)

    return request({
      url: endpoints.community.photograph.list(Number(config.type || 1), start, size),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Detail ---
  getDetail: function(id) {
    return request({
      url: endpoints.community.photograph.detail(id),
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
      url: endpoints.community.photograph.profile(start, size),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Publish ---
  publish: function(payload) {
    return request(Object.assign({}, {
      url: endpoints.community.photograph.publish,
      method: 'POST',
      authRequired: true,
      data: encodeForm(payload),
      contentType: 'application/x-www-form-urlencoded'
    }))
  },

  // --- List page: tabs ---
  buildListTabs: function() {
    return getPhotographTabOptions()
  },

  // --- List page: normalize ---
  normalizeItem: function(item) {
    var rawItem = item || {}
    return {
      id: rawItem.id,
      title: rawItem.title || i18n.t('community.list.campusWork'),
      summary: rawItem.content || '',
      cover: rawItem.firstImageUrl || (rawItem.imageUrls && rawItem.imageUrls.length ? rawItem.imageUrls[0] : '/image/photograph.png'),
      likeCount: Number(rawItem.likeCount || 0),
      commentCount: Number(rawItem.commentCount || 0),
      timeText: rawItem.createTime || '',
      raw: rawItem
    }
  },

  // --- List page: build feed options ---
  buildFeedOptions: function(baseOptions, activeTab) {
    var options = Object.assign({}, baseOptions)
    options.type = activeTab ? Number(activeTab.feedValue) : 1
    return options
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
          title: item.title || i18n.t('community.list.campusWork'),
          subtitle: item.createTime || '',
          summary: item.content || '',
          cover: item.firstImageUrl || (item.imageUrls && item.imageUrls.length ? item.imageUrls[0] : '/image/photograph.png'),
          actions: []
        })
      })
    }
  },

  // --- Center page: show summary profile ---
  showSummaryProfile: false,

  searchable: false
}
