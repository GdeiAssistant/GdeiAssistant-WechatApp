const endpoints = require('../../endpoints.js')
const { request } = require('../../request.js')
const { encodeForm } = require('../../../utils/form.js')
const i18n = require('../../../utils/i18n.js')
const {
  getDeliveryStatusOptions
} = require('../../../constants/community.js')

function findLabel(options, value, fallback) {
  var item = (options || []).filter(function(optionItem) {
    return Number(optionItem.value) === Number(value)
  })[0]
  return item ? item.label : (fallback || '')
}

function formatPrice(value) {
  var price = Number(value || 0)
  return price ? price.toFixed(2) : '0.00'
}

module.exports = {
  // --- Feed ---
  getFeed: function(options) {
    var config = options || {}
    var start = Number(config.start || 0)
    var size = Number(config.size || 10)

    return request({
      url: endpoints.community.delivery.list(start, size),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Detail ---
  getDetail: function(id) {
    return request({
      url: endpoints.community.delivery.detail(id),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Center ---
  getCenter: function(options) {
    return request({
      url: endpoints.community.delivery.mine,
      method: 'GET',
      authRequired: true
    })
  },

  // --- Publish ---
  publish: function(payload) {
    return request(Object.assign({}, {
      url: endpoints.community.delivery.publish,
      method: 'POST',
      authRequired: true,
      data: encodeForm(payload),
      contentType: 'application/x-www-form-urlencoded'
    }))
  },

  // --- List page: tabs ---
  buildListTabs: function() {
    return getDeliveryStatusOptions()
  },

  // --- List page: normalize ---
  normalizeItem: function(item) {
    var rawItem = item || {}
    return {
      id: rawItem.orderId,
      title: rawItem.company || i18n.t('community.list.campusErrand'),
      summary: rawItem.address || '',
      priceText: formatPrice(rawItem.price),
      badgeText: findLabel(getDeliveryStatusOptions(), rawItem.state, i18n.t('community.list.task')),
      metaText: rawItem.remarks || '',
      timeText: rawItem.orderTime || '',
      raw: rawItem
    }
  },

  // --- List page: build feed options ---
  buildFeedOptions: function(baseOptions) {
    return Object.assign({}, baseOptions)
  },

  // --- List page: filter feed results ---
  filterFeedResults: function(list, activeTab) {
    var statusValue = activeTab ? Number(activeTab.value) : -1
    if (statusValue >= 0) {
      return list.filter(function(item) {
        return Number(item.state) === statusValue
      })
    }
    return list
  },

  // --- Center page: tabs ---
  buildCenterTabs: function() {
    return [
      { key: 'published', label: i18n.t('community.center.tabMyPublished') },
      { key: 'accepted', label: i18n.t('community.center.tabMyAccepted') }
    ]
  },

  // --- Center page: normalize ---
  normalizeCenterData: function(payload, normalizeStandardItem) {
    return {
      published: (payload.published || []).map(function(item) {
        return normalizeStandardItem(item, {
          id: item.orderId,
          title: item.company || i18n.t('community.modules.delivery.title'),
          subtitle: item.orderTime,
          summary: item.address,
          priceText: Number(item.price || 0).toFixed(2),
          actions: []
        })
      }),
      accepted: (payload.accepted || []).map(function(item) {
        return normalizeStandardItem(item, {
          id: item.orderId,
          title: item.company || i18n.t('community.modules.delivery.title'),
          subtitle: item.orderTime,
          summary: item.address,
          priceText: Number(item.price || 0).toFixed(2),
          actions: []
        })
      })
    }
  },

  // --- Center page: show summary profile ---
  showSummaryProfile: false,

  searchable: false
}
