const {
  getCommunityModule,
  getCommunityPageTitle,
  SECONDHAND_CATEGORY_OPTIONS,
  LOST_FOUND_MODE_OPTIONS,
  LOST_FOUND_ITEM_OPTIONS,
  SECRET_THEME_OPTIONS,
  SECRET_TYPE_OPTIONS,
  EXPRESS_GENDER_OPTIONS,
  DATING_AREA_OPTIONS,
  DATING_GRADE_OPTIONS,
  PHOTOGRAPH_TAB_OPTIONS,
  DELIVERY_DEFAULT_ORDER_NAME,
  DELIVERY_PLACEHOLDER_PICKUP_CODE
} = require('../../constants/community.js')
const communityApi = require('../../services/apis/community.js')
const { uploadLocalFileByPresignedUrl, uploadLocalFilesByPresignedUrl } = require('../../services/upload.js')
const pageUtils = require('../../utils/page.js')

const EDITABLE_MODULE_IDS = ['ershou', 'lostandfound']

let recorderManager = null
let secretAudioPlayer = null

function pickTempFileName(filePath, fallbackName) {
  if (!filePath) {
    return fallbackName
  }
  const pathParts = String(filePath).split('/')
  return pathParts[pathParts.length - 1] || fallbackName
}

function findOptionIndex(options, value, key) {
  const targetKey = key || 'value'
  const targetValue = Number(value)

  for (let index = 0; index < (options || []).length; index += 1) {
    if (Number(options[index][targetKey]) === targetValue) {
      return index
    }
  }

  return 0
}

function buildReadonlyImages(imageUrls) {
  return (imageUrls || []).map(function(url, index) {
    return {
      path: url,
      name: pickTempFileName(url, `image-${index + 1}.jpg`),
      readonly: true
    }
  })
}

function isEditSupported(moduleId) {
  return EDITABLE_MODULE_IDS.indexOf(moduleId) !== -1
}

function findEditableItem(moduleId, payload, itemId) {
  const targetId = Number(itemId)
  let sourceList = []

  if (moduleId === 'ershou') {
    sourceList = []
      .concat(payload.doing || [])
      .concat(payload.sold || [])
      .concat(payload.off || [])
  }

  if (moduleId === 'lostandfound') {
    sourceList = []
      .concat(payload.lost || [])
      .concat(payload.found || [])
      .concat(payload.didfound || [])
  }

  return sourceList.filter(function(item) {
    return Number(item.id) === targetId
  })[0] || null
}

Page({
  data: {
    moduleId: '',
    moduleConfig: null,
    mode: 'create',
    isEditMode: false,
    editItemId: '',
    pageLoading: false,
    secondhandTypeOptions: SECONDHAND_CATEGORY_OPTIONS.slice(1),
    lostFoundModeOptions: LOST_FOUND_MODE_OPTIONS,
    lostFoundItemOptions: LOST_FOUND_ITEM_OPTIONS,
    secretThemeOptions: SECRET_THEME_OPTIONS,
    secretTypeOptions: SECRET_TYPE_OPTIONS,
    expressGenderOptions: EXPRESS_GENDER_OPTIONS,
    datingAreaOptions: DATING_AREA_OPTIONS,
    datingGradeOptions: DATING_GRADE_OPTIONS,
    photographTypeOptions: PHOTOGRAPH_TAB_OPTIONS,
    secondhandTypeIndex: 0,
    lostFoundModeIndex: 0,
    lostFoundItemIndex: 0,
    secretThemeIndex: 0,
    secretTypeIndex: 0,
    secretDeleteAfter24Hours: false,
    expressSelfGenderIndex: 0,
    expressTargetGenderIndex: 0,
    datingAreaIndex: 0,
    datingGradeIndex: 0,
    photographTypeIndex: 0,
    form: {},
    images: [],
    imageLimit: 4,
    submitting: false,
    recording: false,
    voiceFile: null,
    voiceDuration: 0,
    voicePlaying: false,
    errorMessage: null
  },

  setFieldValue: function(event) {
    const field = event.currentTarget.dataset.field
    const nextForm = Object.assign({}, this.data.form, {
      [field]: event.detail.value
    })
    this.setData({
      form: nextForm
    })
  },

  handlePickerChange: function(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [field]: Number(event.detail.value)
    })
  },

  handleSecretTimerChange: function(event) {
    this.setData({
      secretDeleteAfter24Hours: !!event.detail.value
    })
  },

  getImageLimit: function(moduleId) {
    const currentModuleId = moduleId || this.data.moduleId
    switch (currentModuleId) {
      case 'topic':
        return 9
      case 'photograph':
        return 4
      default:
        return 4
    }
  },

  chooseImages: function() {
    if (this.data.isEditMode) {
      pageUtils.showTopTips(this, '编辑模式暂不支持修改图片')
      return
    }

    const remainCount = this.getImageLimit() - this.data.images.length
    if (remainCount <= 0) {
      pageUtils.showTopTips(this, `最多只能上传 ${this.getImageLimit()} 张图片`)
      return
    }

    wx.chooseImage({
      count: remainCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (result) => {
        const selectedFiles = (result.tempFiles || []).map(function(fileItem, index) {
          const filePath = fileItem.path || (result.tempFilePaths || [])[index] || ''
          return {
            path: filePath,
            name: pickTempFileName(filePath, `image-${Date.now()}-${index}.jpg`)
          }
        }).filter(function(item) {
          return !!item.path
        })
        this.setData({
          images: this.data.images.concat(selectedFiles)
        })
      }
    })
  },

  removeImage: function(event) {
    if (this.data.isEditMode) {
      pageUtils.showTopTips(this, '编辑模式暂不支持修改图片')
      return
    }

    const index = Number(event.currentTarget.dataset.index)
    const nextImages = this.data.images.filter(function(item, itemIndex) {
      return itemIndex !== index
    })
    this.setData({
      images: nextImages
    })
  },

  startSecretRecord: function() {
    if (this.data.recording) {
      return
    }

    if (!recorderManager) {
      recorderManager = wx.getRecorderManager()
      recorderManager.onStop((result) => {
        this.setData({
          recording: false,
          voiceFile: {
            path: result.tempFilePath,
            name: pickTempFileName(result.tempFilePath, 'secret-voice.mp3'),
            type: 'audio/mpeg'
          },
          voiceDuration: Math.ceil(Number(result.duration || 0) / 1000)
        })
      })
      recorderManager.onError(() => {
        this.setData({
          recording: false
        })
        pageUtils.showTopTips(this, '录音失败')
      })
    }

    this.setData({
      recording: true,
      voiceFile: null,
      voiceDuration: 0
    })

    recorderManager.start({
      duration: 60000,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 128000,
      format: 'mp3'
    })
  },

  stopSecretRecord: function() {
    if (!this.data.recording || !recorderManager) {
      return
    }
    recorderManager.stop()
  },

  toggleSecretVoicePreview: function() {
    if (!this.data.voiceFile || !this.data.voiceFile.path) {
      return
    }

    if (!secretAudioPlayer) {
      secretAudioPlayer = wx.createInnerAudioContext()
      secretAudioPlayer.onEnded(() => {
        this.setData({
          voicePlaying: false
        })
      })
      secretAudioPlayer.onStop(() => {
        this.setData({
          voicePlaying: false
        })
      })
    }

    if (this.data.voicePlaying) {
      secretAudioPlayer.stop()
      this.setData({
        voicePlaying: false
      })
      return
    }

    secretAudioPlayer.src = this.data.voiceFile.path
    secretAudioPlayer.play()
    this.setData({
      voicePlaying: true
    })
  },

  navigateBackToModule: function() {
    const targetUrl = this.data.isEditMode
      ? `/pages/communityCenter/communityCenter?module=${this.data.moduleId}`
      : `/pages/communityList/communityList?module=${this.data.moduleId}`
    const pageStack = getCurrentPages()
    if (pageStack.length > 1) {
      wx.navigateBack({
        delta: 1
      })
      return
    }
    wx.redirectTo({
      url: targetUrl
    })
  },

  validateForm: function() {
    const moduleId = this.data.moduleId
    const form = this.data.form || {}

    switch (moduleId) {
      case 'ershou':
        if (!String(form.name || '').trim()) return '请输入商品名称'
        if (!String(form.description || '').trim()) return '请输入商品描述'
        if (!(Number(form.price || 0) > 0)) return '请输入正确的商品价格'
        if (!String(form.location || '').trim()) return '请输入交易地点'
        if (!String(form.qq || '').trim()) return '请输入 QQ 号'
        if (!this.data.isEditMode && !this.data.images.length) return '请至少上传一张图片'
        return ''
      case 'lostandfound':
        if (!String(form.name || '').trim()) return '请输入物品名称'
        if (!String(form.description || '').trim()) return '请输入物品描述'
        if (!String(form.location || '').trim()) return '请输入地点'
        if (!String(form.qq || '').trim() && !String(form.wechat || '').trim() && !String(form.phone || '').trim()) {
          return '请至少填写一种联系方式'
        }
        if (!this.data.isEditMode && !this.data.images.length) return '请至少上传一张图片'
        return ''
      case 'secret':
        if (Number(this.data.secretTypeIndex) === 0 && !String(form.content || '').trim()) {
          return '请输入树洞内容'
        }
        if (Number(this.data.secretTypeIndex) === 1 && !this.data.voiceFile) {
          return '请先录制语音'
        }
        return ''
      case 'express':
        if (!String(form.nickname || '').trim()) return '请输入昵称'
        if (!String(form.targetName || '').trim()) return '请输入 TA 的名字'
        if (!String(form.content || '').trim()) return '请输入表白内容'
        return ''
      case 'topic':
        if (!String(form.topic || '').trim()) return '请输入话题关键词'
        if (!String(form.content || '').trim()) return '请输入话题内容'
        return ''
      case 'delivery':
        if (!String(form.pickupAddress || '').trim()) return '请输入取件地点'
        if (!String(form.deliveryAddress || '').trim()) return '请输入送达地址'
        if (!String(form.contactPhone || '').trim()) return '请输入联系人电话'
        if (!(Number(form.reward || 0) > 0)) return '请输入有效的跑腿费'
        return ''
      case 'dating':
        if (!String(form.nickname || '').trim()) return '请输入昵称'
        if (!String(form.faculty || '').trim()) return '请输入专业'
        if (!String(form.hometown || '').trim()) return '请输入家乡'
        if (!String(form.qq || '').trim() && !String(form.wechat || '').trim()) {
          return 'QQ 和微信至少填写一个'
        }
        if (!String(form.content || '').trim()) return '请输入介绍内容'
        return ''
      case 'photograph':
        if (!String(form.title || '').trim()) return '请输入作品标题'
        if (!this.data.images.length) return '请至少上传一张图片'
        return ''
      default:
        return '暂不支持当前模块'
    }
  },

  buildPublishPayload: function() {
    const moduleId = this.data.moduleId
    const form = this.data.form || {}

    switch (moduleId) {
      case 'ershou':
        if (this.data.isEditMode) {
          return Promise.resolve({
            name: String(form.name || '').trim(),
            description: String(form.description || '').trim(),
            price: Number(form.price || 0),
            location: String(form.location || '').trim(),
            type: this.data.secondhandTypeOptions[this.data.secondhandTypeIndex].value,
            qq: String(form.qq || '').trim(),
            phone: String(form.phone || '').trim()
          })
        }
        return uploadLocalFilesByPresignedUrl(this.data.images).then((imageKeys) => {
          return {
            name: String(form.name || '').trim(),
            description: String(form.description || '').trim(),
            price: Number(form.price || 0),
            location: String(form.location || '').trim(),
            type: this.data.secondhandTypeOptions[this.data.secondhandTypeIndex].value,
            qq: String(form.qq || '').trim(),
            phone: String(form.phone || '').trim(),
            imageKeys: imageKeys
          }
        })
      case 'lostandfound':
        if (this.data.isEditMode) {
          return Promise.resolve({
            name: String(form.name || '').trim(),
            description: String(form.description || '').trim(),
            location: String(form.location || '').trim(),
            lostType: this.data.lostFoundModeOptions[this.data.lostFoundModeIndex].value,
            itemType: this.data.lostFoundItemOptions[this.data.lostFoundItemIndex].value,
            qq: String(form.qq || '').trim(),
            wechat: String(form.wechat || '').trim(),
            phone: String(form.phone || '').trim()
          })
        }
        return uploadLocalFilesByPresignedUrl(this.data.images).then((imageKeys) => {
          return {
            name: String(form.name || '').trim(),
            description: String(form.description || '').trim(),
            location: String(form.location || '').trim(),
            lostType: this.data.lostFoundModeOptions[this.data.lostFoundModeIndex].value,
            itemType: this.data.lostFoundItemOptions[this.data.lostFoundItemIndex].value,
            qq: String(form.qq || '').trim(),
            wechat: String(form.wechat || '').trim(),
            phone: String(form.phone || '').trim(),
            imageKeys: imageKeys
          }
        })
      case 'secret':
        if (Number(this.data.secretTypeIndex) === 0) {
          return Promise.resolve({
            theme: this.data.secretThemeOptions[this.data.secretThemeIndex].value,
            type: 0,
            timer: this.data.secretDeleteAfter24Hours ? 1 : 0,
            content: String(form.content || '').trim()
          })
        }
        return uploadLocalFileByPresignedUrl(this.data.voiceFile, {
          fileName: `secret-voice-${Date.now()}.mp3`
        }).then((voiceKey) => {
          return {
            theme: this.data.secretThemeOptions[this.data.secretThemeIndex].value,
            type: 1,
            timer: this.data.secretDeleteAfter24Hours ? 1 : 0,
            content: '',
            voiceKey: voiceKey
          }
        })
      case 'express':
        return Promise.resolve({
          nickname: String(form.nickname || '').trim(),
          realname: String(form.realname || '').trim(),
          selfGender: this.data.expressGenderOptions[this.data.expressSelfGenderIndex].value,
          name: String(form.targetName || '').trim(),
          personGender: this.data.expressGenderOptions[this.data.expressTargetGenderIndex].value,
          content: String(form.content || '').trim()
        })
      case 'topic':
        return uploadLocalFilesByPresignedUrl(this.data.images).then((imageKeys) => {
          return {
            topic: String(form.topic || '').trim(),
            content: String(form.content || '').trim(),
            count: imageKeys.length,
            imageKeys: imageKeys
          }
        })
      case 'delivery':
        return Promise.resolve({
          name: DELIVERY_DEFAULT_ORDER_NAME,
          number: String(form.pickupCode || '').trim() || DELIVERY_PLACEHOLDER_PICKUP_CODE,
          phone: String(form.contactPhone || '').trim(),
          price: Number(form.reward || 0),
          company: String(form.pickupAddress || '').trim(),
          address: String(form.deliveryAddress || '').trim(),
          remarks: String(form.description || '').trim()
        })
      case 'dating':
        return (this.data.images.length ? uploadLocalFileByPresignedUrl(this.data.images[0]) : Promise.resolve('')).then((imageKey) => {
          return {
            nickname: String(form.nickname || '').trim(),
            grade: this.data.datingGradeOptions[this.data.datingGradeIndex].value,
            area: this.data.datingAreaOptions[this.data.datingAreaIndex].value,
            faculty: String(form.faculty || '').trim(),
            hometown: String(form.hometown || '').trim(),
            qq: String(form.qq || '').trim(),
            wechat: String(form.wechat || '').trim(),
            content: String(form.content || '').trim(),
            imageKey: imageKey
          }
        })
      case 'photograph':
        return uploadLocalFilesByPresignedUrl(this.data.images).then((imageKeys) => {
          return {
            title: String(form.title || '').trim(),
            content: String(form.content || '').trim(),
            count: imageKeys.length,
            type: this.data.photographTypeOptions[this.data.photographTypeIndex].publishValue,
            imageKeys: imageKeys
          }
        })
      default:
        return Promise.reject(new Error('暂不支持当前模块'))
    }
  },

  submitModulePayload: function(payload) {
    if (!this.data.isEditMode) {
      return communityApi.publish(this.data.moduleId, payload)
    }

    if (this.data.moduleId === 'ershou') {
      return communityApi.updateSecondhandItem(this.data.editItemId, payload)
    }

    if (this.data.moduleId === 'lostandfound') {
      return communityApi.updateLostAndFoundItem(this.data.editItemId, payload)
    }

    return Promise.reject(new Error('当前模块暂不支持编辑'))
  },

  submitPublish: function() {
    if (this.data.submitting || this.data.pageLoading) {
      return
    }

    const validationMessage = this.validateForm()
    if (validationMessage) {
      pageUtils.showTopTips(this, validationMessage)
      return
    }

    this.setData({
      submitting: true
    })

    pageUtils.runWithNavigationLoading(this, () => {
      return this.buildPublishPayload().then((payload) => {
        return this.submitModulePayload(payload)
      })
    }).then((result) => {
      this.setData({
        submitting: false
      })
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || (this.data.isEditMode ? '保存失败' : '发布失败'))
        return
      }

      wx.showToast({
        title: this.data.isEditMode ? '保存成功' : '发布成功',
        icon: 'success'
      })
      setTimeout(() => {
        this.navigateBackToModule()
      }, 600)
    }).catch((error) => {
      this.setData({
        submitting: false
      })
      pageUtils.showTopTips(this, error.message)
    })
  },

  applyEditData: function(item) {
    if (!item) {
      return
    }

    if (this.data.moduleId === 'ershou') {
      this.setData({
        form: {
          name: item.name || '',
          description: item.description || '',
          price: item.price !== undefined && item.price !== null ? String(item.price) : '',
          location: item.location || '',
          qq: item.qq || '',
          phone: item.phone || ''
        },
        secondhandTypeIndex: findOptionIndex(this.data.secondhandTypeOptions, item.type),
        images: buildReadonlyImages(item.pictureURL || [])
      })
      return
    }

    if (this.data.moduleId === 'lostandfound') {
      this.setData({
        form: {
          name: item.name || '',
          description: item.description || '',
          location: item.location || '',
          qq: item.qq || '',
          wechat: item.wechat || '',
          phone: item.phone || ''
        },
        lostFoundModeIndex: findOptionIndex(this.data.lostFoundModeOptions, item.lostType),
        lostFoundItemIndex: findOptionIndex(this.data.lostFoundItemOptions, item.itemType),
        images: buildReadonlyImages(item.pictureURL || [])
      })
    }
  },

  loadEditItem: function() {
    if (!this.data.isEditMode) {
      return Promise.resolve()
    }

    this.setData({
      pageLoading: true
    })

    return pageUtils.runWithNavigationLoading(this, () => {
      return communityApi.getCenter(this.data.moduleId)
    }).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || '加载失败')
        return
      }

      const editItem = findEditableItem(this.data.moduleId, result.data || {}, this.data.editItemId)
      if (!editItem) {
        pageUtils.showTopTips(this, '未找到要编辑的内容')
        return
      }

      this.applyEditData(editItem)
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    }).finally(() => {
      this.setData({
        pageLoading: false
      })
    })
  },

  onLoad: function(options) {
    const moduleId = options && options.module ? options.module : ''
    const moduleConfig = getCommunityModule(moduleId)
    if (!moduleConfig) {
      wx.showModal({
        title: '提示',
        content: '未识别的社区模块',
        showCancel: false
      })
      return
    }

    const isEditMode = options && options.mode === 'edit' && !!options.id && isEditSupported(moduleId)

    wx.setNavigationBarTitle({
      title: getCommunityPageTitle(moduleId, isEditMode ? 'edit' : 'publish', moduleConfig.title)
    })

    this.setData({
      moduleId: moduleId,
      moduleConfig: moduleConfig,
      mode: isEditMode ? 'edit' : 'create',
      isEditMode: isEditMode,
      editItemId: isEditMode ? String(options.id) : '',
      form: {},
      images: [],
      imageLimit: this.getImageLimit(moduleId),
      secretDeleteAfter24Hours: false
    })

    if (isEditMode) {
      this.loadEditItem()
    }
  },

  onUnload: function() {
    if (this.data.recording && recorderManager) {
      recorderManager.stop()
    }
    if (secretAudioPlayer) {
      secretAudioPlayer.stop()
      if (typeof secretAudioPlayer.destroy === 'function') {
        secretAudioPlayer.destroy()
      }
      secretAudioPlayer = null
    }
  }
})
