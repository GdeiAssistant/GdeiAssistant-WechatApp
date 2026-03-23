const {
  getCommunityModule,
  getCommunityPageTitle,
  getSecondhandCategoryOptions,
  getLostFoundModeDictionaryOptions,
  getLostFoundItemDictionaryOptions,
  getSecretThemeOptions,
  getSecretTypeOptions,
  getExpressGenderOptions,
  getDatingAreaOptions,
  getDatingGradeOptions,
  getPhotographTabOptions
} = require('../../constants/community.js')
const { fetchProfileOptions } = require('../../constants/profile.js')
const communityApi = require('../../services/apis/community.js')
const { getModuleHandler } = require('../../services/community/registry.js')
const { uploadLocalFileByPresignedUrl, uploadLocalFilesByPresignedUrl } = require('../../services/upload.js')
const pageUtils = require('../../utils/page.js')
const i18n = require('../../utils/i18n.js')
var themeUtil = require('../../utils/theme')

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
      name: pickTempFileName(url, 'image-' + (index + 1) + '.jpg'),
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
  onShow: function () {
    themeUtil.applyTheme(this)
    this.refreshI18n()
  },
  data: {
    themeClass: '',
    moduleId: '',
    moduleConfig: null,
    mode: 'create',
    isEditMode: false,
    editItemId: '',
    pageLoading: false,
    secondhandTypeOptions: [],
    lostFoundModeOptions: [],
    lostFoundItemOptions: [],
    secretThemeOptions: [],
    secretTypeOptions: [],
    expressGenderOptions: [],
    datingAreaOptions: [],
    datingGradeOptions: [],
    photographTypeOptions: [],
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
    errorMessage: null,
    t: {}
  },

  refreshI18n: function() {
    var moduleConfig = this.data.moduleId ? getCommunityModule(this.data.moduleId) : this.data.moduleConfig

    var tData = {
      basicInfo: i18n.t('community.publish.basicInfo'),
      loadingExisting: i18n.t('community.publish.loadingExisting'),
      imageUpload: i18n.t('community.publish.imageUpload'),
      editImageNotSupported: i18n.t('community.publish.editImageNotSupported'),
      datingImageHint: i18n.t('community.publish.datingImageHint'),
      saveChanges: i18n.t('community.publish.saveChanges'),
      submitPublish: i18n.t('community.publish.submitPublish'),
      editHeroSummary: i18n.t('community.publish.editHeroSummary'),
      productName: i18n.t('community.publish.productName'),
      productPrice: i18n.t('community.publish.productPrice'),
      productCategory: i18n.t('community.publish.productCategory'),
      tradeLocation: i18n.t('community.publish.tradeLocation'),
      qqNumber: i18n.t('community.publish.qqNumber'),
      phoneOptional: i18n.t('community.publish.phoneOptional'),
      productDesc: i18n.t('community.publish.productDesc'),
      infoType: i18n.t('community.publish.infoType'),
      itemCategory: i18n.t('community.publish.itemCategory'),
      itemName: i18n.t('community.publish.itemName'),
      location: i18n.t('community.publish.location'),
      qqOptional: i18n.t('community.publish.qqOptional'),
      wechatOptional: i18n.t('community.publish.wechatOptional'),
      phoneOptional2: i18n.t('community.publish.phoneOptional2'),
      itemDesc: i18n.t('community.publish.itemDesc'),
      theme: i18n.t('community.publish.theme'),
      contentType: i18n.t('community.publish.contentType'),
      autoDelete24h: i18n.t('community.list.autoDelete24h'),
      secretPlaceholder: i18n.t('community.publish.secretPlaceholder'),
      startRecording: i18n.t('community.publish.startRecording'),
      stopRecording: i18n.t('community.publish.stopRecording'),
      recordedDuration: i18n.t('community.publish.recordedDuration'),
      previewVoice: i18n.t('community.publish.previewVoice'),
      stopPreview: i18n.t('community.publish.stopPreview'),
      yourNickname: i18n.t('community.publish.yourNickname'),
      yourRealname: i18n.t('community.publish.yourRealname'),
      yourGender: i18n.t('community.publish.yourGender'),
      targetName: i18n.t('community.publish.targetName'),
      targetGender: i18n.t('community.publish.targetGender'),
      confessionContent: i18n.t('community.publish.confessionContent'),
      topicKeyword: i18n.t('community.publish.topicKeyword'),
      topicContent: i18n.t('community.publish.topicContent'),
      pickupLocation: i18n.t('community.publish.pickupLocation'),
      pickupCodeOptional: i18n.t('community.publish.pickupCodeOptional'),
      deliveryAddress: i18n.t('community.publish.deliveryAddress'),
      contactPhone: i18n.t('community.publish.contactPhone'),
      errandFee: i18n.t('community.publish.errandFee'),
      remarksOptional: i18n.t('community.publish.remarksOptional'),
      nickname: i18n.t('community.publish.nickname'),
      grade: i18n.t('community.publish.grade'),
      displayArea: i18n.t('community.publish.displayArea'),
      major: i18n.t('community.publish.major'),
      hometown: i18n.t('community.publish.hometown'),
      roommateIntro: i18n.t('community.publish.roommateIntro'),
      workTitle: i18n.t('community.publish.workTitle'),
      workType: i18n.t('community.publish.workType'),
      shootingDesc: i18n.t('community.publish.shootingDesc')
    }

    this.setData({
      moduleConfig: moduleConfig,
      t: tData
    })

    if (moduleConfig && this.data.moduleId) {
      wx.setNavigationBarTitle({
        title: getCommunityPageTitle(this.data.moduleId, this.data.isEditMode ? 'edit' : 'publish', moduleConfig.title)
      })
    }
  },

  refreshDictionaryOptions: function() {
    this.setData({
      secondhandTypeOptions: getSecondhandCategoryOptions().slice(1),
      lostFoundModeOptions: getLostFoundModeDictionaryOptions(),
      lostFoundItemOptions: getLostFoundItemDictionaryOptions(),
      secretThemeOptions: getSecretThemeOptions(),
      secretTypeOptions: getSecretTypeOptions(),
      expressGenderOptions: getExpressGenderOptions(),
      datingAreaOptions: getDatingAreaOptions(),
      datingGradeOptions: getDatingGradeOptions(),
      photographTypeOptions: getPhotographTabOptions()
    })
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
    var currentModuleId = moduleId || this.data.moduleId
    var handler = getModuleHandler(currentModuleId)
    return (handler && handler.imageLimit) ? handler.imageLimit : 4
  },

  chooseImages: function() {
    if (this.data.isEditMode) {
      pageUtils.showTopTips(this, i18n.t('community.publish.editImageNotSupported'))
      return
    }

    const remainCount = this.getImageLimit() - this.data.images.length
    if (remainCount <= 0) {
      pageUtils.showTopTips(this, i18n.tReplace('community.publish.imageLimit', { max: this.getImageLimit() }))
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
            name: pickTempFileName(filePath, 'image-' + Date.now() + '-' + index + '.jpg')
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
      pageUtils.showTopTips(this, i18n.t('community.publish.editImageNotSupported'))
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
        pageUtils.showTopTips(this, i18n.t('community.publish.recordingFailed'))
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
      ? '/pages/communityCenter/communityCenter?module=' + this.data.moduleId
      : '/pages/communityList/communityList?module=' + this.data.moduleId
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
    var handler = getModuleHandler(this.data.moduleId)
    if (handler && handler.validateForm) {
      return handler.validateForm(this.data)
    }
    return i18n.t('community.publish.v.moduleNotSupported')
  },

  buildPublishPayload: function() {
    var handler = getModuleHandler(this.data.moduleId)
    if (handler && handler.buildPublishPayload) {
      return handler.buildPublishPayload(this.data, uploadLocalFilesByPresignedUrl, uploadLocalFileByPresignedUrl)
    }
    return Promise.reject(new Error(i18n.t('community.publish.v.moduleNotSupported')))
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

    return Promise.reject(new Error(i18n.t('community.publish.v.editNotSupported')))
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
        pageUtils.showTopTips(this, result.message || (this.data.isEditMode ? i18n.t('community.publish.saveFailed') : i18n.t('common.publishFailed')))
        return
      }

      wx.showToast({
        title: this.data.isEditMode ? i18n.t('community.publish.saveSuccess') : i18n.t('common.publishSuccess'),
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
        pageUtils.showTopTips(this, result.message || i18n.t('common.loadFailed'))
        return
      }

      const editItem = findEditableItem(this.data.moduleId, result.data || {}, this.data.editItemId)
      if (!editItem) {
        pageUtils.showTopTips(this, i18n.t('community.publish.editItemNotFound'))
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
        title: i18n.t('community.common.notice'),
        content: i18n.t('community.common.unknownModule'),
        showCancel: false
      })
      return
    }

    const isEditMode = options && options.mode === 'edit' && !!options.id && isEditSupported(moduleId)

    wx.setNavigationBarTitle({
      title: getCommunityPageTitle(moduleId, isEditMode ? 'edit' : 'publish', moduleConfig.title)
    })

    fetchProfileOptions().catch(function() {
      return null
    }).finally(() => {
      this.refreshDictionaryOptions()

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

      this.refreshI18n()

      if (isEditMode) {
        this.loadEditItem()
      }
    })
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
