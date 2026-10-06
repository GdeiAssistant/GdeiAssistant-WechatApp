const userApi = require('../../services/apis/user.js')
const socialApi = require('../../services/apis/social.js')
const uploadService = require('../../services/upload.js')
const pageUtils = require('../../utils/page.js')
const { maskAccount } = require('../../utils/mask.js')
const LOCATION_REGIONS = require('../../constants/location-regions.js')
var themeUtil = require('../../utils/theme')
var i18n = require('../../utils/i18n')
const {
  NOT_SELECTED,
  fetchProfileOptions,
  getFacultyCodeByLabel,
  getFacultyOptions,
  getFacultyDictionaryOptions,
  getEnrollmentYearOptions,
  getMajorCodeByLabel,
  getMajorOptions,
  getMajorLabelByCode,
  canSelectMajor,
  formatLocationDisplay,
  getLocationNodeName,
  getLocationDisplay,
  localizeIpArea
} = require('../../constants/profile.js')

const NICKNAME_MAX_LENGTH = 32
const INTRODUCTION_MAX_LENGTH = 80

const { buildLocationDisplay, getSafeIndex, clampLocationIndices, buildLocationRanges, buildLocationSelection, findLocationIndices, normalizeProfile, createEmptyProfile, syncProfileLocationDisplay, displayValue, toDisplayOptions, buildEditableState, parseBirthdayPayload, buildInteractionPromise, buildTodayDate, buildAvatarFile, buildAvatarFileName, validateNickname, validateIntroduction } = require('./profile-view-model.js')

Page({
  onShow: function () {
    themeUtil.applyTheme(this)
    this.refreshI18n()
  },
  refreshI18n: function () {
    this.setData({
      t: {
        navTitle: i18n.t('profilePage.navTitle'),
        loadingProfile: i18n.t('profilePage.loadingProfile'),
        uploading: i18n.t('profilePage.uploading'),
        changeAvatar: i18n.t('profilePage.changeAvatar'),
        notFilled: i18n.t('profilePage.notFilled'),
        usernameLabel: i18n.t('profilePage.usernameLabel'),
        ipAreaLabel: i18n.t('profilePage.ipAreaLabel'),
        empty: i18n.t('profilePage.empty'),
        updatingAvatar: i18n.t('profilePage.updatingAvatar'),
        savingProfile: i18n.t('profilePage.savingProfile'),
        accountInfo: i18n.t('profilePage.accountInfo'),
        nickname: i18n.t('profilePage.nickname'),
        birthday: i18n.t('profilePage.birthday'),
        faculty: i18n.t('profilePage.faculty'),
        major: i18n.t('profilePage.major'),
        enrollmentYear: i18n.t('profilePage.enrollmentYear'),
        location: i18n.t('profilePage.location'),
        hometown: i18n.t('profilePage.hometown'),
        introduction: i18n.t('profilePage.introduction'),
        introPlaceholder: i18n.t('profilePage.introPlaceholder'),
        notSelected: i18n.t('profilePage.notSelected'),
        following: i18n.t('social.stats.following'),
        followers: i18n.t('social.stats.followers'),
        friends: i18n.t('social.stats.friends'),
        directMessages: i18n.t('social.entry.directMessages'),
        socialSection: i18n.t('social.entry.directMessages'),
        saveIntroduction: i18n.t('profilePage.saveIntroduction'),
        savingIntroduction: i18n.t('profilePage.savingProfile')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
    // Refresh display options and display values after locale change
    var updateData = {
      facultyOptions: getFacultyOptions(),
      facultyDisplayOptions: toDisplayOptions(getFacultyOptions()),
      enrollmentDisplayOptions: toDisplayOptions(this.data.enrollmentOptions || getEnrollmentYearOptions())
    }
    if (this.data.form) {
      const tree = this.getLocationTree()
      const form = this.data.form
      const faculty = getFacultyDictionaryOptions().find(function(option) { return option.code === form.facultyCode })
      const facultyLabel = faculty ? faculty.label : form.faculty
      const majorLabel = getMajorLabelByCode(facultyLabel, form.majorCode) || form.major
      updateData['form.faculty'] = facultyLabel
      updateData['form.major'] = majorLabel
      updateData.displayFaculty = displayValue(facultyLabel)
      updateData.displayMajor = displayValue(majorLabel)
      updateData.majorOptions = getMajorOptions(facultyLabel)
      updateData.majorDisplayOptions = toDisplayOptions(updateData.majorOptions)
      updateData.facultyIndex = getSafeIndex(updateData.facultyOptions, facultyLabel)
      updateData.majorIndex = getSafeIndex(updateData.majorOptions, majorLabel)
      updateData['form.location'] = getLocationDisplay(form.locationCodes, form.location, i18n.getCurrentLocale(), tree)
      updateData['form.hometown'] = getLocationDisplay(form.hometownCodes, form.hometown, i18n.getCurrentLocale(), tree)
      updateData.locationRanges = buildLocationRanges(tree, this.data.locationPickerIndex).ranges
      updateData.hometownRanges = buildLocationRanges(tree, this.data.hometownPickerIndex).ranges
    }
    if (this.data.profile) {
      updateData.profile = syncProfileLocationDisplay(normalizeProfile(this.data.profile), this.getLocationTree())
    }
    this.setData(updateData)
  },
  data: {
    themeClass: '',
    t: {},
    loading: true,
    errorMessage: null,
    todayDate: '',
    profile: null,
    socialMe: null,
    form: null,
    facultyOptions: getFacultyOptions(),
    facultyDisplayOptions: toDisplayOptions(getFacultyOptions()),
    majorOptions: [NOT_SELECTED],
    majorDisplayOptions: [i18n.t('profilePage.notSelected')],
    enrollmentOptions: getEnrollmentYearOptions(),
    enrollmentDisplayOptions: toDisplayOptions(getEnrollmentYearOptions()),
    displayFaculty: '',
    displayMajor: '',
    facultyIndex: 0,
    majorIndex: 0,
    enrollmentIndex: 0,
    majorDisabled: true,
    locationRanges: [[], [], []],
    locationPickerIndex: [0, 0, 0],
    hometownRanges: [[], [], []],
    hometownPickerIndex: [0, 0, 0],
    locationPickerDisabled: true,
    hometownPickerDisabled: true,
    savingField: '',
    saveStatusText: '',
    avatarUploading: false
  },

  setEditableState: function(profile) {
    const editableState = buildEditableState(profile, this.getLocationTree())
    this.setData(editableState)
  },

  getLocationTree: function() {
    return this.locationTree || LOCATION_REGIONS
  },

  setSaveStatus: function(text) {
    if (this._saveStatusTimer) {
      clearTimeout(this._saveStatusTimer)
      this._saveStatusTimer = null
    }

    this.setData({
      saveStatusText: text || ''
    })

    if (!text) {
      return
    }

    this._saveStatusTimer = setTimeout(() => {
      this.setData({
        saveStatusText: ''
      })
      this._saveStatusTimer = null
    }, 1800)
  },

  applyProfilePatch: function(patch) {
    const introductionDraft = this.data.form && this.data.form.introduction
    const hasIntroductionPatch = Object.prototype.hasOwnProperty.call(patch || {}, 'introduction')
    const preserveIntroductionDraft = typeof introductionDraft === 'string'
      && introductionDraft !== String((this.data.profile || {}).introduction || '')
      && (!hasIntroductionPatch || introductionDraft.trim() !== String(patch.introduction || '').trim())
    const nextProfile = syncProfileLocationDisplay(
      normalizeProfile(Object.assign({}, this.data.profile || {}, patch || {})),
      this.getLocationTree()
    )
    this.setData({
      profile: nextProfile
    })
    this.setEditableState(nextProfile)
    if (preserveIntroductionDraft) {
      this.setData({ 'form.introduction': introductionDraft })
    }
  },

  queueProfileSave: function(fieldKey, promiseFactory, patch) {
    if (!this._saveQueue) {
      this._saveQueue = Promise.resolve()
    }

    this._saveQueue = this._saveQueue.then(() => {
      this.setData({
        savingField: fieldKey
      })
      this.setSaveStatus('')

      return buildInteractionPromise(promiseFactory).then(() => {
        this.applyProfilePatch(patch)
        this.setSaveStatus(i18n.t('profilePage.saved'))
      }).catch((error) => {
        const introductionDraft = this.data.form && this.data.form.introduction
        if (this.data.profile) {
          this.setEditableState(this.data.profile)
          if (typeof introductionDraft === 'string') {
            this.setData({ 'form.introduction': introductionDraft })
          }
        }
        pageUtils.showTopTips(this, error.message)
      }).finally(() => {
        this.setData({
          savingField: ''
        })
      })
    })

    return this._saveQueue
  },

  loadProfilePage: function() {
    return pageUtils.runWithNavigationLoading(this, function() {
      return Promise.allSettled([
        userApi.getAvatar(),
        userApi.getProfile(),
        fetchProfileOptions(),
        socialApi.getMe()
      ])
    }).then((results) => {
      const avatarResult = results[0] && results[0].status === 'fulfilled' ? results[0].value : null
      const profileResult = results[1] && results[1].status === 'fulfilled' ? results[1].value : null
      const profileOptionsResult = results[2] && results[2].status === 'fulfilled' ? results[2].value : null
      const socialResult = results[3] && results[3].status === 'fulfilled' ? results[3].value : null

      const locationTree = this.getLocationTree()
      const avatarValue = avatarResult && avatarResult.success ? avatarResult.data : ''
      const profileErrorMessage = profileResult && !profileResult.success
        ? profileResult.message
        : i18n.t('profilePage.loadProfileFailed')
      const normalizedProfile = syncProfileLocationDisplay(
        profileResult && profileResult.success
          ? normalizeProfile(profileResult.data, avatarValue)
          : createEmptyProfile(avatarValue),
        locationTree
      )

      this.setData({
        profile: normalizedProfile,
        socialMe: socialResult && socialResult.success ? socialResult.data : null,
        todayDate: buildTodayDate(),
        facultyOptions: getFacultyOptions(),
        facultyDisplayOptions: toDisplayOptions(getFacultyOptions())
      })
      this.setEditableState(normalizedProfile)

      if (!profileResult || !profileResult.success) {
        pageUtils.showTopTips(this, profileErrorMessage)
      }

      if (!profileOptionsResult) {
        pageUtils.showTopTips(this, i18n.t('profilePage.optionsFallback'))
      }
    }).catch((error) => {
      const fallbackProfile = syncProfileLocationDisplay(createEmptyProfile(''), this.getLocationTree())
      this.setData({
        profile: fallbackProfile,
        todayDate: buildTodayDate(),
        facultyOptions: getFacultyOptions(),
        facultyDisplayOptions: toDisplayOptions(getFacultyOptions())
      })
      this.setEditableState(fallbackProfile)
      pageUtils.showTopTips(this, error.message)
    }).finally(() => {
      this.setData({
        loading: false
      })
    })
  },

  openSocialEntry: function(event) {
    const target = event.currentTarget.dataset.target
    if (target === 'messages') {
      wx.navigateTo({ url: '/pages/conversationList/conversationList' })
      return
    }
    if (target !== 'following' && target !== 'followers' && target !== 'friends') {
      return
    }
    if (!this.data.socialMe || !this.data.socialMe.id) {
      return
    }
    wx.navigateTo({
      url:
        '/pages/relationshipList/relationshipList?id=' +
        encodeURIComponent(this.data.socialMe.id) +
        '&kind=' +
        encodeURIComponent(target)
    })
  },

  saveIntroduction: function() {
    if (!this.data.profile || !this.data.form || this.data.savingField === 'introduction') {
      return
    }

    const introduction = String(this.data.form.introduction || '').trim()
    const introductionErrorMessage = validateIntroduction(introduction)
    if (introductionErrorMessage) {
      pageUtils.showTopTips(this, introductionErrorMessage)
      return
    }

    if (introduction === String(this.data.profile.introduction || '').trim()) {
      this.setSaveStatus(i18n.t('profilePage.saved'))
      return
    }

    this.queueProfileSave('introduction', function() {
      return userApi.updateIntroduction(introduction)
    }, {
      introduction: introduction
    })
  },

  refreshAvatar: function(successText) {
    return userApi.getAvatar().then((result) => {
      if (!result.success) {
        throw new Error(result.message || i18n.t('profilePage.avatarRefreshFailed'))
      }

      this.applyProfilePatch({
        avatar: result.data || '/image/default.png'
      })
      this.setSaveStatus(successText || i18n.t('profilePage.avatarUpdated'))
    })
  },

  handleAvatarTap: function() {
    const hasCustomAvatar = !!(this.data.profile && this.data.profile.avatar && this.data.profile.avatar !== '/image/default.png')
    const itemList = hasCustomAvatar ? [i18n.t('profilePage.changeAvatarAction'), i18n.t('profilePage.resetAvatarAction')] : [i18n.t('profilePage.changeAvatarAction')]

    wx.showActionSheet({
      itemList: itemList,
      success: (result) => {
        if (result.tapIndex === 0) {
          this.chooseAvatar()
          return
        }

        if (hasCustomAvatar && result.tapIndex === 1) {
          this.confirmDeleteAvatar()
        }
      }
    })
  },

  chooseAvatar: function() {
    if (this.data.avatarUploading) {
      return
    }

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (result) => {
        const filePath = result.tempFilePaths && result.tempFilePaths[0]
        if (!filePath) {
          return
        }

        this.uploadAvatar(filePath)
      }
    })
  },

  uploadAvatar: function(filePath) {
    const avatarFile = buildAvatarFile(filePath)

    this.setData({
      avatarUploading: true
    })
    this.setSaveStatus('')

    pageUtils.runWithNavigationLoading(this, () => {
      return Promise.all([
        uploadService.uploadLocalFileByPresignedUrl(avatarFile, {
          fileName: buildAvatarFileName(filePath, 'avatar')
        }),
        uploadService.uploadLocalFileByPresignedUrl(avatarFile, {
          fileName: buildAvatarFileName(filePath, 'avatar-hd')
        })
      ]).then((result) => {
        return userApi.updateAvatar(result[0], result[1])
      })
    }, {
      loadingKey: ''
    }).then((result) => {
      if (!result.success) {
        throw new Error(result.message || i18n.t('profilePage.avatarUploadFailed'))
      }

      return this.refreshAvatar(i18n.t('profilePage.avatarUpdated'))
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    }).finally(() => {
      this.setData({
        avatarUploading: false
      })
    })
  },

  confirmDeleteAvatar: function() {
    if (this.data.avatarUploading) {
      return
    }

    wx.showModal({
      title: i18n.t('profilePage.resetAvatarTitle'),
      content: i18n.t('profilePage.resetAvatarConfirm'),
      success: (result) => {
        if (!result.confirm) {
          return
        }

        this.setData({
          avatarUploading: true
        })
        this.setSaveStatus('')

        pageUtils.runWithNavigationLoading(this, () => {
          return userApi.deleteAvatar()
        }, {
          loadingKey: ''
        }).then((response) => {
          if (!response.success) {
            throw new Error(response.message || i18n.t('profilePage.resetAvatarFailed'))
          }

          return this.refreshAvatar(i18n.t('profilePage.avatarReset'))
        }).catch((error) => {
          pageUtils.showTopTips(this, error.message)
        }).finally(() => {
          this.setData({
            avatarUploading: false
          })
        })
      }
    })
  },

  handleTextInput: function(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  handleTextBlur: function(event) {
    const field = event.currentTarget.dataset.field
    if (field !== 'introduction' || !this.data.profile || !this.data.form) {
      return
    }

    const introduction = String(this.data.form.introduction || '').trim()
    const introductionErrorMessage = validateIntroduction(introduction)
    if (introductionErrorMessage) {
      this.setData({
        'form.introduction': this.data.profile.introduction || ''
      })
      pageUtils.showTopTips(this, introductionErrorMessage)
      return
    }

    if (introduction === String(this.data.profile.introduction || '').trim()) {
      this.setData({
        'form.introduction': this.data.profile.introduction || ''
      })
      return
    }
    // Save is triggered explicitly via the save button (saveIntroduction)
  },

  openNicknameEditor: function() {
    if (!this.data.profile || !this.data.form || this.data.savingField === 'nickname') {
      return
    }

    const currentNickname = String(this.data.form.nickname || this.data.profile.nickname || '').trim()
    wx.showModal({
      title: i18n.t('profilePage.editNicknameTitle'),
      editable: true,
      placeholderText: i18n.t('profilePage.editNicknamePlaceholder'),
      content: '',
      success: (result) => {
        if (!result.confirm) {
          return
        }

        const nickname = String(result.content || '').trim()
        const nicknameErrorMessage = validateNickname(nickname)
        if (nicknameErrorMessage) {
          this.setData({
            'form.nickname': currentNickname
          })
          pageUtils.showTopTips(this, nicknameErrorMessage)
          return
        }

        if (nickname === String(this.data.profile.nickname || '').trim()) {
          this.setData({
            'form.nickname': this.data.profile.nickname || ''
          })
          return
        }

        this.setData({
          'form.nickname': nickname
        })

        this.queueProfileSave('nickname', function() {
          return userApi.updateNickname(nickname)
        }, {
          nickname: nickname
        })
      }
    })
  },

  handleBirthdayChange: function(event) {
    const birthday = event.detail.value
    this.setData({
      'form.birthday': birthday
    })

    if (birthday === String((this.data.profile && this.data.profile.birthday) || '')) {
      return
    }

    const birthdayPayload = parseBirthdayPayload(birthday)
    this.queueProfileSave('birthday', function() {
      return userApi.updateBirthday(birthdayPayload)
    }, {
      birthday: birthday
    })
  },

  handleFacultyChange: function(event) {
    const facultyIndex = Number(event.detail.value)
    const facultyOptions = this.data.facultyOptions || getFacultyOptions()
    const faculty = facultyOptions[facultyIndex] || facultyOptions[0] || NOT_SELECTED
    const facultyCode = getFacultyCodeByLabel(faculty)
    const majorOptions = getMajorOptions(faculty)
    const profile = this.data.profile || {}
    const currentMajor = String((this.data.form && this.data.form.major) || profile.major || '')
    const nextMajor = String(profile.faculty || '') === faculty && majorOptions.indexOf(currentMajor) !== -1
      ? currentMajor
      : (majorOptions[0] || NOT_SELECTED)

    this.setData({
      facultyIndex: facultyIndex,
      majorOptions: majorOptions,
      majorDisplayOptions: toDisplayOptions(majorOptions),
      majorIndex: getSafeIndex(majorOptions, nextMajor),
      majorDisabled: !canSelectMajor(faculty),
      'form.faculty': faculty,
      'form.facultyCode': facultyCode,
      'form.major': nextMajor,
      'form.majorCode': getMajorCodeByLabel(faculty, nextMajor) || '',
      displayFaculty: displayValue(faculty),
      displayMajor: displayValue(nextMajor)
    })

    if (facultyCode === null) {
      pageUtils.showTopTips(this, i18n.t('profilePage.facultyInvalid'))
      return
    }

    if (faculty === String(profile.faculty || '') && nextMajor === String(profile.major || '')) {
      return
    }

    this.queueProfileSave('faculty', function() {
      return buildInteractionPromise(function() {
        return userApi.updateFaculty(facultyCode)
      }).then(function() {
        if (nextMajor && nextMajor !== NOT_SELECTED) {
          return buildInteractionPromise(function() {
            return userApi.updateMajor(getMajorCodeByLabel(faculty, nextMajor) || '')
          })
        }
      })
    }, {
      faculty: {
        code: facultyCode,
        label: faculty
      },
      major: {
        code: getMajorCodeByLabel(faculty, nextMajor) || 'unselected',
        label: nextMajor
      }
    })
  },

  handleMajorChange: function(event) {
    const majorIndex = Number(event.detail.value)
    const major = (this.data.majorOptions || [])[majorIndex] || NOT_SELECTED
    const faculty = String((this.data.form && this.data.form.faculty) || '')
    const majorCode = getMajorCodeByLabel(faculty, major) || ''

    this.setData({
      majorIndex: majorIndex,
      'form.major': major,
      'form.majorCode': majorCode,
      displayMajor: displayValue(major)
    })

    if (major === String((this.data.profile && this.data.profile.major) || '')) {
      return
    }

    this.queueProfileSave('major', function() {
      return userApi.updateMajor(majorCode)
    }, {
      major: {
        code: majorCode || 'unselected',
        label: major
      }
    })
  },

  handleEnrollmentChange: function(event) {
    const enrollmentIndex = Number(event.detail.value)
    const enrollmentValue = (this.data.enrollmentOptions || [])[enrollmentIndex] || NOT_SELECTED
    const nextEnrollment = enrollmentValue === NOT_SELECTED ? '' : enrollmentValue

    this.setData({
      enrollmentIndex: enrollmentIndex,
      'form.enrollment': nextEnrollment
    })

    if (nextEnrollment === String((this.data.profile && this.data.profile.enrollment) || '')) {
      return
    }

    this.queueProfileSave('enrollment', function() {
      return userApi.updateEnrollment(nextEnrollment ? Number(nextEnrollment) : null)
    }, {
      enrollment: nextEnrollment
    })
  },

  handleLocationColumnChange: function(event) {
    const target = event.currentTarget.dataset.target
    const column = Number(event.detail.column)
    const nextValue = Number(event.detail.value)
    const indexKey = target === 'hometown' ? 'hometownPickerIndex' : 'locationPickerIndex'
    const rangeKey = target === 'hometown' ? 'hometownRanges' : 'locationRanges'
    const currentIndices = (this.data[indexKey] || [0, 0, 0]).slice()

    currentIndices[column] = nextValue
    if (column === 0) {
      currentIndices[1] = 0
      currentIndices[2] = 0
    }
    if (column === 1) {
      currentIndices[2] = 0
    }

    const pickerState = buildLocationRanges(this.getLocationTree(), currentIndices)
    this.setData({
      [indexKey]: pickerState.indices,
      [rangeKey]: pickerState.ranges
    })
  },

  handleLocationChange: function(event) {
    const target = event.currentTarget.dataset.target
    const locationTree = this.getLocationTree()
    const pickerState = buildLocationRanges(locationTree, event.detail.value)
    const selection = buildLocationSelection(locationTree, pickerState.indices)

    if (!selection) {
      return
    }

    const indexKey = target === 'hometown' ? 'hometownPickerIndex' : 'locationPickerIndex'
    const rangeKey = target === 'hometown' ? 'hometownRanges' : 'locationRanges'
    const fieldKey = target === 'hometown' ? 'hometown' : 'location'
    const codeKey = target === 'hometown' ? 'hometownCodes' : 'locationCodes'
    const profile = this.data.profile || {}
    const profilePrefix = target === 'hometown' ? 'hometown' : 'location'

    this.setData({
      [indexKey]: pickerState.indices,
      [rangeKey]: pickerState.ranges,
      [`form.${fieldKey}`]: selection.display,
      [`form.${codeKey}`]: selection.codes
    })

    if (
      String(profile[`${profilePrefix}Region`] || '') === String(selection.codes.region || '') &&
      String(profile[`${profilePrefix}State`] || '') === String(selection.codes.state || '') &&
      String(profile[`${profilePrefix}City`] || '') === String(selection.codes.city || '')
    ) {
      return
    }

    this.queueProfileSave(fieldKey, function() {
      return target === 'hometown'
        ? userApi.updateHometown(selection.codes)
        : userApi.updateLocation(selection.codes)
    }, target === 'hometown' ? {
      hometown: {
        region: selection.codes.region,
        state: selection.codes.state,
        city: selection.codes.city,
        displayName: selection.display
      }
    } : {
      location: {
        region: selection.codes.region,
        state: selection.codes.state,
        city: selection.codes.city,
        displayName: selection.display
      }
    })
  },

  onLoad: function() {
    this.locationTree = LOCATION_REGIONS
    this.loadProfilePage()
  },

  onUnload: function() {
    if (this._saveStatusTimer) {
      clearTimeout(this._saveStatusTimer)
      this._saveStatusTimer = null
    }
  },

  onPullDownRefresh: function() {
    this.loadProfilePage().finally(function() {
      wx.stopPullDownRefresh()
    })
  },

  onShareAppMessage: function() {
    return {
      title: i18n.t('profilePage.shareTitle'),
      path: '/pages/profile/profile'
    }
  }
})
