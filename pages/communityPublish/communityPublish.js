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
  getPhotographTabOptions,
  DELIVERY_DEFAULT_ORDER_NAME,
  DELIVERY_PLACEHOLDER_PICKUP_CODE
} = require('../../constants/community.js')
const { fetchProfileOptions } = require('../../constants/profile.js')
const communityApi = require('../../services/apis/community.js')
const { uploadLocalFileByPresignedUrl, uploadLocalFilesByPresignedUrl } = require('../../services/upload.js')
const pageUtils = require('../../utils/page.js')
const i18n = require('../../utils/i18n.js')
var themeUtil = require('../../utils/theme')

const EDITABLE_MODULE_IDS = ['ershou', 'lostandfound']

let recorderManager = null
let secretAudioPlayer = null

const SECONDHAND_NAME_MAX_LENGTH = 25
const SECONDHAND_DESCRIPTION_MAX_LENGTH = 100
const SECONDHAND_LOCATION_MAX_LENGTH = 30
const SECONDHAND_QQ_MAX_LENGTH = 20
const CONTACT_PHONE_MAX_LENGTH = 11
const LOST_FOUND_NAME_MAX_LENGTH = 25
const LOST_FOUND_DESCRIPTION_MAX_LENGTH = 100
const LOST_FOUND_LOCATION_MAX_LENGTH = 30
const LOST_FOUND_QQ_MAX_LENGTH = 20
const LOST_FOUND_WECHAT_MAX_LENGTH = 20
const SECRET_CONTENT_MAX_LENGTH = 100
const EXPRESS_NAME_MAX_LENGTH = 10
const EXPRESS_CONTENT_MAX_LENGTH = 250
const TOPIC_KEYWORD_MAX_LENGTH = 15
const TOPIC_CONTENT_MAX_LENGTH = 250
const DELIVERY_COMPANY_MAX_LENGTH = 10
const DELIVERY_ADDRESS_MAX_LENGTH = 50
const DELIVERY_REMARKS_MAX_LENGTH = 100
const DATING_NICKNAME_MAX_LENGTH = 15
const DATING_FACULTY_MAX_LENGTH = 12
const DATING_HOMETOWN_MAX_LENGTH = 10
const DATING_QQ_MAX_LENGTH = 15
const DATING_WECHAT_MAX_LENGTH = 20
const DATING_CONTENT_MAX_LENGTH = 100
const PHOTOGRAPH_TITLE_MAX_LENGTH = 25
const PHOTOGRAPH_CONTENT_MAX_LENGTH = 50

function trimValue(value) {
  return String(value || '').trim()
}

function getMaxLengthMessage(value, maxLength, message) {
  return trimValue(value).length > maxLength ? message : ''
}

function getExactLengthMessage(value, expectedLength, message) {
  const normalizedValue = trimValue(value)
  if (!normalizedValue) {
    return ''
  }
  return normalizedValue.length !== expectedLength ? message : ''
}

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
    const moduleId = this.data.moduleId
    const form = this.data.form || {}

    switch (moduleId) {
      case 'ershou': {
        const name = trimValue(form.name)
        const description = trimValue(form.description)
        const location = trimValue(form.location)
        const qq = trimValue(form.qq)
        const phone = trimValue(form.phone)

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
        if (!this.data.isEditMode && !this.data.images.length) return i18n.t('community.publish.v.imageRequired')
        return ''
      }
      case 'lostandfound': {
        const name = trimValue(form.name)
        const description = trimValue(form.description)
        const location = trimValue(form.location)
        const qq = trimValue(form.qq)
        const wechat = trimValue(form.wechat)
        const phone = trimValue(form.phone)

        if (!name) return i18n.t('community.publish.v.itemNameRequired')
        if (getMaxLengthMessage(name, LOST_FOUND_NAME_MAX_LENGTH, i18n.tReplace('community.publish.v.itemNameTooLong', { max: LOST_FOUND_NAME_MAX_LENGTH }))) return getMaxLengthMessage(name, LOST_FOUND_NAME_MAX_LENGTH, i18n.tReplace('community.publish.v.itemNameTooLong', { max: LOST_FOUND_NAME_MAX_LENGTH }))
        if (!description) return i18n.t('community.publish.v.itemDescRequired')
        if (getMaxLengthMessage(description, LOST_FOUND_DESCRIPTION_MAX_LENGTH, i18n.tReplace('community.publish.v.itemDescTooLong', { max: LOST_FOUND_DESCRIPTION_MAX_LENGTH }))) return getMaxLengthMessage(description, LOST_FOUND_DESCRIPTION_MAX_LENGTH, i18n.tReplace('community.publish.v.itemDescTooLong', { max: LOST_FOUND_DESCRIPTION_MAX_LENGTH }))
        if (!location) return i18n.t('community.publish.v.locationRequired2')
        if (getMaxLengthMessage(location, LOST_FOUND_LOCATION_MAX_LENGTH, i18n.tReplace('community.publish.v.locationTooLong2', { max: LOST_FOUND_LOCATION_MAX_LENGTH }))) return getMaxLengthMessage(location, LOST_FOUND_LOCATION_MAX_LENGTH, i18n.tReplace('community.publish.v.locationTooLong2', { max: LOST_FOUND_LOCATION_MAX_LENGTH }))
        if (getMaxLengthMessage(qq, LOST_FOUND_QQ_MAX_LENGTH, i18n.tReplace('community.publish.v.qqTooLong2', { max: LOST_FOUND_QQ_MAX_LENGTH }))) return getMaxLengthMessage(qq, LOST_FOUND_QQ_MAX_LENGTH, i18n.tReplace('community.publish.v.qqTooLong2', { max: LOST_FOUND_QQ_MAX_LENGTH }))
        if (getMaxLengthMessage(wechat, LOST_FOUND_WECHAT_MAX_LENGTH, i18n.tReplace('community.publish.v.wechatTooLong', { max: LOST_FOUND_WECHAT_MAX_LENGTH }))) return getMaxLengthMessage(wechat, LOST_FOUND_WECHAT_MAX_LENGTH, i18n.tReplace('community.publish.v.wechatTooLong', { max: LOST_FOUND_WECHAT_MAX_LENGTH }))
        if (getMaxLengthMessage(phone, CONTACT_PHONE_MAX_LENGTH, i18n.tReplace('community.publish.v.phoneTooLong2', { max: CONTACT_PHONE_MAX_LENGTH }))) return getMaxLengthMessage(phone, CONTACT_PHONE_MAX_LENGTH, i18n.tReplace('community.publish.v.phoneTooLong2', { max: CONTACT_PHONE_MAX_LENGTH }))
        if (!qq && !wechat && !phone) {
          return i18n.t('community.publish.v.contactRequired')
        }
        if (!this.data.isEditMode && !this.data.images.length) return i18n.t('community.publish.v.imageRequired')
        return ''
      }
      case 'topic': {
        const topic = trimValue(form.topic)
        const content = trimValue(form.content)

        if (!topic) return i18n.t('community.publish.v.topicRequired')
        if (getMaxLengthMessage(topic, TOPIC_KEYWORD_MAX_LENGTH, i18n.tReplace('community.publish.v.topicTooLong', { max: TOPIC_KEYWORD_MAX_LENGTH }))) return getMaxLengthMessage(topic, TOPIC_KEYWORD_MAX_LENGTH, i18n.tReplace('community.publish.v.topicTooLong', { max: TOPIC_KEYWORD_MAX_LENGTH }))
        if (!content) return i18n.t('community.publish.v.topicContentRequired')
        if (getMaxLengthMessage(content, TOPIC_CONTENT_MAX_LENGTH, i18n.tReplace('community.publish.v.topicContentTooLong', { max: TOPIC_CONTENT_MAX_LENGTH }))) return getMaxLengthMessage(content, TOPIC_CONTENT_MAX_LENGTH, i18n.tReplace('community.publish.v.topicContentTooLong', { max: TOPIC_CONTENT_MAX_LENGTH }))
        return ''
      }
      case 'delivery': {
        const pickupAddress = trimValue(form.pickupAddress)
        const pickupCode = trimValue(form.pickupCode)
        const deliveryAddress = trimValue(form.deliveryAddress)
        const contactPhone = trimValue(form.contactPhone)
        const description = trimValue(form.description)

        if (!pickupAddress) return i18n.t('community.publish.v.pickupRequired')
        if (getMaxLengthMessage(pickupAddress, DELIVERY_COMPANY_MAX_LENGTH, i18n.tReplace('community.publish.v.pickupTooLong', { max: DELIVERY_COMPANY_MAX_LENGTH }))) return getMaxLengthMessage(pickupAddress, DELIVERY_COMPANY_MAX_LENGTH, i18n.tReplace('community.publish.v.pickupTooLong', { max: DELIVERY_COMPANY_MAX_LENGTH }))
        if (getExactLengthMessage(pickupCode, 11, i18n.t('community.publish.v.pickupCodeLength'))) return getExactLengthMessage(pickupCode, 11, i18n.t('community.publish.v.pickupCodeLength'))
        if (!deliveryAddress) return i18n.t('community.publish.v.deliveryAddrRequired')
        if (getMaxLengthMessage(deliveryAddress, DELIVERY_ADDRESS_MAX_LENGTH, i18n.tReplace('community.publish.v.deliveryAddrTooLong', { max: DELIVERY_ADDRESS_MAX_LENGTH }))) return getMaxLengthMessage(deliveryAddress, DELIVERY_ADDRESS_MAX_LENGTH, i18n.tReplace('community.publish.v.deliveryAddrTooLong', { max: DELIVERY_ADDRESS_MAX_LENGTH }))
        if (!contactPhone) return i18n.t('community.publish.v.phoneRequired')
        if (getMaxLengthMessage(contactPhone, CONTACT_PHONE_MAX_LENGTH, i18n.tReplace('community.publish.v.contactPhoneTooLong', { max: CONTACT_PHONE_MAX_LENGTH }))) return getMaxLengthMessage(contactPhone, CONTACT_PHONE_MAX_LENGTH, i18n.tReplace('community.publish.v.contactPhoneTooLong', { max: CONTACT_PHONE_MAX_LENGTH }))
        if (getMaxLengthMessage(description, DELIVERY_REMARKS_MAX_LENGTH, i18n.tReplace('community.publish.v.remarksTooLong', { max: DELIVERY_REMARKS_MAX_LENGTH }))) return getMaxLengthMessage(description, DELIVERY_REMARKS_MAX_LENGTH, i18n.tReplace('community.publish.v.remarksTooLong', { max: DELIVERY_REMARKS_MAX_LENGTH }))
        if (!(Number(form.reward || 0) > 0)) return i18n.t('community.publish.v.rewardInvalid')
        return ''
      }
      case 'dating': {
        const nickname = trimValue(form.nickname)
        const faculty = trimValue(form.faculty)
        const hometown = trimValue(form.hometown)
        const qq = trimValue(form.qq)
        const wechat = trimValue(form.wechat)
        const content = trimValue(form.content)

        if (!nickname) return i18n.t('community.publish.v.nicknameRequired')
        if (getMaxLengthMessage(nickname, DATING_NICKNAME_MAX_LENGTH, i18n.tReplace('community.publish.v.nicknameTooLong', { max: DATING_NICKNAME_MAX_LENGTH }))) return getMaxLengthMessage(nickname, DATING_NICKNAME_MAX_LENGTH, i18n.tReplace('community.publish.v.nicknameTooLong', { max: DATING_NICKNAME_MAX_LENGTH }))
        if (!faculty) return i18n.t('community.publish.v.majorRequired')
        if (getMaxLengthMessage(faculty, DATING_FACULTY_MAX_LENGTH, i18n.tReplace('community.publish.v.majorTooLong', { max: DATING_FACULTY_MAX_LENGTH }))) return getMaxLengthMessage(faculty, DATING_FACULTY_MAX_LENGTH, i18n.tReplace('community.publish.v.majorTooLong', { max: DATING_FACULTY_MAX_LENGTH }))
        if (!hometown) return i18n.t('community.publish.v.hometownRequired')
        if (getMaxLengthMessage(hometown, DATING_HOMETOWN_MAX_LENGTH, i18n.tReplace('community.publish.v.hometownTooLong', { max: DATING_HOMETOWN_MAX_LENGTH }))) return getMaxLengthMessage(hometown, DATING_HOMETOWN_MAX_LENGTH, i18n.tReplace('community.publish.v.hometownTooLong', { max: DATING_HOMETOWN_MAX_LENGTH }))
        if (getMaxLengthMessage(qq, DATING_QQ_MAX_LENGTH, i18n.tReplace('community.publish.v.qqTooLong2', { max: DATING_QQ_MAX_LENGTH }))) return getMaxLengthMessage(qq, DATING_QQ_MAX_LENGTH, i18n.tReplace('community.publish.v.qqTooLong2', { max: DATING_QQ_MAX_LENGTH }))
        if (getMaxLengthMessage(wechat, DATING_WECHAT_MAX_LENGTH, i18n.tReplace('community.publish.v.wechatTooLong', { max: DATING_WECHAT_MAX_LENGTH }))) return getMaxLengthMessage(wechat, DATING_WECHAT_MAX_LENGTH, i18n.tReplace('community.publish.v.wechatTooLong', { max: DATING_WECHAT_MAX_LENGTH }))
        if (!qq && !wechat) {
          return i18n.t('community.publish.v.qqWechatRequired')
        }
        if (!content) return i18n.t('community.publish.v.introRequired')
        if (getMaxLengthMessage(content, DATING_CONTENT_MAX_LENGTH, i18n.tReplace('community.publish.v.introTooLong', { max: DATING_CONTENT_MAX_LENGTH }))) return getMaxLengthMessage(content, DATING_CONTENT_MAX_LENGTH, i18n.tReplace('community.publish.v.introTooLong', { max: DATING_CONTENT_MAX_LENGTH }))
        return ''
      }
      case 'photograph': {
        const title = trimValue(form.title)
        const content = trimValue(form.content)

        if (!title) return i18n.t('community.publish.v.workTitleRequired')
        if (getMaxLengthMessage(title, PHOTOGRAPH_TITLE_MAX_LENGTH, i18n.tReplace('community.publish.v.workTitleTooLong', { max: PHOTOGRAPH_TITLE_MAX_LENGTH }))) return getMaxLengthMessage(title, PHOTOGRAPH_TITLE_MAX_LENGTH, i18n.tReplace('community.publish.v.workTitleTooLong', { max: PHOTOGRAPH_TITLE_MAX_LENGTH }))
        if (getMaxLengthMessage(content, PHOTOGRAPH_CONTENT_MAX_LENGTH, i18n.tReplace('community.publish.v.shootingDescTooLong', { max: PHOTOGRAPH_CONTENT_MAX_LENGTH }))) return getMaxLengthMessage(content, PHOTOGRAPH_CONTENT_MAX_LENGTH, i18n.tReplace('community.publish.v.shootingDescTooLong', { max: PHOTOGRAPH_CONTENT_MAX_LENGTH }))
        if (!this.data.images.length) return i18n.t('community.publish.v.imageRequired')
        return ''
      }
      default:
        return i18n.t('community.publish.v.moduleNotSupported')
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
        return Promise.reject(new Error(i18n.t('community.publish.v.moduleNotSupported')))
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
