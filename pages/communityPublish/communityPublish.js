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
      case 'ershou': {
        const name = trimValue(form.name)
        const description = trimValue(form.description)
        const location = trimValue(form.location)
        const qq = trimValue(form.qq)
        const phone = trimValue(form.phone)

        if (!name) return '请输入商品名称'
        if (getMaxLengthMessage(name, SECONDHAND_NAME_MAX_LENGTH, `商品名称不能超过${SECONDHAND_NAME_MAX_LENGTH}个字符`)) return getMaxLengthMessage(name, SECONDHAND_NAME_MAX_LENGTH, `商品名称不能超过${SECONDHAND_NAME_MAX_LENGTH}个字符`)
        if (!description) return '请输入商品描述'
        if (getMaxLengthMessage(description, SECONDHAND_DESCRIPTION_MAX_LENGTH, `商品描述不能超过${SECONDHAND_DESCRIPTION_MAX_LENGTH}个字符`)) return getMaxLengthMessage(description, SECONDHAND_DESCRIPTION_MAX_LENGTH, `商品描述不能超过${SECONDHAND_DESCRIPTION_MAX_LENGTH}个字符`)
        if (!(Number(form.price || 0) > 0)) return '请输入正确的商品价格'
        if (!location) return '请输入交易地点'
        if (getMaxLengthMessage(location, SECONDHAND_LOCATION_MAX_LENGTH, `交易地点不能超过${SECONDHAND_LOCATION_MAX_LENGTH}个字符`)) return getMaxLengthMessage(location, SECONDHAND_LOCATION_MAX_LENGTH, `交易地点不能超过${SECONDHAND_LOCATION_MAX_LENGTH}个字符`)
        if (!qq) return '请输入 QQ 号'
        if (getMaxLengthMessage(qq, SECONDHAND_QQ_MAX_LENGTH, `QQ 号不能超过${SECONDHAND_QQ_MAX_LENGTH}个字符`)) return getMaxLengthMessage(qq, SECONDHAND_QQ_MAX_LENGTH, `QQ 号不能超过${SECONDHAND_QQ_MAX_LENGTH}个字符`)
        if (getMaxLengthMessage(phone, CONTACT_PHONE_MAX_LENGTH, `手机号不能超过${CONTACT_PHONE_MAX_LENGTH}个字符`)) return getMaxLengthMessage(phone, CONTACT_PHONE_MAX_LENGTH, `手机号不能超过${CONTACT_PHONE_MAX_LENGTH}个字符`)
        if (!this.data.isEditMode && !this.data.images.length) return '请至少上传一张图片'
        return ''
      }
      case 'lostandfound': {
        const name = trimValue(form.name)
        const description = trimValue(form.description)
        const location = trimValue(form.location)
        const qq = trimValue(form.qq)
        const wechat = trimValue(form.wechat)
        const phone = trimValue(form.phone)

        if (!name) return '请输入物品名称'
        if (getMaxLengthMessage(name, LOST_FOUND_NAME_MAX_LENGTH, `物品名称不能超过${LOST_FOUND_NAME_MAX_LENGTH}个字符`)) return getMaxLengthMessage(name, LOST_FOUND_NAME_MAX_LENGTH, `物品名称不能超过${LOST_FOUND_NAME_MAX_LENGTH}个字符`)
        if (!description) return '请输入物品描述'
        if (getMaxLengthMessage(description, LOST_FOUND_DESCRIPTION_MAX_LENGTH, `物品描述不能超过${LOST_FOUND_DESCRIPTION_MAX_LENGTH}个字符`)) return getMaxLengthMessage(description, LOST_FOUND_DESCRIPTION_MAX_LENGTH, `物品描述不能超过${LOST_FOUND_DESCRIPTION_MAX_LENGTH}个字符`)
        if (!location) return '请输入地点'
        if (getMaxLengthMessage(location, LOST_FOUND_LOCATION_MAX_LENGTH, `地点不能超过${LOST_FOUND_LOCATION_MAX_LENGTH}个字符`)) return getMaxLengthMessage(location, LOST_FOUND_LOCATION_MAX_LENGTH, `地点不能超过${LOST_FOUND_LOCATION_MAX_LENGTH}个字符`)
        if (getMaxLengthMessage(qq, LOST_FOUND_QQ_MAX_LENGTH, `QQ 不能超过${LOST_FOUND_QQ_MAX_LENGTH}个字符`)) return getMaxLengthMessage(qq, LOST_FOUND_QQ_MAX_LENGTH, `QQ 不能超过${LOST_FOUND_QQ_MAX_LENGTH}个字符`)
        if (getMaxLengthMessage(wechat, LOST_FOUND_WECHAT_MAX_LENGTH, `微信不能超过${LOST_FOUND_WECHAT_MAX_LENGTH}个字符`)) return getMaxLengthMessage(wechat, LOST_FOUND_WECHAT_MAX_LENGTH, `微信不能超过${LOST_FOUND_WECHAT_MAX_LENGTH}个字符`)
        if (getMaxLengthMessage(phone, CONTACT_PHONE_MAX_LENGTH, `电话不能超过${CONTACT_PHONE_MAX_LENGTH}个字符`)) return getMaxLengthMessage(phone, CONTACT_PHONE_MAX_LENGTH, `电话不能超过${CONTACT_PHONE_MAX_LENGTH}个字符`)
        if (!qq && !wechat && !phone) {
          return '请至少填写一种联系方式'
        }
        if (!this.data.isEditMode && !this.data.images.length) return '请至少上传一张图片'
        return ''
      }
      case 'secret': {
        const content = trimValue(form.content)

        if (Number(this.data.secretTypeIndex) === 0 && !content) {
          return '请输入树洞内容'
        }
        if (getMaxLengthMessage(content, SECRET_CONTENT_MAX_LENGTH, `树洞内容不能超过${SECRET_CONTENT_MAX_LENGTH}个字符`)) return getMaxLengthMessage(content, SECRET_CONTENT_MAX_LENGTH, `树洞内容不能超过${SECRET_CONTENT_MAX_LENGTH}个字符`)
        if (Number(this.data.secretTypeIndex) === 1 && !this.data.voiceFile) {
          return '请先录制语音'
        }
        return ''
      }
      case 'express': {
        const nickname = trimValue(form.nickname)
        const realname = trimValue(form.realname)
        const targetName = trimValue(form.targetName)
        const content = trimValue(form.content)

        if (!nickname) return '请输入昵称'
        if (getMaxLengthMessage(nickname, EXPRESS_NAME_MAX_LENGTH, `昵称不能超过${EXPRESS_NAME_MAX_LENGTH}个字符`)) return getMaxLengthMessage(nickname, EXPRESS_NAME_MAX_LENGTH, `昵称不能超过${EXPRESS_NAME_MAX_LENGTH}个字符`)
        if (getMaxLengthMessage(realname, EXPRESS_NAME_MAX_LENGTH, `真名不能超过${EXPRESS_NAME_MAX_LENGTH}个字符`)) return getMaxLengthMessage(realname, EXPRESS_NAME_MAX_LENGTH, `真名不能超过${EXPRESS_NAME_MAX_LENGTH}个字符`)
        if (!targetName) return '请输入 TA 的名字'
        if (getMaxLengthMessage(targetName, EXPRESS_NAME_MAX_LENGTH, `TA 的名字不能超过${EXPRESS_NAME_MAX_LENGTH}个字符`)) return getMaxLengthMessage(targetName, EXPRESS_NAME_MAX_LENGTH, `TA 的名字不能超过${EXPRESS_NAME_MAX_LENGTH}个字符`)
        if (!content) return '请输入表白内容'
        if (getMaxLengthMessage(content, EXPRESS_CONTENT_MAX_LENGTH, `表白内容不能超过${EXPRESS_CONTENT_MAX_LENGTH}个字符`)) return getMaxLengthMessage(content, EXPRESS_CONTENT_MAX_LENGTH, `表白内容不能超过${EXPRESS_CONTENT_MAX_LENGTH}个字符`)
        return ''
      }
      case 'topic': {
        const topic = trimValue(form.topic)
        const content = trimValue(form.content)

        if (!topic) return '请输入话题关键词'
        if (getMaxLengthMessage(topic, TOPIC_KEYWORD_MAX_LENGTH, `话题关键词不能超过${TOPIC_KEYWORD_MAX_LENGTH}个字符`)) return getMaxLengthMessage(topic, TOPIC_KEYWORD_MAX_LENGTH, `话题关键词不能超过${TOPIC_KEYWORD_MAX_LENGTH}个字符`)
        if (!content) return '请输入话题内容'
        if (getMaxLengthMessage(content, TOPIC_CONTENT_MAX_LENGTH, `话题内容不能超过${TOPIC_CONTENT_MAX_LENGTH}个字符`)) return getMaxLengthMessage(content, TOPIC_CONTENT_MAX_LENGTH, `话题内容不能超过${TOPIC_CONTENT_MAX_LENGTH}个字符`)
        return ''
      }
      case 'delivery': {
        const pickupAddress = trimValue(form.pickupAddress)
        const pickupCode = trimValue(form.pickupCode)
        const deliveryAddress = trimValue(form.deliveryAddress)
        const contactPhone = trimValue(form.contactPhone)
        const description = trimValue(form.description)

        if (!pickupAddress) return '请输入取件地点'
        if (getMaxLengthMessage(pickupAddress, DELIVERY_COMPANY_MAX_LENGTH, `取件地点不能超过${DELIVERY_COMPANY_MAX_LENGTH}个字符`)) return getMaxLengthMessage(pickupAddress, DELIVERY_COMPANY_MAX_LENGTH, `取件地点不能超过${DELIVERY_COMPANY_MAX_LENGTH}个字符`)
        if (getExactLengthMessage(pickupCode, 11, '取件码长度必须为11个字符')) return getExactLengthMessage(pickupCode, 11, '取件码长度必须为11个字符')
        if (!deliveryAddress) return '请输入送达地址'
        if (getMaxLengthMessage(deliveryAddress, DELIVERY_ADDRESS_MAX_LENGTH, `送达地址不能超过${DELIVERY_ADDRESS_MAX_LENGTH}个字符`)) return getMaxLengthMessage(deliveryAddress, DELIVERY_ADDRESS_MAX_LENGTH, `送达地址不能超过${DELIVERY_ADDRESS_MAX_LENGTH}个字符`)
        if (!contactPhone) return '请输入联系人电话'
        if (getMaxLengthMessage(contactPhone, CONTACT_PHONE_MAX_LENGTH, `联系人电话不能超过${CONTACT_PHONE_MAX_LENGTH}个字符`)) return getMaxLengthMessage(contactPhone, CONTACT_PHONE_MAX_LENGTH, `联系人电话不能超过${CONTACT_PHONE_MAX_LENGTH}个字符`)
        if (getMaxLengthMessage(description, DELIVERY_REMARKS_MAX_LENGTH, `备注说明不能超过${DELIVERY_REMARKS_MAX_LENGTH}个字符`)) return getMaxLengthMessage(description, DELIVERY_REMARKS_MAX_LENGTH, `备注说明不能超过${DELIVERY_REMARKS_MAX_LENGTH}个字符`)
        if (!(Number(form.reward || 0) > 0)) return '请输入有效的跑腿费'
        return ''
      }
      case 'dating': {
        const nickname = trimValue(form.nickname)
        const faculty = trimValue(form.faculty)
        const hometown = trimValue(form.hometown)
        const qq = trimValue(form.qq)
        const wechat = trimValue(form.wechat)
        const content = trimValue(form.content)

        if (!nickname) return '请输入昵称'
        if (getMaxLengthMessage(nickname, DATING_NICKNAME_MAX_LENGTH, `昵称不能超过${DATING_NICKNAME_MAX_LENGTH}个字符`)) return getMaxLengthMessage(nickname, DATING_NICKNAME_MAX_LENGTH, `昵称不能超过${DATING_NICKNAME_MAX_LENGTH}个字符`)
        if (!faculty) return '请输入专业'
        if (getMaxLengthMessage(faculty, DATING_FACULTY_MAX_LENGTH, `专业不能超过${DATING_FACULTY_MAX_LENGTH}个字符`)) return getMaxLengthMessage(faculty, DATING_FACULTY_MAX_LENGTH, `专业不能超过${DATING_FACULTY_MAX_LENGTH}个字符`)
        if (!hometown) return '请输入家乡'
        if (getMaxLengthMessage(hometown, DATING_HOMETOWN_MAX_LENGTH, `家乡不能超过${DATING_HOMETOWN_MAX_LENGTH}个字符`)) return getMaxLengthMessage(hometown, DATING_HOMETOWN_MAX_LENGTH, `家乡不能超过${DATING_HOMETOWN_MAX_LENGTH}个字符`)
        if (getMaxLengthMessage(qq, DATING_QQ_MAX_LENGTH, `QQ 不能超过${DATING_QQ_MAX_LENGTH}个字符`)) return getMaxLengthMessage(qq, DATING_QQ_MAX_LENGTH, `QQ 不能超过${DATING_QQ_MAX_LENGTH}个字符`)
        if (getMaxLengthMessage(wechat, DATING_WECHAT_MAX_LENGTH, `微信不能超过${DATING_WECHAT_MAX_LENGTH}个字符`)) return getMaxLengthMessage(wechat, DATING_WECHAT_MAX_LENGTH, `微信不能超过${DATING_WECHAT_MAX_LENGTH}个字符`)
        if (!qq && !wechat) {
          return 'QQ 和微信至少填写一个'
        }
        if (!content) return '请输入介绍内容'
        if (getMaxLengthMessage(content, DATING_CONTENT_MAX_LENGTH, `介绍内容不能超过${DATING_CONTENT_MAX_LENGTH}个字符`)) return getMaxLengthMessage(content, DATING_CONTENT_MAX_LENGTH, `介绍内容不能超过${DATING_CONTENT_MAX_LENGTH}个字符`)
        return ''
      }
      case 'photograph': {
        const title = trimValue(form.title)
        const content = trimValue(form.content)

        if (!title) return '请输入作品标题'
        if (getMaxLengthMessage(title, PHOTOGRAPH_TITLE_MAX_LENGTH, `作品标题不能超过${PHOTOGRAPH_TITLE_MAX_LENGTH}个字符`)) return getMaxLengthMessage(title, PHOTOGRAPH_TITLE_MAX_LENGTH, `作品标题不能超过${PHOTOGRAPH_TITLE_MAX_LENGTH}个字符`)
        if (getMaxLengthMessage(content, PHOTOGRAPH_CONTENT_MAX_LENGTH, `拍摄说明不能超过${PHOTOGRAPH_CONTENT_MAX_LENGTH}个字符`)) return getMaxLengthMessage(content, PHOTOGRAPH_CONTENT_MAX_LENGTH, `拍摄说明不能超过${PHOTOGRAPH_CONTENT_MAX_LENGTH}个字符`)
        if (!this.data.images.length) return '请至少上传一张图片'
        return ''
      }
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
