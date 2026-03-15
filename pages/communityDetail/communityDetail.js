const {
  getCommunityModule,
  getCommunityPageTitle,
  LOST_FOUND_ITEM_OPTIONS,
  DATING_GRADE_OPTIONS,
  DELIVERY_PLACEHOLDER_PICKUP_CODE
} = require('../../constants/community.js')
const communityApi = require('../../services/apis/community.js')
const pageUtils = require('../../utils/page.js')

let secretVoicePlayer = null

function findLabel(options, value, fallback) {
  const item = (options || []).filter(function(optionItem) {
    return Number(optionItem.value) === Number(value)
  })[0]
  return item ? item.label : (fallback || '')
}

function formatSecretPublishText(publishTime, timer) {
  const baseText = String(publishTime || '').trim()
  if (Number(timer) === 1) {
    return baseText ? `${baseText} · 24 小时后自动删除` : '24 小时后自动删除'
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
  return `${'*'.repeat(Math.max(value.length - 4, 3))}${value.slice(-4)}`
}

function buildDeliveryRoleTitle(detailType) {
  switch (Number(detailType)) {
    case 0:
      return '发布者'
    case 3:
      return '接单者'
    default:
      return '大厅访客'
  }
}

function buildDeliveryStatusDescription(status, detailType) {
  const normalizedStatus = Number(status)
  const normalizedType = Number(detailType)

  if (normalizedStatus === 0 && normalizedType === 0) {
    return '订单正在等待同学接单，保持电话畅通即可。'
  }
  if (normalizedStatus === 0 && normalizedType === 1) {
    return '当前仍在大厅中，接单后才能看到完整取件码和联系方式。'
  }
  if (normalizedStatus === 1 && normalizedType === 0) {
    return '已有同学接单，确认收件后可在这里完成交易。'
  }
  if (normalizedStatus === 1 && normalizedType === 3) {
    return '你已成功接单，请及时完成取件并送达。'
  }
  if (normalizedStatus === 2) {
    return '这笔订单已经完成，可回看记录。'
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
        title: item.name || '商品详情',
        subtitle: item.location || '',
        description: item.description || '',
        priceText: Number(item.price || 0).toFixed(2),
        publishTime: item.publishTime || '',
        sellerName: profile.nickname || profile.username || '匿名同学',
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
      return {
        images: item.pictureURL || [],
        title: item.name || '失物详情',
        subtitle: `${Number(item.lostType) === 0 ? '丢失地点' : '拾取地点'}：${item.location || '未填写'}`,
        description: item.description || '',
        publishTime: item.publishTime || '',
        sellerName: profile.nickname || profile.username || '匿名同学',
        sellerAvatar: profile.avatarURL || '/image/default.png',
        qq: item.qq || '',
        wechat: item.wechat || '',
        phone: item.phone || '',
        typeLabel: findLabel(LOST_FOUND_ITEM_OPTIONS, item.itemType, '其他'),
        badgeText: Number(item.lostType) === 0 ? '寻物启事' : '失物招领',
        canLike: false
      }
    }
    case 'secret':
      return {
        id: payload.id,
        title: '校园树洞',
        subtitle: formatSecretPublishText(payload.publishTime, payload.timer),
        description: Number(payload.type) === 1 ? '这是一段语音树洞，点击播放收听。' : (payload.content || ''),
        content: payload.content || '',
        type: Number(payload.type || 0),
        theme: Number(payload.theme || 1),
        timer: Number(payload.timer || 0),
        voiceURL: payload.voiceURL || '',
        likeCount: Number(payload.likeCount || 0),
        commentCount: Number(payload.commentCount || 0),
        liked: Number(payload.liked || 0) === 1,
        canLike: true
      }
    case 'express':
      return {
        id: payload.id,
        title: `${payload.nickname || '匿名同学'} -> ${payload.name || 'TA'}`,
        subtitle: payload.publishTime || '',
        description: payload.content || '',
        likeCount: Number(payload.likeCount || 0),
        commentCount: Number(payload.commentCount || 0),
        liked: !!payload.liked,
        canGuess: !!payload.canGuess,
        guessCount: Number(payload.guessSum || 0),
        correctCount: Number(payload.guessCount || 0),
        canLike: true
      }
    case 'topic':
      return {
        id: payload.id,
        title: `#${payload.topic || '校园话题'}`,
        subtitle: payload.publishTime || '',
        description: payload.content || '',
        images: payload.imageUrls || [],
        likeCount: Number(payload.likeCount || 0),
        liked: !!payload.liked,
        canLike: true
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
        title: order.company || '全民快递',
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
        sensitiveHint: !canViewSensitiveInfo && (hasMeaningfulPickupCode || phone) ? '接单后才能查看完整取件码和联系方式' : '',
        tradeId: payload.trade && payload.trade.tradeId ? payload.trade.tradeId : null,
        canAccept: detailType === 1 && orderState === 0,
        canFinish: detailType === 0 && orderState === 1
      }
    }
    case 'dating': {
      const profile = payload.profile || {}
      return {
        id: profile.profileId,
        title: profile.nickname || '卖室友',
        subtitle: `${findLabel(DATING_GRADE_OPTIONS, profile.grade, '未知年级')} · ${profile.faculty || ''}`,
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
    case 'photograph':
      return {
        id: payload.id,
        title: payload.title || '作品详情',
        subtitle: payload.createTime || '',
        description: payload.content || '',
        images: payload.imageUrls || [],
        likeCount: Number(payload.likeCount || 0),
        commentCount: Number(payload.commentCount || 0),
        liked: !!payload.liked,
        canLike: true
      }
    default:
      return {
        title: '详情',
        description: ''
      }
  }
}

Page({
  data: {
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
    playingVoice: false
  },

  loadComments: function() {
    if (['secret', 'express', 'photograph'].indexOf(this.data.moduleId) === -1) {
      return Promise.resolve()
    }

    return communityApi.getComments(this.data.moduleId, this.data.detailId).then((result) => {
      if (result.success) {
        const normalizedComments = (Array.isArray(result.data) ? result.data : []).map(function(item, index) {
          return Object.assign({
            id: item.id || item.commentId || `comment_${index}`,
            nickname: item.nickname || '匿名同学',
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
        pageUtils.showTopTips(this, result.message || '加载失败')
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
        pageUtils.showTopTips(this, result.message || '操作失败')
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
    const comment = String(this.data.commentInput || '').trim()
    if (!comment) {
      pageUtils.showTopTips(this, '评论内容不能为空')
      return
    }

    communityApi.submitComment(this.data.moduleId, this.data.detailId, comment).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || '评论失败')
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
    })
  },

  submitGuess: function() {
    const guessedName = String(this.data.guessInput || '').trim()
    if (!guessedName) {
      pageUtils.showTopTips(this, '请输入你猜的名字')
      return
    }

    communityApi.guessExpress(this.data.detailId, guessedName).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || '提交失败')
        return
      }

      const currentDetail = Object.assign({}, this.data.detail || {})
      currentDetail.guessCount = Number(currentDetail.guessCount || 0) + 1
      if (result.data === true) {
        currentDetail.correctCount = Number(currentDetail.correctCount || 0) + 1
        wx.showToast({
          title: '猜对了',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: '还差一点',
          icon: 'none'
        })
      }
      this.setData({
        guessInput: '',
        detail: currentDetail
      })
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  acceptDelivery: function() {
    communityApi.acceptDeliveryOrder(this.data.detailId).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || '接单失败')
        return
      }
      wx.showToast({
        title: '接单成功',
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
        pageUtils.showTopTips(this, result.message || '确认失败')
        return
      }
      wx.showToast({
        title: '已确认完成',
        icon: 'success'
      })
      this.loadDetail()
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  submitPick: function() {
    const content = String(this.data.pickInput || '').trim()
    if (!content) {
      pageUtils.showTopTips(this, '请输入撩一下内容')
      return
    }

    communityApi.submitDatingPick(this.data.detailId, content).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || '发送失败')
        return
      }
      wx.showToast({
        title: '发送成功',
        icon: 'success'
      })
      this.setData({
        pickInput: ''
      })
      this.loadDetail()
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
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
        pageUtils.showTopTips(this, '语音播放失败')
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
        title: '提示',
        content: '页面参数不完整',
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
    this.loadDetail()
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
      title: this.data.detail && this.data.detail.title ? this.data.detail.title : (this.data.moduleConfig ? this.data.moduleConfig.title : '校园社区'),
      path: `/pages/communityDetail/communityDetail?module=${this.data.moduleId}&id=${this.data.detailId}`
    }
  }
})
