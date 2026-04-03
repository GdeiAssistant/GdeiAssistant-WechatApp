const endpoints = require('../../endpoints.js')
const { request } = require('../../request.js')
const { encodeForm } = require('../../../utils/form.js')
const i18n = require('../../../utils/i18n.js')
const { getDatingAreaOptions, getDatingGradeOptions } = require('../../../constants/community.js')

var DATING_NICKNAME_MAX_LENGTH = 15
var DATING_FACULTY_MAX_LENGTH = 12
var DATING_HOMETOWN_MAX_LENGTH = 10
var DATING_QQ_MAX_LENGTH = 15
var DATING_WECHAT_MAX_LENGTH = 20
var DATING_CONTENT_MAX_LENGTH = 100

function trimValue(value) {
  return String(value || '').trim()
}

function getMaxLengthMessage(value, maxLength, message) {
  return trimValue(value).length > maxLength ? message : ''
}

function findLabel(options, value, fallback) {
  var item = (options || []).filter(function (optionItem) {
    return Number(optionItem.value) === Number(value)
  })[0]
  return item ? item.label : fallback || ''
}

module.exports = {
  // --- Feed ---
  getFeed: function (options) {
    var config = options || {}
    var start = Number(config.start || 0)
    var area = Number(config.area || 0)

    return request({
      url: endpoints.community.dating.list(area, start),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Detail ---
  getDetail: function (id) {
    return request({
      url: endpoints.community.dating.detail(id),
      method: 'GET',
      authRequired: true
    })
  },

  // --- Center ---
  getCenter: function (options) {
    return Promise.all([
      request({
        url: endpoints.community.dating.mine,
        method: 'GET',
        authRequired: true
      }),
      request({
        url: endpoints.community.dating.picks.sent,
        method: 'GET',
        authRequired: true
      }),
      request({
        url: endpoints.community.dating.picks.received,
        method: 'GET',
        authRequired: true
      })
    ])
      .then(function (resultList) {
        return {
          success: true,
          data: {
            profiles: resultList[0].data || [],
            sent: resultList[1].data || [],
            received: resultList[2].data || []
          }
        }
      })
      .catch(function () {
        return { success: false, data: { profiles: [], sent: [], received: [] } }
      })
  },

  // --- Publish ---
  publish: function (payload) {
    return request(
      Object.assign(
        {},
        {
          url: endpoints.community.dating.publish,
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
    return getDatingAreaOptions()
  },

  // --- List page: normalize ---
  normalizeItem: function (item) {
    var rawItem = item || {}
    return {
      id: rawItem.profileId,
      title: rawItem.nickname || i18n.t('community.list.anonStudent'),
      summary: rawItem.content || '',
      cover: rawItem.pictureURL || '/image/dating.png',
      badgeText: findLabel(
        getDatingGradeOptions(),
        rawItem.grade,
        i18n.t('community.list.unknownGrade')
      ),
      metaText: rawItem.faculty || '',
      timeText: rawItem.hometown || '',
      raw: rawItem
    }
  },

  // --- List page: build feed options ---
  buildFeedOptions: function (baseOptions, activeTab) {
    var options = Object.assign({}, baseOptions)
    options.area = activeTab ? Number(activeTab.value) : 0
    return options
  },

  // --- Center page: tabs ---
  buildCenterTabs: function () {
    return [
      { key: 'received', label: i18n.t('community.center.tabReceivedPick') },
      { key: 'sent', label: i18n.t('community.center.tabSentPick') },
      { key: 'posts', label: i18n.t('community.center.tabMyPosts') }
    ]
  },

  // --- Center page: normalize ---
  normalizeCenterData: function (payload, normalizeStandardItem) {
    return {
      received: (payload.received || []).map(function (item) {
        var profile = item.roommateProfile || {}
        return {
          id: item.pickId,
          title: profile.nickname || item.username || i18n.t('community.list.anonStudent'),
          subtitle: item.createTime || '',
          summary: item.content || '',
          cover: profile.pictureURL || '/image/dating.png',
          status: Number(item.state || 0),
          actions:
            Number(item.state || 0) === 0
              ? [
                  { id: 'acceptPick', label: i18n.t('community.center.actionAccept') },
                  { id: 'rejectPick', label: i18n.t('community.center.actionReject') }
                ]
              : []
        }
      }),
      sent: (payload.sent || []).map(function (item) {
        var profile = item.roommateProfile || {}
        return {
          id: item.pickId,
          title: profile.nickname || i18n.t('community.list.anonStudent'),
          subtitle: item.createTime || '',
          summary: item.content || '',
          cover: profile.pictureURL || '/image/dating.png',
          status: Number(item.state || 0),
          qq: Number(item.state || 0) === 1 ? profile.qq || '' : '',
          wechat: Number(item.state || 0) === 1 ? profile.wechat || '' : '',
          actions: []
        }
      }),
      posts: (payload.profiles || []).map(function (item) {
        return {
          id: item.profileId,
          title: item.nickname || i18n.t('community.modules.dating.title'),
          subtitle: item.createTime || '',
          summary: item.content || '',
          cover: item.pictureURL || '/image/dating.png',
          status: Number(item.state || 0),
          actions: [{ id: 'hideProfile', label: i18n.t('community.center.actionHide') }]
        }
      })
    }
  },

  // --- Center page: show summary profile ---
  showSummaryProfile: false,

  searchable: false,

  // --- Publish: validate form ---
  validateForm: function (data) {
    var form = data.form || {}

    var nickname = trimValue(form.nickname)
    var faculty = trimValue(form.faculty)
    var hometown = trimValue(form.hometown)
    var qq = trimValue(form.qq)
    var wechat = trimValue(form.wechat)
    var content = trimValue(form.content)

    if (!nickname) return i18n.t('community.publish.v.nicknameRequired')
    if (
      getMaxLengthMessage(
        nickname,
        DATING_NICKNAME_MAX_LENGTH,
        i18n.tReplace('community.publish.v.nicknameTooLong', { max: DATING_NICKNAME_MAX_LENGTH })
      )
    )
      return getMaxLengthMessage(
        nickname,
        DATING_NICKNAME_MAX_LENGTH,
        i18n.tReplace('community.publish.v.nicknameTooLong', { max: DATING_NICKNAME_MAX_LENGTH })
      )
    if (!faculty) return i18n.t('community.publish.v.majorRequired')
    if (
      getMaxLengthMessage(
        faculty,
        DATING_FACULTY_MAX_LENGTH,
        i18n.tReplace('community.publish.v.majorTooLong', { max: DATING_FACULTY_MAX_LENGTH })
      )
    )
      return getMaxLengthMessage(
        faculty,
        DATING_FACULTY_MAX_LENGTH,
        i18n.tReplace('community.publish.v.majorTooLong', { max: DATING_FACULTY_MAX_LENGTH })
      )
    if (!hometown) return i18n.t('community.publish.v.hometownRequired')
    if (
      getMaxLengthMessage(
        hometown,
        DATING_HOMETOWN_MAX_LENGTH,
        i18n.tReplace('community.publish.v.hometownTooLong', { max: DATING_HOMETOWN_MAX_LENGTH })
      )
    )
      return getMaxLengthMessage(
        hometown,
        DATING_HOMETOWN_MAX_LENGTH,
        i18n.tReplace('community.publish.v.hometownTooLong', { max: DATING_HOMETOWN_MAX_LENGTH })
      )
    if (
      getMaxLengthMessage(
        qq,
        DATING_QQ_MAX_LENGTH,
        i18n.tReplace('community.publish.v.qqTooLong2', { max: DATING_QQ_MAX_LENGTH })
      )
    )
      return getMaxLengthMessage(
        qq,
        DATING_QQ_MAX_LENGTH,
        i18n.tReplace('community.publish.v.qqTooLong2', { max: DATING_QQ_MAX_LENGTH })
      )
    if (
      getMaxLengthMessage(
        wechat,
        DATING_WECHAT_MAX_LENGTH,
        i18n.tReplace('community.publish.v.wechatTooLong', { max: DATING_WECHAT_MAX_LENGTH })
      )
    )
      return getMaxLengthMessage(
        wechat,
        DATING_WECHAT_MAX_LENGTH,
        i18n.tReplace('community.publish.v.wechatTooLong', { max: DATING_WECHAT_MAX_LENGTH })
      )
    if (!qq && !wechat) {
      return i18n.t('community.publish.v.qqWechatRequired')
    }
    if (!content) return i18n.t('community.publish.v.introRequired')
    if (
      getMaxLengthMessage(
        content,
        DATING_CONTENT_MAX_LENGTH,
        i18n.tReplace('community.publish.v.introTooLong', { max: DATING_CONTENT_MAX_LENGTH })
      )
    )
      return getMaxLengthMessage(
        content,
        DATING_CONTENT_MAX_LENGTH,
        i18n.tReplace('community.publish.v.introTooLong', { max: DATING_CONTENT_MAX_LENGTH })
      )
    return ''
  },

  // --- Publish: build payload ---
  buildPublishPayload: function (data, _uploadFiles, uploadSingleFile) {
    var form = data.form || {}
    var images = data.images || []
    var datingGradeOptions = data.datingGradeOptions || []
    var datingGradeIndex = data.datingGradeIndex || 0
    var datingAreaOptions = data.datingAreaOptions || []
    var datingAreaIndex = data.datingAreaIndex || 0

    return (images.length ? uploadSingleFile(images[0]) : Promise.resolve('')).then(
      function (imageKey) {
        return {
          nickname: String(form.nickname || '').trim(),
          grade: datingGradeOptions[datingGradeIndex].value,
          area: datingAreaOptions[datingAreaIndex].value,
          faculty: String(form.faculty || '').trim(),
          hometown: String(form.hometown || '').trim(),
          qq: String(form.qq || '').trim(),
          wechat: String(form.wechat || '').trim(),
          content: String(form.content || '').trim(),
          imageKey: imageKey
        }
      }
    )
  },

  // --- Detail: build detail view ---
  buildDetailView: function () {
    return {
      title: i18n.t('community.detail.detail'),
      description: ''
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
