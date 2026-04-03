const endpoints = require('../../endpoints.js')
const { request } = require('../../request.js')
const { encodeForm } = require('../../../utils/form.js')
const i18n = require('../../../utils/i18n.js')
const {
  getLostFoundModeDictionaryOptions,
  getLostFoundItemDictionaryOptions
} = require('../../../constants/community.js')

var LOST_FOUND_NAME_MAX_LENGTH = 25
var LOST_FOUND_DESCRIPTION_MAX_LENGTH = 100
var LOST_FOUND_LOCATION_MAX_LENGTH = 30
var LOST_FOUND_QQ_MAX_LENGTH = 20
var LOST_FOUND_WECHAT_MAX_LENGTH = 20
var CONTACT_PHONE_MAX_LENGTH = 11

function trimValue(value) {
  return String(value || '').trim()
}

function getMaxLengthMessage(value, maxLength, message) {
  return trimValue(value).length > maxLength ? message : ''
}

function findLabel(options, value, fallback) {
  const item = (options || []).filter(function (optionItem) {
    return (
      Number(optionItem.value) === Number(value) || Number(optionItem.feedValue) === Number(value)
    )
  })[0]
  return item ? item.label : fallback || ''
}

module.exports = {
  // --- Feed ---
  getFeed: function (options) {
    var config = options || {}
    var start = Number(config.start || 0)
    var keyword = String(config.keyword || '').trim()

    if (keyword) {
      return request(
        Object.assign(
          {},
          {
            url: endpoints.community.lostAndFound.search(config.mode || 0, start),
            method: 'POST',
            authRequired: true,
            data: encodeForm({ keyword: keyword }),
            contentType: 'application/x-www-form-urlencoded'
          }
        )
      )
    }
    return request({
      url:
        Number(config.mode || 0) === 0
          ? endpoints.community.lostAndFound.lost(start)
          : endpoints.community.lostAndFound.found(start),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Detail ---
  getDetail: function (id) {
    return request({
      url: endpoints.community.lostAndFound.detail(id),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Center ---
  getCenter: function () {
    return request({
      url: endpoints.community.lostAndFound.profile,
      method: 'GET',
      authRequired: true
    })
  },

  // --- Publish ---
  publish: function (payload) {
    return request(
      Object.assign(
        {},
        {
          url: endpoints.community.lostAndFound.publish,
          method: 'POST',
          authRequired: true,
          data: encodeForm(payload),
          contentType: 'application/x-www-form-urlencoded'
        }
      )
    )
  },

  // --- List page: tabs ---
  buildListTabs: function () {
    return getLostFoundModeDictionaryOptions()
  },

  // --- List page: normalize ---
  normalizeItem: function (item) {
    var rawItem = item || {}
    return {
      id: rawItem.id,
      title: rawItem.name || i18n.t('community.list.unnamedItem'),
      summary: rawItem.description || '',
      cover:
        rawItem.pictureURL && rawItem.pictureURL.length
          ? rawItem.pictureURL[0]
          : '/image/lostandfound.png',
      badgeText:
        Number(rawItem.lostType) === 0
          ? i18n.t('community.list.lost')
          : i18n.t('community.list.found'),
      subBadgeText: findLabel(
        getLostFoundItemDictionaryOptions(),
        rawItem.itemType,
        i18n.t('community.category.other')
      ),
      metaText: rawItem.location || '',
      timeText: rawItem.publishTime || '',
      raw: rawItem
    }
  },

  // --- List page: build feed options ---
  buildFeedOptions: function (baseOptions, activeTab) {
    var options = Object.assign({}, baseOptions)
    options.mode = activeTab ? Number(activeTab.value) : 0
    return options
  },

  // --- Center page: tabs ---
  buildCenterTabs: function () {
    return [
      { key: 'lost', label: i18n.t('community.center.tabLost') },
      { key: 'found', label: i18n.t('community.center.tabFound') },
      { key: 'didfound', label: i18n.t('community.center.tabRecovered') }
    ]
  },

  // --- Center page: normalize ---
  normalizeCenterData: function (payload, normalizeStandardItem) {
    return {
      lost: (payload.lost || []).map(function (item) {
        return normalizeStandardItem(item, {
          id: item.id,
          title: item.name,
          subtitle: item.publishTime,
          summary: item.location,
          cover:
            item.pictureURL && item.pictureURL.length
              ? item.pictureURL[0]
              : '/image/lostandfound.png',
          actions: [
            { id: 'edit', label: i18n.t('community.center.actionEdit') },
            { id: 'didfound', label: i18n.t('community.center.actionConfirmFound') }
          ]
        })
      }),
      found: (payload.found || []).map(function (item) {
        return normalizeStandardItem(item, {
          id: item.id,
          title: item.name,
          subtitle: item.publishTime,
          summary: item.location,
          cover:
            item.pictureURL && item.pictureURL.length
              ? item.pictureURL[0]
              : '/image/lostandfound.png',
          actions: [
            { id: 'edit', label: i18n.t('community.center.actionEdit') },
            { id: 'didfound', label: i18n.t('community.center.actionConfirmFound') }
          ]
        })
      }),
      didfound: (payload.didfound || []).map(function (item) {
        return normalizeStandardItem(item, {
          id: item.id,
          title: item.name,
          subtitle: item.publishTime,
          summary: item.location,
          cover:
            item.pictureURL && item.pictureURL.length
              ? item.pictureURL[0]
              : '/image/lostandfound.png',
          actions: [],
          canOpenDetail: false
        })
      })
    }
  },

  // --- Center page: show summary profile ---
  showSummaryProfile: true,

  searchable: true,

  // --- Publish: validate form ---
  validateForm: function (data) {
    var form = data.form || {}
    var isEditMode = data.isEditMode
    var images = data.images || []

    var name = trimValue(form.name)
    var description = trimValue(form.description)
    var location = trimValue(form.location)
    var qq = trimValue(form.qq)
    var wechat = trimValue(form.wechat)
    var phone = trimValue(form.phone)

    if (!name) return i18n.t('community.publish.v.itemNameRequired')
    if (
      getMaxLengthMessage(
        name,
        LOST_FOUND_NAME_MAX_LENGTH,
        i18n.tReplace('community.publish.v.itemNameTooLong', { max: LOST_FOUND_NAME_MAX_LENGTH })
      )
    )
      return getMaxLengthMessage(
        name,
        LOST_FOUND_NAME_MAX_LENGTH,
        i18n.tReplace('community.publish.v.itemNameTooLong', { max: LOST_FOUND_NAME_MAX_LENGTH })
      )
    if (!description) return i18n.t('community.publish.v.itemDescRequired')
    if (
      getMaxLengthMessage(
        description,
        LOST_FOUND_DESCRIPTION_MAX_LENGTH,
        i18n.tReplace('community.publish.v.itemDescTooLong', {
          max: LOST_FOUND_DESCRIPTION_MAX_LENGTH
        })
      )
    )
      return getMaxLengthMessage(
        description,
        LOST_FOUND_DESCRIPTION_MAX_LENGTH,
        i18n.tReplace('community.publish.v.itemDescTooLong', {
          max: LOST_FOUND_DESCRIPTION_MAX_LENGTH
        })
      )
    if (!location) return i18n.t('community.publish.v.locationRequired2')
    if (
      getMaxLengthMessage(
        location,
        LOST_FOUND_LOCATION_MAX_LENGTH,
        i18n.tReplace('community.publish.v.locationTooLong2', {
          max: LOST_FOUND_LOCATION_MAX_LENGTH
        })
      )
    )
      return getMaxLengthMessage(
        location,
        LOST_FOUND_LOCATION_MAX_LENGTH,
        i18n.tReplace('community.publish.v.locationTooLong2', {
          max: LOST_FOUND_LOCATION_MAX_LENGTH
        })
      )
    if (
      getMaxLengthMessage(
        qq,
        LOST_FOUND_QQ_MAX_LENGTH,
        i18n.tReplace('community.publish.v.qqTooLong2', { max: LOST_FOUND_QQ_MAX_LENGTH })
      )
    )
      return getMaxLengthMessage(
        qq,
        LOST_FOUND_QQ_MAX_LENGTH,
        i18n.tReplace('community.publish.v.qqTooLong2', { max: LOST_FOUND_QQ_MAX_LENGTH })
      )
    if (
      getMaxLengthMessage(
        wechat,
        LOST_FOUND_WECHAT_MAX_LENGTH,
        i18n.tReplace('community.publish.v.wechatTooLong', { max: LOST_FOUND_WECHAT_MAX_LENGTH })
      )
    )
      return getMaxLengthMessage(
        wechat,
        LOST_FOUND_WECHAT_MAX_LENGTH,
        i18n.tReplace('community.publish.v.wechatTooLong', { max: LOST_FOUND_WECHAT_MAX_LENGTH })
      )
    if (
      getMaxLengthMessage(
        phone,
        CONTACT_PHONE_MAX_LENGTH,
        i18n.tReplace('community.publish.v.phoneTooLong2', { max: CONTACT_PHONE_MAX_LENGTH })
      )
    )
      return getMaxLengthMessage(
        phone,
        CONTACT_PHONE_MAX_LENGTH,
        i18n.tReplace('community.publish.v.phoneTooLong2', { max: CONTACT_PHONE_MAX_LENGTH })
      )
    if (!qq && !wechat && !phone) {
      return i18n.t('community.publish.v.contactRequired')
    }
    if (!isEditMode && !images.length) return i18n.t('community.publish.v.imageRequired')
    return ''
  },

  // --- Publish: build payload ---
  buildPublishPayload: function (data, uploadFiles) {
    var form = data.form || {}
    var isEditMode = data.isEditMode
    var images = data.images || []
    var lostFoundModeOptions = data.lostFoundModeOptions || []
    var lostFoundModeIndex = data.lostFoundModeIndex || 0
    var lostFoundItemOptions = data.lostFoundItemOptions || []
    var lostFoundItemIndex = data.lostFoundItemIndex || 0

    if (isEditMode) {
      return Promise.resolve({
        name: String(form.name || '').trim(),
        description: String(form.description || '').trim(),
        location: String(form.location || '').trim(),
        lostType: lostFoundModeOptions[lostFoundModeIndex].value,
        itemType: lostFoundItemOptions[lostFoundItemIndex].value,
        qq: String(form.qq || '').trim(),
        wechat: String(form.wechat || '').trim(),
        phone: String(form.phone || '').trim()
      })
    }
    return uploadFiles(images).then(function (imageKeys) {
      return {
        name: String(form.name || '').trim(),
        description: String(form.description || '').trim(),
        location: String(form.location || '').trim(),
        lostType: lostFoundModeOptions[lostFoundModeIndex].value,
        itemType: lostFoundItemOptions[lostFoundItemIndex].value,
        qq: String(form.qq || '').trim(),
        wechat: String(form.wechat || '').trim(),
        phone: String(form.phone || '').trim(),
        imageKeys: imageKeys
      }
    })
  },

  // --- Detail: build detail view ---
  buildDetailView: function (payload) {
    var item = payload.item || {}
    var profile = payload.profile || {}
    var locationLabel =
      Number(item.lostType) === 0
        ? i18n.t('community.detail.lostLocation')
        : i18n.t('community.detail.foundLocation')
    return {
      images: item.pictureURL || [],
      title: item.name || i18n.t('community.detail.lostDetail'),
      subtitle: locationLabel + '\uff1a' + (item.location || i18n.t('community.detail.notFilled')),
      description: item.description || '',
      publishTime: item.publishTime || '',
      sellerName: profile.nickname || profile.username || i18n.t('community.list.anonStudent'),
      sellerAvatar: profile.avatarURL || '/image/default.png',
      qq: item.qq || '',
      wechat: item.wechat || '',
      phone: item.phone || '',
      typeLabel: findLabel(
        getLostFoundItemDictionaryOptions(),
        item.itemType,
        i18n.t('community.category.other')
      ),
      badgeText:
        Number(item.lostType) === 0
          ? i18n.t('community.lostFoundMode.lostNotice')
          : i18n.t('community.lostFoundMode.foundNotice'),
      canLike: false
    }
  },

  // --- Comments ---
  getComments: function () {
    return Promise.resolve({ success: true, data: [] })
  },

  // --- Submit comment ---
  submitComment: function () {
    return Promise.reject(new Error(i18n.t('community.common.commentUnsupported')))
  },

  // --- Toggle like ---
  toggleLike: function () {
    return Promise.reject(new Error(i18n.t('community.common.likeUnsupported')))
  }
}
