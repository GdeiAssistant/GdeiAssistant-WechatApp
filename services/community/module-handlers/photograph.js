const endpoints = require('../../endpoints.js')
const { trimValue, getMaxLengthMessage } = require('../format.js')
const { requestForm, postForm } = require('../../request-form.js')
const { request } = require('../../request.js')
const { encodeForm } = require('../../../utils/form.js')
const i18n = require('../../../utils/i18n.js')
const { getPhotographTabOptions } = require('../../../constants/community.js')

var PHOTOGRAPH_TITLE_MAX_LENGTH = 25
var PHOTOGRAPH_CONTENT_MAX_LENGTH = 50

module.exports = {
  getFeed: function (options) {
    var config = options || {}
    var start = Number(config.start || 0)
    var size = Number(config.size || 10)

    return request({
      url: endpoints.community.photograph.list(Number(config.type || 1), start, size),
      method: 'GET',
      authRequired: true
    })
  },

  getDetail: function (id) {
    return request({
      url: endpoints.community.photograph.detail(id),
      method: 'GET',
      authRequired: true
    })
  },

  getCenter: function (options) {
    var config = options || {}
    var start = Number(config.start || 0)
    var size = Number(config.size || 10)

    return request({
      url: endpoints.community.photograph.profile(start, size),
      method: 'GET',
      authRequired: true
    })
  },

  publish: function (payload) {
    return postForm(endpoints.community.photograph.publish, payload)
  },

  buildListTabs: function () {
    return getPhotographTabOptions()
  },

  normalizeItem: function (item) {
    var rawItem = item || {}
    return {
      id: rawItem.id,
      title: rawItem.title || i18n.t('community.list.campusWork'),
      summary: rawItem.content || '',
      cover:
        rawItem.firstImageUrl ||
        (rawItem.imageUrls && rawItem.imageUrls.length
          ? rawItem.imageUrls[0]
          : '/image/photograph.png'),
      likeCount: Number(rawItem.likeCount || 0),
      commentCount: Number(rawItem.commentCount || 0),
      timeText: rawItem.createTime || '',
      raw: rawItem
    }
  },

  buildFeedOptions: function (baseOptions, activeTab) {
    var options = Object.assign({}, baseOptions)
    options.type = activeTab ? Number(activeTab.feedValue) : 1
    return options
  },

  buildCenterTabs: function () {
    return []
  },

  normalizeCenterData: function (payload, normalizeStandardItem) {
    return {
      default: (payload || []).map(function (item) {
        return normalizeStandardItem(item, {
          id: item.id,
          title: item.title || i18n.t('community.list.campusWork'),
          subtitle: item.createTime || '',
          summary: item.content || '',
          cover:
            item.firstImageUrl ||
            (item.imageUrls && item.imageUrls.length ? item.imageUrls[0] : '/image/photograph.png'),
          actions: []
        })
      })
    }
  },

  showSummaryProfile: false,

  searchable: false,

  // Detail response already includes photographCommentList from the backend,
  // so communityDetail can skip the separate getComments() call.
  commentsInDetail: true,

  validateForm: function (data) {
    var form = data.form || {}
    var images = data.images || []

    var title = trimValue(form.title)
    var content = trimValue(form.content)

    if (!title) return i18n.t('community.publish.v.workTitleRequired')
    if (
      getMaxLengthMessage(
        title,
        PHOTOGRAPH_TITLE_MAX_LENGTH,
        i18n.tReplace('community.publish.v.workTitleTooLong', { max: PHOTOGRAPH_TITLE_MAX_LENGTH })
      )
    )
      return getMaxLengthMessage(
        title,
        PHOTOGRAPH_TITLE_MAX_LENGTH,
        i18n.tReplace('community.publish.v.workTitleTooLong', { max: PHOTOGRAPH_TITLE_MAX_LENGTH })
      )
    if (
      getMaxLengthMessage(
        content,
        PHOTOGRAPH_CONTENT_MAX_LENGTH,
        i18n.tReplace('community.publish.v.shootingDescTooLong', {
          max: PHOTOGRAPH_CONTENT_MAX_LENGTH
        })
      )
    )
      return getMaxLengthMessage(
        content,
        PHOTOGRAPH_CONTENT_MAX_LENGTH,
        i18n.tReplace('community.publish.v.shootingDescTooLong', {
          max: PHOTOGRAPH_CONTENT_MAX_LENGTH
        })
      )
    if (!images.length) return i18n.t('community.publish.v.imageRequired')
    return ''
  },

  buildPublishPayload: function (data, uploadFiles) {
    var form = data.form || {}
    var images = data.images || []
    var photographTypeOptions = data.photographTypeOptions || []
    var photographTypeIndex = data.photographTypeIndex || 0

    return uploadFiles(images).then(function (imageKeys) {
      return {
        title: String(form.title || '').trim(),
        content: String(form.content || '').trim(),
        type: photographTypeOptions[photographTypeIndex].publishValue,
        imageKeys: imageKeys
      }
    })
  },

  buildDetailView: function (payload) {
    var item = payload || {}
    return {
      title: item.title || i18n.t('community.detail.detail'),
      description: item.content || '',
      images: item.imageUrls || [],
      publishTime: item.publishTime || '',
      likeCount: Number(item.likeCount || 0),
      commentCount: Number(item.commentCount || 0),
      liked: !!item.liked,
      authorId: item.authorId || null,
      canLike: true
    }
  },

  getComments: function (id) {
    return request({
      url: endpoints.community.photograph.comments(id),
      method: 'GET',
      authRequired: true
    })
  },

  submitComment: function (id, comment) {
    return requestForm({
      url: endpoints.community.photograph.comment(id),
      method: 'POST',
      authRequired: true,
      data: encodeForm({ comment: comment })
    })
  },

  toggleLike: function (id) {
    return request({
      url: endpoints.community.photograph.like(id),
      method: 'POST',
      authRequired: true
    })
  }
}
