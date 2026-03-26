const endpoints = require('../../endpoints.js')
const { request } = require('../../request.js')
const { encodeForm } = require('../../../utils/form.js')
const i18n = require('../../../utils/i18n.js')
const {
  getSecondhandCategoryOptions
} = require('../../../constants/community.js')

var SECONDHAND_NAME_MAX_LENGTH = 25
var SECONDHAND_DESCRIPTION_MAX_LENGTH = 100
var SECONDHAND_LOCATION_MAX_LENGTH = 30
var SECONDHAND_QQ_MAX_LENGTH = 20
var CONTACT_PHONE_MAX_LENGTH = 11

function trimValue(value) {
  return String(value || '').trim()
}

function getMaxLengthMessage(value, maxLength, message) {
  return trimValue(value).length > maxLength ? message : ''
}

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

  searchable: true,

  // --- Publish: validate form ---
  validateForm: function(data) {
    var form = data.form || {}
    var isEditMode = data.isEditMode
    var images = data.images || []

    var name = trimValue(form.name)
    var description = trimValue(form.description)
    var location = trimValue(form.location)
    var qq = trimValue(form.qq)
    var phone = trimValue(form.phone)

    if (!name) return i18n.t('community.publish.v.productNameRequired')
    if (getMaxLengthMessage(name, SECONDHAND_NAME_MAX_LENGTH, i18n.tReplace('community.publish.v.productNameTooLong', { max: SECONDHAND_NAME_MAX_LENGTH }))) return getMaxLengthMessage(name, SECONDHAND_NAME_MAX_LENGTH, i18n.tReplace('community.publish.v.productNameTooLong', { max: SECONDHAND_NAME_MAX_LENGTH }))
    if (!description) return i18n.t('community.publish.v.productDescRequired')
    if (getMaxLengthMessage(description, SECONDHAND_DESCRIPTION_MAX_LENGTH, i18n.tReplace('community.publish.v.productDescTooLong', { max: SECONDHAND_DESCRIPTION_MAX_LENGTH }))) return getMaxLengthMessage(description, SECONDHAND_DESCRIPTION_MAX_LENGTH, i18n.tReplace('community.publish.v.productDescTooLong', { max: SECONDHAND_DESCRIPTION_MAX_LENGTH }))
    if (!(Number(form.price || 0) > 0)) return i18n.t('community.publish.v.priceInvalid')
    if (!location) return i18n.t('community.publish.v.locationRequired')
    if (getMaxLengthMessage(location, SECONDHAND_LOCATION_MAX_LENGTH, i18n.tReplace('community.publish.v.locationTooLong', { max: SECONDHAND_LOCATION_MAX_LENGTH }))) return getMaxLengthMessage(location, SECONDHAND_LOCATION_MAX_LENGTH, i18n.tReplace('community.publish.v.locationTooLong', { max: SECONDHAND_LOCATION_MAX_LENGTH }))
    if (!qq) return i18n.t('community.publish.v.qqRequired')
    if (getMaxLengthMessage(qq, SECONDHAND_QQ_MAX_LENGTH, i18n.tReplace('community.publish.v.qqTooLong', { max: SECONDHAND_QQ_MAX_LENGTH }))) return getMaxLengthMessage(qq, SECONDHAND_QQ_MAX_LENGTH, i18n.tReplace('community.publish.v.qqTooLong', { max: SECONDHAND_QQ_MAX_LENGTH }))
    if (getMaxLengthMessage(phone, CONTACT_PHONE_MAX_LENGTH, i18n.tReplace('community.publish.v.phoneTooLong', { max: CONTACT_PHONE_MAX_LENGTH }))) return getMaxLengthMessage(phone, CONTACT_PHONE_MAX_LENGTH, i18n.tReplace('community.publish.v.phoneTooLong', { max: CONTACT_PHONE_MAX_LENGTH }))
    if (!isEditMode && !images.length) return i18n.t('community.publish.v.imageRequired')
    return ''
  },

  // --- Publish: build payload ---
  buildPublishPayload: function(data, uploadFiles) {
    var form = data.form || {}
    var isEditMode = data.isEditMode
    var images = data.images || []
    var secondhandTypeOptions = data.secondhandTypeOptions || []
    var secondhandTypeIndex = data.secondhandTypeIndex || 0

    if (isEditMode) {
      return Promise.resolve({
        name: String(form.name || '').trim(),
        description: String(form.description || '').trim(),
        price: Number(form.price || 0),
        location: String(form.location || '').trim(),
        type: secondhandTypeOptions[secondhandTypeIndex].value,
        qq: String(form.qq || '').trim(),
        phone: String(form.phone || '').trim()
      })
    }
    return uploadFiles(images).then(function(imageKeys) {
      return {
        name: String(form.name || '').trim(),
        description: String(form.description || '').trim(),
        price: Number(form.price || 0),
        location: String(form.location || '').trim(),
        type: secondhandTypeOptions[secondhandTypeIndex].value,
        qq: String(form.qq || '').trim(),
        phone: String(form.phone || '').trim(),
        imageKeys: imageKeys
      }
    })
  },

  // --- Detail: build detail view ---
  buildDetailView: function(payload) {
    var item = payload.secondhandItem || {}
    var profile = payload.profile || {}
    return {
      images: item.pictureURL || [],
      title: item.name || i18n.t('community.detail.productDetail'),
      subtitle: item.location || '',
      description: item.description || '',
      priceText: Number(item.price || 0).toFixed(2),
      publishTime: item.publishTime || '',
      sellerName: profile.nickname || profile.username || i18n.t('community.list.anonStudent'),
      sellerAvatar: profile.avatarURL || '/image/default.png',
      qq: item.qq || '',
      wechat: '',
      phone: item.phone || '',
      canLike: false
    }
  },

  // --- Comments ---
  getComments: function() {
    return Promise.resolve({ success: true, data: [] })
  },

  // --- Submit comment ---
  submitComment: function() {
    return Promise.reject(new Error(i18n.t('community.common.commentUnsupported')))
  },

  // --- Toggle like ---
  toggleLike: function() {
    return Promise.reject(new Error(i18n.t('community.common.likeUnsupported')))
  }
}
