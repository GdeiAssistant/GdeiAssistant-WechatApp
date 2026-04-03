const endpoints = require('../../endpoints.js')
const { request } = require('../../request.js')
const { encodeForm } = require('../../../utils/form.js')
const i18n = require('../../../utils/i18n.js')

function requestForm(options) {
  return request(
    Object.assign({}, options, {
      contentType: 'application/x-www-form-urlencoded'
    })
  )
}

function formatSecretPublishText(publishTime, timer) {
  const baseText = String(publishTime || '').trim()
  if (Number(timer) === 1) {
    var autoDeleteText = i18n.t('community.list.autoDelete24h')
    return baseText ? baseText + ' \u00b7 ' + autoDeleteText : autoDeleteText
  }
  return baseText
}

module.exports = {
  // --- Feed ---
  getFeed: function (options) {
    var config = options || {}
    var start = Number(config.start || 0)
    var size = Number(config.size || 10)

    return request({
      url: endpoints.community.secret.list(start, size),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Detail ---
  getDetail: function (id) {
    return request({
      url: endpoints.community.secret.detail(id),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Center ---
  getCenter: function (options) {
    var config = options || {}
    var start = Number(config.start || 0)
    var size = Number(config.size || 20)

    return request({
      url: endpoints.community.secret.profilePaged(start, size),
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
          url: endpoints.community.secret.publish,
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
    return []
  },

  // --- List page: normalize ---
  normalizeItem: function (item) {
    var rawItem = item || {}
    return {
      id: rawItem.id,
      title:
        Number(rawItem.type) === 1
          ? i18n.t('community.list.voiceSecret')
          : i18n.t('community.list.anonSecret'),
      summary:
        Number(rawItem.type) === 1
          ? i18n.t('community.list.tapVoiceSecret')
          : rawItem.content || '',
      likeCount: Number(rawItem.likeCount || 0),
      commentCount: Number(rawItem.commentCount || 0),
      timeText: formatSecretPublishText(rawItem.publishTime, rawItem.timer),
      raw: rawItem
    }
  },

  // --- List page: build feed options ---
  buildFeedOptions: function (baseOptions) {
    return Object.assign({}, baseOptions)
  },

  // --- Center page: tabs ---
  buildCenterTabs: function () {
    return []
  },

  // --- Center page: normalize ---
  normalizeCenterData: function (payload, normalizeStandardItem) {
    return {
      default: (payload || []).map(function (item) {
        return normalizeStandardItem(item, {
          id: item.id,
          title:
            Number(item.type) === 1
              ? i18n.t('community.center.voiceSecret')
              : i18n.t('community.center.textSecret'),
          subtitle: formatSecretPublishText(item.publishTime, item.timer),
          summary: Number(item.type) === 1 ? i18n.t('community.center.tapPlayVoice') : item.content,
          actions: []
        })
      })
    }
  },

  // --- Center page: show summary profile ---
  showSummaryProfile: false,

  searchable: false,

  // --- Publish: validate form ---
  validateForm: function () {
    return i18n.t('community.publish.v.moduleNotSupported')
  },

  // --- Publish: build payload ---
  buildPublishPayload: function () {
    return Promise.reject(new Error(i18n.t('community.publish.v.moduleNotSupported')))
  },

  // --- Detail: build detail view ---
  buildDetailView: function () {
    return {
      title: i18n.t('community.detail.detail'),
      description: ''
    }
  },

  // --- Comments ---
  getComments: function (id) {
    return request({
      url: endpoints.community.secret.comments(id),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Submit comment ---
  submitComment: function (id, comment) {
    return requestForm({
      url: endpoints.community.secret.comment(id),
      method: 'POST',
      authRequired: true,
      data: encodeForm({ comment: comment })
    })
  },

  // --- Toggle like ---
  toggleLike: function (id, value) {
    return requestForm({
      url: endpoints.community.secret.like(id),
      method: 'POST',
      authRequired: true,
      data: encodeForm({ like: value ? 1 : 0 })
    })
  }
}
