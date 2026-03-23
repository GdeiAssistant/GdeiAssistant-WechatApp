const endpoints = require('../../endpoints.js')
const { request } = require('../../request.js')
const { encodeForm } = require('../../../utils/form.js')
const i18n = require('../../../utils/i18n.js')
const {
  getSecondhandCategoryOptions
} = require('../../../constants/community.js')

function findLabel(options, value, fallback) {
  const item = (options || []).filter(function(optionItem) {
    return Number(optionItem.value) === Number(value) || Number(optionItem.feedValue) === Number(value)
  })[0]
  return item ? item.label : (fallback || '')
}

function formatPrice(value) {
  const price = Number(value || 0)
  return price ? price.toFixed(2) : '0.00'
}

module.exports = {
  // --- Feed ---
  getFeed: function(options) {
    var config = options || {}
    var start = Number(config.start || 0)
    var keyword = String(config.keyword || '').trim()

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
  },

  // --- Detail ---
  getDetail: function(id) {
    return request({
      url: endpoints.community.secondhand.detail(id),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Center ---
  getCenter: function() {
    return request({
      url: endpoints.community.secondhand.profile,
      method: 'GET',
      authRequired: true
    })
  },

  // --- Publish ---
  publish: function(payload) {
    return request(Object.assign({}, {
      url: endpoints.community.secondhand.publish,
      method: 'POST',
      authRequired: true,
      data: encodeForm(payload),
      contentType: 'application/x-www-form-urlencoded'
    }))
  },

  // --- List page: tabs ---
  buildListTabs: function() {
    return getSecondhandCategoryOptions()
  },

  // --- List page: normalize ---
  normalizeItem: function(item) {
    var rawItem = item || {}
    return {
      id: rawItem.id,
      title: rawItem.name || i18n.t('community.list.unnamedProduct'),
      summary: rawItem.description || '',
      cover: rawItem.pictureURL && rawItem.pictureURL.length ? rawItem.pictureURL[0] : '/image/ershou.png',
      priceText: formatPrice(rawItem.price),
      badgeText: findLabel(getSecondhandCategoryOptions(), rawItem.type, i18n.t('community.list.secondhand')),
      metaText: rawItem.location || '',
      timeText: rawItem.publishTime || '',
      raw: rawItem
    }
  },

  // --- List page: build feed options ---
  buildFeedOptions: function(baseOptions, activeTab) {
    var options = Object.assign({}, baseOptions)
    options.type = activeTab && Number(activeTab.value) >= 0 ? Number(activeTab.value) : null
    return options
  },

  // --- Center page: tabs ---
  buildCenterTabs: function() {
    return [
      { key: 'doing', label: i18n.t('community.center.tabSelling') },
      { key: 'sold', label: i18n.t('community.center.tabSold') },
      { key: 'off', label: i18n.t('community.center.tabOffShelf') }
    ]
  },

  // --- Center page: normalize ---
  normalizeCenterData: function(payload, normalizeStandardItem) {
    return {
      doing: (payload.doing || []).map(function(item) {
        return normalizeStandardItem(item, {
          id: item.id,
          title: item.name,
          subtitle: item.publishTime,
          summary: item.location,
          cover: item.pictureURL && item.pictureURL.length ? item.pictureURL[0] : '/image/ershou.png',
          priceText: Number(item.price || 0).toFixed(2),
          actions: [
            { id: 'edit', label: i18n.t('community.center.actionEdit') },
            { id: 'state:0', label: i18n.t('community.center.actionOffShelf') },
            { id: 'state:2', label: i18n.t('community.center.actionSold') }
          ]
        })
      }),
      sold: (payload.sold || []).map(function(item) {
        return normalizeStandardItem(item, {
          id: item.id,
          title: item.name,
          subtitle: item.publishTime,
          summary: item.location,
          cover: item.pictureURL && item.pictureURL.length ? item.pictureURL[0] : '/image/ershou.png',
          priceText: Number(item.price || 0).toFixed(2),
          actions: [],
          canOpenDetail: false
        })
      }),
      off: (payload.off || []).map(function(item) {
        return normalizeStandardItem(item, {
          id: item.id,
          title: item.name,
          subtitle: item.publishTime,
          summary: item.location,
          cover: item.pictureURL && item.pictureURL.length ? item.pictureURL[0] : '/image/ershou.png',
          priceText: Number(item.price || 0).toFixed(2),
          actions: [
            { id: 'edit', label: i18n.t('community.center.actionEdit') },
            { id: 'state:1', label: i18n.t('community.center.actionRelist') }
          ],
          canOpenDetail: false
        })
      })
    }
  },

  // --- Center page: show summary profile ---
  showSummaryProfile: true,

  searchable: true
}
