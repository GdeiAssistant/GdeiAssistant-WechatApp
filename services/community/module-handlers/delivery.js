const endpoints = require('../../endpoints.js')
const { request } = require('../../request.js')
const { encodeForm } = require('../../../utils/form.js')
const { maskAddress, maskPhone, maskPickupCode } = require('../../../utils/mask.js')
const i18n = require('../../../utils/i18n.js')
const {
  getDeliveryStatusOptions,
  getDeliveryDefaultOrderName,
  DELIVERY_PLACEHOLDER_PICKUP_CODE
} = require('../../../constants/community.js')

var DELIVERY_COMPANY_MAX_LENGTH = 10
var DELIVERY_ADDRESS_MAX_LENGTH = 50
var DELIVERY_REMARKS_MAX_LENGTH = 100
var CONTACT_PHONE_MAX_LENGTH = 11

function trimValue(value) {
  return String(value || '').trim()
}

function getMaxLengthMessage(value, maxLength, message) {
  return trimValue(value).length > maxLength ? message : ''
}

function getExactLengthMessage(value, expectedLength, message) {
  var normalizedValue = trimValue(value)
  if (!normalizedValue) {
    return ''
  }
  return normalizedValue.length !== expectedLength ? message : ''
}

function findLabel(options, value, fallback) {
  var item = (options || []).filter(function (optionItem) {
    return Number(optionItem.value) === Number(value)
  })[0]
  return item ? item.label : fallback || ''
}

function formatPrice(value) {
  var price = Number(value || 0)
  return price ? price.toFixed(2) : '0.00'
}

module.exports = {
  // --- Feed ---
  getFeed: function (options) {
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
  getDetail: function (id) {
    return request({
      url: endpoints.community.delivery.detail(id),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Center ---
  getCenter: function (options) {
    return request({
      url: endpoints.community.delivery.mine,
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
          url: endpoints.community.delivery.publish,
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
    return getDeliveryStatusOptions()
  },

  // --- List page: normalize ---
  normalizeItem: function (item) {
    var rawItem = item || {}
    return {
      id: rawItem.orderId,
      title: rawItem.company || i18n.t('community.list.campusErrand'),
      summary: maskAddress(rawItem.address || ''),
      priceText: formatPrice(rawItem.price),
      badgeText: findLabel(
        getDeliveryStatusOptions(),
        rawItem.state,
        i18n.t('community.list.task')
      ),
      metaText: rawItem.remarks || '',
      timeText: rawItem.orderTime || '',
      raw: rawItem
    }
  },

  // --- List page: build feed options ---
  buildFeedOptions: function (baseOptions) {
    return Object.assign({}, baseOptions)
  },

  // --- List page: filter feed results ---
  filterFeedResults: function (list, activeTab) {
    var statusValue = activeTab ? Number(activeTab.value) : -1
    if (statusValue >= 0) {
      return list.filter(function (item) {
        return Number(item.state) === statusValue
      })
    }
    return list
  },

  // --- Center page: tabs ---
  buildCenterTabs: function () {
    return [
      { key: 'published', label: i18n.t('community.center.tabMyPublished') },
      { key: 'accepted', label: i18n.t('community.center.tabMyAccepted') }
    ]
  },

  // --- Center page: normalize ---
  normalizeCenterData: function (payload, normalizeStandardItem) {
    return {
      published: (payload.published || []).map(function (item) {
        return normalizeStandardItem(item, {
          id: item.orderId,
          title: item.company || i18n.t('community.modules.delivery.title'),
          subtitle: item.orderTime,
          summary: maskAddress(item.address),
          priceText: Number(item.price || 0).toFixed(2),
          actions: []
        })
      }),
      accepted: (payload.accepted || []).map(function (item) {
        return normalizeStandardItem(item, {
          id: item.orderId,
          title: item.company || i18n.t('community.modules.delivery.title'),
          subtitle: item.orderTime,
          summary: maskAddress(item.address),
          priceText: Number(item.price || 0).toFixed(2),
          actions: []
        })
      })
    }
  },

  // --- Center page: show summary profile ---
  showSummaryProfile: false,

  searchable: false,

  // --- Publish: validate form ---
  validateForm: function (data) {
    var form = data.form || {}

    var pickupAddress = trimValue(form.pickupAddress)
    var pickupCode = trimValue(form.pickupCode)
    var deliveryAddress = trimValue(form.deliveryAddress)
    var contactPhone = trimValue(form.contactPhone)
    var description = trimValue(form.description)

    if (!pickupAddress) return i18n.t('community.publish.v.pickupRequired')
    if (
      getMaxLengthMessage(
        pickupAddress,
        DELIVERY_COMPANY_MAX_LENGTH,
        i18n.tReplace('community.publish.v.pickupTooLong', { max: DELIVERY_COMPANY_MAX_LENGTH })
      )
    )
      return getMaxLengthMessage(
        pickupAddress,
        DELIVERY_COMPANY_MAX_LENGTH,
        i18n.tReplace('community.publish.v.pickupTooLong', { max: DELIVERY_COMPANY_MAX_LENGTH })
      )
    if (getExactLengthMessage(pickupCode, 11, i18n.t('community.publish.v.pickupCodeLength')))
      return getExactLengthMessage(pickupCode, 11, i18n.t('community.publish.v.pickupCodeLength'))
    if (!deliveryAddress) return i18n.t('community.publish.v.deliveryAddrRequired')
    if (
      getMaxLengthMessage(
        deliveryAddress,
        DELIVERY_ADDRESS_MAX_LENGTH,
        i18n.tReplace('community.publish.v.deliveryAddrTooLong', {
          max: DELIVERY_ADDRESS_MAX_LENGTH
        })
      )
    )
      return getMaxLengthMessage(
        deliveryAddress,
        DELIVERY_ADDRESS_MAX_LENGTH,
        i18n.tReplace('community.publish.v.deliveryAddrTooLong', {
          max: DELIVERY_ADDRESS_MAX_LENGTH
        })
      )
    if (!contactPhone) return i18n.t('community.publish.v.phoneRequired')
    if (
      getMaxLengthMessage(
        contactPhone,
        CONTACT_PHONE_MAX_LENGTH,
        i18n.tReplace('community.publish.v.contactPhoneTooLong', { max: CONTACT_PHONE_MAX_LENGTH })
      )
    )
      return getMaxLengthMessage(
        contactPhone,
        CONTACT_PHONE_MAX_LENGTH,
        i18n.tReplace('community.publish.v.contactPhoneTooLong', { max: CONTACT_PHONE_MAX_LENGTH })
      )
    if (
      getMaxLengthMessage(
        description,
        DELIVERY_REMARKS_MAX_LENGTH,
        i18n.tReplace('community.publish.v.remarksTooLong', { max: DELIVERY_REMARKS_MAX_LENGTH })
      )
    )
      return getMaxLengthMessage(
        description,
        DELIVERY_REMARKS_MAX_LENGTH,
        i18n.tReplace('community.publish.v.remarksTooLong', { max: DELIVERY_REMARKS_MAX_LENGTH })
      )
    if (!(Number(form.reward || 0) > 0)) return i18n.t('community.publish.v.rewardInvalid')
    return ''
  },

  // --- Publish: build payload ---
  buildPublishPayload: function (data) {
    var form = data.form || {}

    return Promise.resolve({
      name: getDeliveryDefaultOrderName(),
      number: String(form.pickupCode || '').trim() || DELIVERY_PLACEHOLDER_PICKUP_CODE,
      phone: String(form.contactPhone || '').trim(),
      price: Number(form.reward || 0),
      company: String(form.pickupAddress || '').trim(),
      address: String(form.deliveryAddress || '').trim(),
      remarks: String(form.description || '').trim()
    })
  },

  // --- Detail: build detail view ---
  buildDetailView: function (payload) {
    var detailPayload = payload || {}
    var order = detailPayload.order || {}
    var detailType = Number(detailPayload.detailType)
    var canViewSensitiveInfo = detailType === 0 || detailType === 3
    var status = Number(order.state || 0)
    var trade = detailPayload.trade || null

    var roleTitle = ''
    if (detailType === 0) {
      roleTitle = i18n.t('community.detail.rolePublisher')
    } else if (detailType === 3) {
      roleTitle = i18n.t('community.detail.roleAcceptor')
    } else {
      roleTitle = i18n.t('community.detail.roleVisitor')
    }

    var statusDescription = ''
    if (status === 2) {
      statusDescription = i18n.t('community.detail.deliveryDesc2')
    } else if (detailType === 3) {
      statusDescription = i18n.t('community.detail.deliveryDesc13')
    } else if (detailType === 0 && status === 1) {
      statusDescription = i18n.t('community.detail.deliveryDesc10')
    } else if (status === 0) {
      statusDescription = i18n.t(
        detailType === 0 ? 'community.detail.deliveryDesc00' : 'community.detail.deliveryDesc01'
      )
    } else if (status === 1) {
      statusDescription = i18n.t('community.detail.deliveryDesc10')
    } else {
      statusDescription = i18n.t('community.detail.deliveryDesc2')
    }

    return {
      title: i18n.t('community.detail.detail'),
      description: order.remarks || '',
      publishTime: order.orderTime || '',
      pickupAddress: order.company || '',
      deliveryAddress: order.address || '',
      pickupAddressText: canViewSensitiveInfo
        ? String(order.company || '')
        : maskAddress(order.company || ''),
      deliveryAddressText: canViewSensitiveInfo
        ? String(order.address || '')
        : maskAddress(order.address || ''),
      pickupCodeText: order.number
        ? canViewSensitiveInfo
          ? String(order.number)
          : maskPickupCode(order.number)
        : '',
      phone: order.phone || '',
      phoneText: maskPhone(order.phone || ''),
      priceText: formatPrice(order.price),
      userRoleTitle: roleTitle,
      statusDescription: statusDescription,
      sensitiveHint: canViewSensitiveInfo ? '' : i18n.t('community.detail.contactMaskedHint'),
      canViewSensitiveInfo: canViewSensitiveInfo,
      canAccept: detailType === 1 && status === 0,
      canFinish: detailType === 0 && status === 1 && !!(trade && trade.tradeId),
      tradeId: trade && trade.tradeId ? trade.tradeId : null
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
