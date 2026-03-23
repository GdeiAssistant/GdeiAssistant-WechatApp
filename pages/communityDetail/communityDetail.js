const {
  getCommunityModule,
  getCommunityPageTitle,
  getLostFoundItemDictionaryOptions,
  getDatingGradeOptions,
  getDeliveryStatusOptions,
  DELIVERY_PLACEHOLDER_PICKUP_CODE
} = require('../../constants/community.js')
const { fetchProfileOptions } = require('../../constants/profile.js')
const communityApi = require('../../services/apis/community.js')
const pageUtils = require('../../utils/page.js')
const { createSubmitGuard } = require('../../utils/debounce.js')
const i18n = require('../../utils/i18n.js')
var themeUtil = require('../../utils/theme')

const commentGuard = createSubmitGuard()
const guessGuard = createSubmitGuard()
const pickGuard = createSubmitGuard()

let secretVoicePlayer = null

const COMMENT_MAX_LENGTH = 50
const EXPRESS_GUESS_MAX_LENGTH = 10
const DATING_PICK_MAX_LENGTH = 50

function findLabel(options, value, fallback) {
  const item = (options || []).filter(function(optionItem) {
    return Number(optionItem.value) === Number(value)
  })[0]
  return item ? item.label : (fallback || '')
}

function formatSecretPublishText(publishTime, timer) {
  const baseText = String(publishTime || '').trim()
  if (Number(timer) === 1) {
    var autoDeleteText = i18n.t('community.list.autoDelete24h')
    return baseText ? baseText + ' \u00b7 ' + autoDeleteText : autoDeleteText
  }
  return baseText
}

function maskSensitiveText(text) {
  const value = String(text || '').trim()
  if (!value) {
    return ''
  }
  if (value.length <= 4) {
    return '***'
  }
  return '*'.repeat(Math.max(value.length - 4, 3)) + value.slice(-4)
}

function buildDeliveryRoleTitle(detailType) {
  switch (Number(detailType)) {
    case 0:
      return i18n.t('community.detail.rolePublisher')
    case 3:
      return i18n.t('community.detail.roleAcceptor')
    default:
      return i18n.t('community.detail.roleVisitor')
  }
}

function buildDeliveryStatusDescription(status, detailType) {
  const normalizedStatus = Number(status)
  const normalizedType = Number(detailType)

  if (normalizedStatus === 0 && normalizedType === 0) {
    return i18n.t('community.detail.deliveryDesc00')
  }
  if (normalizedStatus === 0 && normalizedType === 1) {
    return i18n.t('community.detail.deliveryDesc01')
  }
  if (normalizedStatus === 1 && normalizedType === 0) {
    return i18n.t('community.detail.deliveryDesc10')
  }
  if (normalizedStatus === 1 && normalizedType === 3) {
    return i18n.t('community.detail.deliveryDesc13')
  }
  if (normalizedStatus === 2) {
    return i18n.t('community.detail.deliveryDesc2')
  }
  return ''
}

function buildDetail(moduleId, payload) {
  switch (moduleId) {
    case 'ershou': {
      const item = payload.secondhandItem || {}
      const profile = payload.profile || {}
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
    }
    case 'lostandfound': {
      const item = payload.item || {}
      const profile = payload.profile || {}
      var locationLabel = Number(item.lostType) === 0 ? i18n.t('community.detail.lostLocation') : i18n.t('community.detail.foundLocation')
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
        typeLabel: findLabel(getLostFoundItemDictionaryOptions(), item.itemType, i18n.t('community.category.other')),
        badgeText: Number(item.lostType) === 0 ? i18n.t('community.lostFoundMode.lostNotice') : i18n.t('community.lostFoundMode.foundNotice'),
        canLike: false
      }
    }
    case 'delivery': {
      const order = payload.order || {}
      const detailType = Number(payload.detailType)
      const orderState = Number(order.state || 0)
      const canViewSensitiveInfo = detailType === 0 || detailType === 3 || orderState !== 0
      const pickupCode = String(order.number || '').trim()
      const phone = String(order.phone || '').trim()
      const hasMeaningfulPickupCode = !!pickupCode && pickupCode !== DELIVERY_PLACEHOLDER_PICKUP_CODE

      return {
        id: order.orderId,
        title: order.company || i18n.t('community.modules.delivery.title'),
        subtitle: order.orderTime || '',
        description: order.remarks || '',
        pickupAddress: order.company || '',
        deliveryAddress: order.address || '',
        phone: canViewSensitiveInfo ? phone : '',
        phoneText: phone ? (canViewSensitiveInfo ? phone : maskSensitiveText(phone)) : '',
        pickupCode: canViewSensitiveInfo && hasMeaningfulPickupCode ? pickupCode : '',
        pickupCodeText: hasMeaningfulPickupCode ? (canViewSensitiveInfo ? pickupCode : maskSensitiveText(pickupCode)) : '',
        priceText: Number(order.price || 0).toFixed(2),
        status: orderState,
        detailType: detailType,
        canViewSensitiveInfo: canViewSensitiveInfo,
        userRoleTitle: buildDeliveryRoleTitle(detailType),
        statusDescription: buildDeliveryStatusDescription(orderState, detailType),
        sensitiveHint: !canViewSensitiveInfo && (hasMeaningfulPickupCode || phone) ? i18n.t('community.detail.sensitiveHint') : '',
        tradeId: payload.trade && payload.trade.tradeId ? payload.trade.tradeId : null,
        canAccept: detailType === 1 && orderState === 0,
        canFinish: detailType === 0 && orderState === 1
      }
    }
    case 'dating': {
      const profile = payload.profile || {}
      return {
        id: profile.profileId,
        title: profile.nickname || i18n.t('community.modules.dating.title'),
        subtitle: findLabel(getDatingGradeOptions(), profile.grade, i18n.t('community.list.unknownGrade')) + ' \u00b7 ' + (profile.faculty || ''),
        description: profile.content || '',
        images: payload.pictureURL ? [payload.pictureURL] : [],
        hometown: profile.hometown || '',
        qq: payload.isContactVisible ? (profile.qq || '') : '',
        wechat: payload.isContactVisible ? (profile.wechat || '') : '',
        contactVisible: !!payload.isContactVisible,
        canSubmitPick: !payload.isPickNotAvailable,
        canLike: false
      }
    }
    default:
      return {
        title: i18n.t('community.detail.detail'),
        description: ''
      }
  }
}

Page({
  onShow: function () {
    themeUtil.applyTheme(this)
    this.refreshI18n()
  },
  data: {
    themeClass: '',
    moduleId: '',
    moduleConfig: null,
    detailId: '',
    detail: null,
    comments: [],
    loading: true,
    errorMessage: null,
    commentInput: '',
    guessInput: '',
    pickInput: '',
    playingVoice: false,
    t: {}
  },

  refreshI18n: function() {
    var moduleConfig = this.data.moduleId ? getCommunityModule(this.data.moduleId) : this.data.moduleConfig

    var tData = {
      loading: i18n.t('community.list.loading'),
      publishTime: i18n.t('community.detail.publishTime'),
      contactInfo: i18n.t('community.detail.contactInfo'),
      copy: i18n.t('community.detail.copy'),
      call: i18n.t('community.detail.call'),
      publisher: i18n.t('community.detail.publisher'),
      secretInteraction: i18n.t('community.detail.secretInteraction'),
      playVoice: i18n.t('community.detail.playVoice'),
      stopVoice: i18n.t('community.detail.stopVoice'),
      cancelLike: i18n.t('community.detail.cancelLike'),
      like: i18n.t('community.list.like'),
      liked: i18n.t('community.detail.liked'),
      comment: i18n.t('community.list.comment'),
      interactionData: i18n.t('community.detail.interactionData'),
      guessPlaceholder: i18n.t('community.detail.guessPlaceholder'),
      submitBtn: i18n.t('common.submit'),
      guessHint: i18n.t('community.detail.guessHint'),
      taskInfo: i18n.t('community.detail.taskInfo'),
      myRole: i18n.t('community.detail.myRole'),
      pickupPoint: i18n.t('community.detail.pickupPoint'),
      deliveryAddr: i18n.t('community.detail.deliveryAddr'),
      pickupCode: i18n.t('community.detail.pickupCode'),
      contactPhone: i18n.t('community.detail.contactPhone'),
      errandFee: i18n.t('community.detail.errandFee'),
      acceptOrder: i18n.t('community.detail.acceptOrder'),
      confirmComplete: i18n.t('community.detail.confirmComplete'),
      hometown: i18n.t('community.detail.hometown'),
      contactNotVisible: i18n.t('community.detail.contactNotVisible'),
      pickPlaceholder: i18n.t('community.detail.pickPlaceholder'),
      sendPick: i18n.t('community.detail.sendPick'),
      commentSection: i18n.t('community.detail.commentSection'),
      postComment: i18n.t('community.detail.postComment'),
      commentPlaceholder: i18n.t('community.detail.commentPlaceholder'),
      submitComment: i18n.t('community.detail.submitComment'),
      contactQQ: i18n.t('community.center.contactQQ'),
      contactWechat: i18n.t('community.center.contactWechat')
    }

    this.setData({
      moduleConfig: moduleConfig,
      t: tData
    })

    if (moduleConfig && this.data.moduleId) {
      wx.setNavigationBarTitle({
        title: getCommunityPageTitle(this.data.moduleId, 'detail', moduleConfig.title)
      })
    }
  },

  loadComments: function() {
    if (['secret', 'express', 'photograph'].indexOf(this.data.moduleId) === -1) {
      return Promise.resolve()
    }

    return communityApi.getComments(this.data.moduleId, this.data.detailId).then((result) => {
      if (result.success) {
        const normalizedComments = (Array.isArray(result.data) ? result.data : []).map(function(item, index) {
          return Object.assign({
            id: item.id || item.commentId || 'comment_' + index,
            nickname: item.nickname || i18n.t('community.list.anonStudent'),
            comment: item.comment || '',
            publishTime: item.publishTime || item.createTime || ''
          }, item)
        })
        this.setData({
          comments: normalizedComments
        })
      }
    }).catch(() => {})
  },

  loadDetail: function() {
    return pageUtils.runWithNavigationLoading(this, () => {
      return communityApi.getDetail(this.data.moduleId, this.data.detailId)
    }).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || i18n.t('common.loadFailed'))
        return
      }

      this.setData({
        detail: buildDetail(this.data.moduleId, result.data || {}),
        loading: false,
        errorMessage: null
      })
      return this.loadComments()
    }).catch((error) => {
      this.setData({
        loading: false
      })
      pageUtils.showTopTips(this, error.message)
    })
  },

  ensureProfileOptions: function() {
    if (this.data.moduleId !== 'ershou' && this.data.moduleId !== 'lostandfound') {
      return Promise.resolve()
    }

    return fetchProfileOptions().catch(function() {
      return null
    })
  },

  setFieldValue: function(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [field]: event.detail.value
    })
  },

  previewImages: function(event) {
    const index = Number(event.currentTarget.dataset.index || 0)
    const images = this.data.detail && this.data.detail.images ? this.data.detail.images : []
    if (!images.length) {
      return
    }
    wx.previewImage({
      current: images[index] || images[0],
      urls: images
    })
  },

  copyValue: function(event) {
    const value = String(event.currentTarget.dataset.value || '').trim()
    if (!value) {
      return
    }
    wx.setClipboardData({
      data: value
    })
  },

  callPhone: function() {
    const phone = this.data.detail && this.data.detail.phone ? this.data.detail.phone : ''
    if (!phone) {
      return
    }
    wx.makePhoneCall({
      phoneNumber: phone
    })
  },

  toggleLike: function() {
    if (!this.data.detail || !this.data.detail.canLike) {
      return
    }

    const nextValue = this.data.moduleId === 'secret' ? !this.data.detail.liked : true
    if (this.data.moduleId !== 'secret' && this.data.detail.liked) {
      return
    }

    communityApi.toggleLike(this.data.moduleId, this.data.detailId, nextValue).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || i18n.t('community.common.operationFailed'))
        return
      }

      const currentDetail = Object.assign({}, this.data.detail)
      if (this.data.moduleId === 'secret') {
        currentDetail.liked = nextValue
        currentDetail.likeCount = Math.max(0, Number(currentDetail.likeCount || 0) + (nextValue ? 1 : -1))
      } else {
        currentDetail.liked = true
        currentDetail.likeCount = Number(currentDetail.likeCount || 0) + 1
      }
      this.setData({
        detail: currentDetail
      })
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  submitComment: function() {
    if (!commentGuard.acquire()) return

    const comment = String(this.data.commentInput || '').trim()
    if (!comment) {
      pageUtils.showTopTips(this, i18n.t('community.detail.commentEmpty'))
      commentGuard.release()
      return
    }
    if (comment.length > COMMENT_MAX_LENGTH) {
      pageUtils.showTopTips(this, i18n.tReplace('community.detail.commentTooLong', { max: COMMENT_MAX_LENGTH }))
      commentGuard.release()
      return
    }

    communityApi.submitComment(this.data.moduleId, this.data.detailId, comment).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || i18n.t('community.detail.commentFailed'))
        return
      }

      this.setData({
        commentInput: ''
      })

      const currentDetail = Object.assign({}, this.data.detail || {})
      currentDetail.commentCount = Number(currentDetail.commentCount || 0) + 1
      this.setData({
        detail: currentDetail
      })
      this.loadComments()
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    }).finally(function () {
      commentGuard.release()
    })
  },

  submitGuess: function() {
    if (!guessGuard.acquire()) return

    const guessedName = String(this.data.guessInput || '').trim()
    if (!guessedName) {
      pageUtils.showTopTips(this, i18n.t('community.detail.guessEmpty'))
      guessGuard.release()
      return
    }
    if (guessedName.length > EXPRESS_GUESS_MAX_LENGTH) {
      pageUtils.showTopTips(this, i18n.tReplace('community.detail.guessTooLong', { max: EXPRESS_GUESS_MAX_LENGTH }))
      guessGuard.release()
      return
    }

    communityApi.guessExpress(this.data.detailId, guessedName).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || i18n.t('community.detail.submitFailed'))
        return
      }

      const currentDetail = Object.assign({}, this.data.detail || {})
      currentDetail.guessCount = Number(currentDetail.guessCount || 0) + 1
      if (result.data === true) {
        currentDetail.correctCount = Number(currentDetail.correctCount || 0) + 1
        wx.showToast({
          title: i18n.t('community.detail.guessCorrect'),
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: i18n.t('community.detail.guessWrong'),
          icon: 'none'
        })
      }
      this.setData({
        guessInput: '',
        detail: currentDetail
      })
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    }).finally(function () {
      guessGuard.release()
    })
  },

  acceptDelivery: function() {
    communityApi.acceptDeliveryOrder(this.data.detailId).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || i18n.t('community.detail.acceptFailed'))
        return
      }
      wx.showToast({
        title: i18n.t('community.detail.acceptSuccess'),
        icon: 'success'
      })
      this.loadDetail()
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  finishDelivery: function() {
    const tradeId = this.data.detail && this.data.detail.tradeId ? this.data.detail.tradeId : null
    if (!tradeId) {
      return
    }
    communityApi.finishDeliveryTrade(tradeId).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || i18n.t('community.detail.confirmFailed'))
        return
      }
      wx.showToast({
        title: i18n.t('community.detail.confirmSuccess'),
        icon: 'success'
      })
      this.loadDetail()
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  submitPick: function() {
    if (!pickGuard.acquire()) return

    const content = String(this.data.pickInput || '').trim()
    if (!content) {
      pageUtils.showTopTips(this, i18n.t('community.detail.pickEmpty'))
      pickGuard.release()
      return
    }
    if (content.length > DATING_PICK_MAX_LENGTH) {
      pageUtils.showTopTips(this, i18n.tReplace('community.detail.pickTooLong', { max: DATING_PICK_MAX_LENGTH }))
      pickGuard.release()
      return
    }

    communityApi.submitDatingPick(this.data.detailId, content).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || i18n.t('community.detail.sendFailed'))
        return
      }
      wx.showToast({
        title: i18n.t('community.detail.sendSuccess'),
        icon: 'success'
      })
      this.setData({
        pickInput: ''
      })
      this.loadDetail()
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    }).finally(function () {
      pickGuard.release()
    })
  },

  toggleSecretVoice: function() {
    const detail = this.data.detail || {}
    if (this.data.moduleId !== 'secret' || Number(detail.type) !== 1 || !detail.voiceURL) {
      return
    }

    if (!secretVoicePlayer) {
      secretVoicePlayer = wx.createInnerAudioContext()
      secretVoicePlayer.onEnded(() => {
        this.setData({
          playingVoice: false
        })
      })
      secretVoicePlayer.onStop(() => {
        this.setData({
          playingVoice: false
        })
      })
      secretVoicePlayer.onError(() => {
        this.setData({
          playingVoice: false
        })
        pageUtils.showTopTips(this, i18n.t('community.detail.voicePlayFailed'))
      })
    }

    if (this.data.playingVoice) {
      secretVoicePlayer.stop()
      this.setData({
        playingVoice: false
      })
      return
    }

    secretVoicePlayer.src = detail.voiceURL
    secretVoicePlayer.play()
    this.setData({
      playingVoice: true
    })
  },

  onLoad: function(options) {
    const moduleId = options && options.module ? options.module : ''
    const moduleConfig = getCommunityModule(moduleId)
    if (!moduleConfig || !options.id) {
      wx.showModal({
        title: i18n.t('community.common.notice'),
        content: i18n.t('community.detail.incompleteParams'),
        showCancel: false
      })
      return
    }

    wx.setNavigationBarTitle({
      title: getCommunityPageTitle(moduleId, 'detail', moduleConfig.title)
    })

    this.setData({
      moduleId: moduleId,
      moduleConfig: moduleConfig,
      detailId: options.id
    })
    this.refreshI18n()
    this.ensureProfileOptions().finally(() => {
      this.loadDetail()
    })
  },

  onUnload: function() {
    if (secretVoicePlayer) {
      secretVoicePlayer.stop()
      if (typeof secretVoicePlayer.destroy === 'function') {
        secretVoicePlayer.destroy()
      }
      secretVoicePlayer = null
    }
  },

  onShareAppMessage: function() {
    return {
      title: this.data.detail && this.data.detail.title ? this.data.detail.title : (this.data.moduleConfig ? this.data.moduleConfig.title : i18n.t('community.common.campusCommunity')),
      path: '/pages/communityDetail/communityDetail?module=' + this.data.moduleId + '&id=' + this.data.detailId
    }
  }
})
