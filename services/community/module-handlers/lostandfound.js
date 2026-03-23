const endpoints = require('../../endpoints.js')
const { request } = require('../../request.js')
const { encodeForm } = require('../../../utils/form.js')
const i18n = require('../../../utils/i18n.js')
const {
  getLostFoundModeDictionaryOptions,
  getLostFoundItemDictionaryOptions
} = require('../../../constants/community.js')

function findLabel(options, value, fallback) {
  const item = (options || []).filter(function(optionItem) {
    return Number(optionItem.value) === Number(value) || Number(optionItem.feedValue) === Number(value)
  })[0]
  return item ? item.label : (fallback || '')
}

module.exports = {
  // --- Feed ---
  getFeed: function(options) {
    var config = options || {}
    var start = Number(config.start || 0)
    var keyword = String(config.keyword || '').trim()

    if (keyword) {
      return request(Object.assign({}, {
        url: endpoints.community.lostAndFound.search(config.mode || 0, start),
        method: 'POST',
        authRequired: true,
        data: encodeForm({ keyword: keyword }),
        contentType: 'application/x-www-form-urlencoded'
      }))
    }
    return request({
      url: Number(config.mode || 0) === 0
        ? endpoints.community.lostAndFound.lost(start)
        : endpoints.community.lostAndFound.found(start),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Detail ---
  getDetail: function(id) {
    return request({
      url: endpoints.community.lostAndFound.detail(id),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Center ---
  getCenter: function() {
    return request({
      url: endpoints.community.lostAndFound.profile,
      method: 'GET',
      authRequired: true
    })
  },

  // --- Publish ---
  publish: function(payload) {
    return request(Object.assign({}, {
      url: endpoints.community.lostAndFound.publish,
      method: 'POST',
      authRequired: true,
      data: encodeForm(payload),
      contentType: 'application/x-www-form-urlencoded'
    }))
  },

  // --- List page: tabs ---
  buildListTabs: function() {
    return getLostFoundModeDictionaryOptions()
  },

  // --- List page: normalize ---
  normalizeItem: function(item) {
    var rawItem = item || {}
    return {
      id: rawItem.id,
      title: rawItem.name || i18n.t('community.list.unnamedItem'),
      summary: rawItem.description || '',
      cover: rawItem.pictureURL && rawItem.pictureURL.length ? rawItem.pictureURL[0] : '/image/lostandfound.png',
      badgeText: Number(rawItem.lostType) === 0 ? i18n.t('community.list.lost') : i18n.t('community.list.found'),
      subBadgeText: findLabel(getLostFoundItemDictionaryOptions(), rawItem.itemType, i18n.t('community.category.other')),
      metaText: rawItem.location || '',
      timeText: rawItem.publishTime || '',
      raw: rawItem
    }
  },

  // --- List page: build feed options ---
  buildFeedOptions: function(baseOptions, activeTab) {
    var options = Object.assign({}, baseOptions)
    options.mode = activeTab ? Number(activeTab.value) : 0
    return options
  },

  // --- Center page: tabs ---
  buildCenterTabs: function() {
    return [
      { key: 'lost', label: i18n.t('community.center.tabLost') },
      { key: 'found', label: i18n.t('community.center.tabFound') },
      { key: 'didfound', label: i18n.t('community.center.tabRecovered') }
    ]
  },

  // --- Center page: normalize ---
  normalizeCenterData: function(payload, normalizeStandardItem) {
    return {
      lost: (payload.lost || []).map(function(item) {
        return normalizeStandardItem(item, {
          id: item.id,
          title: item.name,
          subtitle: item.publishTime,
          summary: item.location,
          cover: item.pictureURL && item.pictureURL.length ? item.pictureURL[0] : '/image/lostandfound.png',
          actions: [
            { id: 'edit', label: i18n.t('community.center.actionEdit') },
            { id: 'didfound', label: i18n.t('community.center.actionConfirmFound') }
          ]
        })
      }),
      found: (payload.found || []).map(function(item) {
        return normalizeStandardItem(item, {
          id: item.id,
          title: item.name,
          subtitle: item.publishTime,
          summary: item.location,
          cover: item.pictureURL && item.pictureURL.length ? item.pictureURL[0] : '/image/lostandfound.png',
          actions: [
            { id: 'edit', label: i18n.t('community.center.actionEdit') },
            { id: 'didfound', label: i18n.t('community.center.actionConfirmFound') }
          ]
        })
      }),
      didfound: (payload.didfound || []).map(function(item) {
        return normalizeStandardItem(item, {
          id: item.id,
          title: item.name,
          subtitle: item.publishTime,
          summary: item.location,
          cover: item.pictureURL && item.pictureURL.length ? item.pictureURL[0] : '/image/lostandfound.png',
          actions: [],
          canOpenDetail: false
        })
      })
    }
  },

  // --- Center page: show summary profile ---
  showSummaryProfile: true,

  searchable: true
}
