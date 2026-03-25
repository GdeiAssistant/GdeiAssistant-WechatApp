const userApi = require('../../services/apis/user.js')
const uploadService = require('../../services/upload.js')
const pageUtils = require('../../utils/page.js')
const LOCATION_REGIONS = require('../../constants/location-regions.js')
var themeUtil = require('../../utils/theme')
var i18n = require('../../utils/i18n')
const {
  NOT_SELECTED,
  fetchProfileOptions,
  getFacultyCodeByLabel,
  getFacultyOptions,
  getEnrollmentYearOptions,
  getMajorCodeByLabel,
  getMajorOptions,
  canSelectMajor,
  formatLocationDisplay
} = require('../../constants/profile.js')

const NICKNAME_MAX_LENGTH = 32
const INTRODUCTION_MAX_LENGTH = 80

function getLocationNodeName(node) {
  if (!node || typeof node !== 'object') {
    return ''
  }

  return String(node.aliasesName || node.name || '').trim()
}

function buildLocationDisplay(region, state, city) {
  return formatLocationDisplay(
    getLocationNodeName(region),
    getLocationNodeName(state),
    getLocationNodeName(city)
  )
}

function normalizeLocationText(text) {
  return String(text || '')
    .replace(/(?:[\uD83C][\uDDE6-\uDDFF])+/g, '')
    .replace(/\uFE0F/g, '')
    .replace(/\s+/g, '')
}

function collectLocationNodeNames(node) {
  const names = []

  function pushName(value) {
    const nextValue = String(value || '').trim()
    if (nextValue && names.indexOf(nextValue) === -1) {
      names.push(nextValue)
    }
  }

  pushName(node && node.name)
  pushName(node && node.aliasesName)

  return names
}

function buildLocationCandidates(region, state, city) {
  const candidates = []
  const regionNames = collectLocationNodeNames(region)
  const stateNames = collectLocationNodeNames(state)
  const cityNames = collectLocationNodeNames(city)

  function pushCandidate(value) {
    const nextValue = String(value || '').trim()
    if (nextValue && candidates.indexOf(nextValue) === -1) {
      candidates.push(nextValue)
    }
  }

  regionNames.forEach(function(regionName) {
    pushCandidate(regionName)
    stateNames.forEach(function(stateName) {
      pushCandidate(formatLocationDisplay(regionName, stateName, ''))
      cityNames.forEach(function(cityName) {
        pushCandidate(formatLocationDisplay(regionName, stateName, cityName))
      })
    })
  })

  stateNames.forEach(function(stateName) {
    pushCandidate(stateName)
    cityNames.forEach(function(cityName) {
      pushCandidate(formatLocationDisplay('', stateName, cityName))
    })
  })

  cityNames.forEach(function(cityName) {
    pushCandidate(cityName)
  })

  return candidates
}

function hasLocationValue(codes, text) {
  const locationCodes = codes || {}
  return !!(
    String(locationCodes.region || '').trim() ||
    String(locationCodes.state || '').trim() ||
    String(locationCodes.city || '').trim() ||
    normalizeLocationText(text)
  )
}

function getSafeIndex(options, value) {
  const targetValue = String(value || '').trim()
  const matchedIndex = (options || []).indexOf(targetValue)
  return matchedIndex === -1 ? 0 : matchedIndex
}

function clampLocationIndices(locationTree, sourceIndices) {
  if (!Array.isArray(locationTree) || !locationTree.length) {
    return [0, 0, 0]
  }

  const inputIndices = Array.isArray(sourceIndices) ? sourceIndices : [0, 0, 0]
  const regionIndex = Math.min(Math.max(Number(inputIndices[0]) || 0, 0), locationTree.length - 1)
  const region = locationTree[regionIndex]
  const states = region.states || []
  const stateIndex = Math.min(Math.max(Number(inputIndices[1]) || 0, 0), Math.max(states.length - 1, 0))
  const state = states[stateIndex] || { cities: [] }
  const cities = state.cities || []
  const cityIndex = Math.min(Math.max(Number(inputIndices[2]) || 0, 0), Math.max(cities.length - 1, 0))

  return [regionIndex, stateIndex, cityIndex]
}

function buildLocationRanges(locationTree, sourceIndices) {
  if (!Array.isArray(locationTree) || !locationTree.length) {
    return {
      indices: [0, 0, 0],
      ranges: [[], [], []]
    }
  }

  const safeIndices = clampLocationIndices(locationTree, sourceIndices)
  const region = locationTree[safeIndices[0]]
  const state = (region.states || [])[safeIndices[1]] || { cities: [] }

  return {
    indices: safeIndices,
    ranges: [
      locationTree.map(function(item) { return item.name }),
      (region.states || []).map(function(item) { return item.name }),
      (state.cities || []).map(function(item) { return item.name })
    ]
  }
}

function buildLocationSelection(locationTree, sourceIndices) {
  if (!Array.isArray(locationTree) || !locationTree.length) {
    return null
  }

  const safeIndices = clampLocationIndices(locationTree, sourceIndices)
  const region = locationTree[safeIndices[0]]
  const state = (region.states || [])[safeIndices[1]]
  const city = state && (state.cities || [])[safeIndices[2]]

  if (!region) {
    return null
  }

  return {
    display: buildLocationDisplay(region, state, city),
    codes: {
      region: region.code,
      state: state ? state.code : '',
      city: city ? city.code : ''
    },
    indices: safeIndices
  }
}

function findLocationIndicesByText(locationTree, text) {
  const normalizedText = normalizeLocationText(text)

  if (!normalizedText) {
    return null
  }

  let partialMatch = null

  for (let regionIndex = 0; regionIndex < locationTree.length; regionIndex += 1) {
    const region = locationTree[regionIndex]
    const states = region.states || []
    const regionCandidates = buildLocationCandidates(region, null, null)

    if (regionCandidates.some(function(candidate) {
      return normalizeLocationText(candidate) === normalizedText
    })) {
      return [regionIndex, 0, 0]
    }

    for (let stateIndex = 0; stateIndex < states.length; stateIndex += 1) {
      const state = states[stateIndex]
      const cities = state.cities || []
      const stateCandidates = buildLocationCandidates(region, state, null)

      if (stateCandidates.some(function(candidate) {
        return normalizeLocationText(candidate) === normalizedText
      })) {
        return [regionIndex, stateIndex, 0]
      }

      for (let cityIndex = 0; cityIndex < cities.length; cityIndex += 1) {
        const city = cities[cityIndex]
        const candidates = buildLocationCandidates(region, state, city)

        if (candidates.some(function(candidate) {
          return normalizeLocationText(candidate) === normalizedText
        })) {
          return [regionIndex, stateIndex, cityIndex]
        }

        if (!partialMatch) {
          const cityNames = collectLocationNodeNames(city)
          if (cityNames.some(function(cityName) {
            return normalizedText.indexOf(normalizeLocationText(cityName)) !== -1
          })) {
            partialMatch = [regionIndex, stateIndex, cityIndex]
          }
        }
      }
    }
  }

  return partialMatch
}

function findLocationIndices(locationTree, codes, text) {
  if (!Array.isArray(locationTree) || !locationTree.length) {
    return null
  }

  const regionCode = codes && codes.region ? String(codes.region) : ''
  const stateCode = codes && codes.state ? String(codes.state) : ''
  const cityCode = codes && codes.city ? String(codes.city) : ''

  if (regionCode || stateCode || cityCode) {
    for (let regionIndex = 0; regionIndex < locationTree.length; regionIndex += 1) {
      const region = locationTree[regionIndex]
      if (regionCode && region.code !== regionCode) {
        continue
      }

      const states = region.states || []
      for (let stateIndex = 0; stateIndex < states.length; stateIndex += 1) {
        const state = states[stateIndex]
        if (stateCode && state.code !== stateCode) {
          continue
        }

        const cities = state.cities || []
        if (!cityCode) {
          return [regionIndex, stateIndex, 0]
        }
        for (let cityIndex = 0; cityIndex < cities.length; cityIndex += 1) {
          const city = cities[cityIndex]
          if (cityCode && city.code !== cityCode) {
            continue
          }

          return [regionIndex, stateIndex, cityIndex]
        }
      }

      if (!stateCode) {
        return [regionIndex, 0, 0]
      }
    }
  }

  return findLocationIndicesByText(locationTree, text)
}

function normalizeProfile(profile, avatar) {
  const safeProfile = profile || {}
  const faculty = safeProfile.faculty || {}
  const major = safeProfile.major || {}
  const location = safeProfile.location || {}
  const hometown = safeProfile.hometown || {}
  return {
    username: safeProfile.username || '',
    nickname: safeProfile.nickname || '',
    avatar: avatar || safeProfile.avatar || '/image/default.png',
    birthday: safeProfile.birthday || '',
    faculty: faculty.label || NOT_SELECTED,
    facultyCode: typeof faculty.code === 'number' ? faculty.code : null,
    major: major.label || NOT_SELECTED,
    majorCode: major.code || '',
    enrollment: safeProfile.enrollment ? String(safeProfile.enrollment) : '',
    location: location.displayName || '',
    locationRegion: location.region || '',
    locationState: location.state || '',
    locationCity: location.city || '',
    hometown: hometown.displayName || '',
    hometownRegion: hometown.region || '',
    hometownState: hometown.state || '',
    hometownCity: hometown.city || '',
    introduction: safeProfile.introduction || '',
    ipArea: safeProfile.ipArea || ''
  }
}

function createEmptyProfile(avatar) {
  return normalizeProfile({}, avatar)
}

function syncProfileLocationDisplay(profile, locationTree) {
  const nextProfile = Object.assign({}, profile || {})
  const locationIndices = hasLocationValue({
    region: nextProfile.locationRegion,
    state: nextProfile.locationState,
    city: nextProfile.locationCity
  }, nextProfile.location)
    ? findLocationIndices(locationTree, {
      region: nextProfile.locationRegion,
      state: nextProfile.locationState,
      city: nextProfile.locationCity
    }, nextProfile.location)
    : null
  const hometownIndices = hasLocationValue({
    region: nextProfile.hometownRegion,
    state: nextProfile.hometownState,
    city: nextProfile.hometownCity
  }, nextProfile.hometown)
    ? findLocationIndices(locationTree, {
      region: nextProfile.hometownRegion,
      state: nextProfile.hometownState,
      city: nextProfile.hometownCity
    }, nextProfile.hometown)
    : null
  const locationSelection = locationIndices ? buildLocationSelection(locationTree, locationIndices) : null
  const hometownSelection = hometownIndices ? buildLocationSelection(locationTree, hometownIndices) : null

  if (locationSelection) {
    nextProfile.location = locationSelection.display
    nextProfile.locationRegion = locationSelection.codes.region
    nextProfile.locationState = locationSelection.codes.state
    nextProfile.locationCity = locationSelection.codes.city
  }

  if (hometownSelection) {
    nextProfile.hometown = hometownSelection.display
    nextProfile.hometownRegion = hometownSelection.codes.region
    nextProfile.hometownState = hometownSelection.codes.state
    nextProfile.hometownCity = hometownSelection.codes.city
  }

  return nextProfile
}

function displayValue(val) {
  return val === NOT_SELECTED ? i18n.t('profilePage.notSelected') : val
}

function toDisplayOptions(options) {
  return options.map(function(option) {
    return displayValue(option)
  })
}

function buildEditableState(profile, locationTree) {
  const normalizedProfile = normalizeProfile(profile, profile.avatar)
  const facultyOptions = getFacultyOptions()
  const majorOptions = getMajorOptions(normalizedProfile.faculty)
  const enrollmentOptions = getEnrollmentYearOptions()
  const locationIndices = findLocationIndices(locationTree, {
    region: normalizedProfile.locationRegion,
    state: normalizedProfile.locationState,
    city: normalizedProfile.locationCity
  }, normalizedProfile.location) || [0, 0, 0]
  const hometownIndices = findLocationIndices(locationTree, {
    region: normalizedProfile.hometownRegion,
    state: normalizedProfile.hometownState,
    city: normalizedProfile.hometownCity
  }, normalizedProfile.hometown) || [0, 0, 0]
  const locationPickerState = buildLocationRanges(locationTree, locationIndices)
  const hometownPickerState = buildLocationRanges(locationTree, hometownIndices)

  return {
    form: {
      nickname: normalizedProfile.nickname,
      birthday: normalizedProfile.birthday,
      faculty: normalizedProfile.faculty,
      facultyCode: normalizedProfile.facultyCode,
      major: normalizedProfile.major,
      majorCode: normalizedProfile.majorCode,
      enrollment: normalizedProfile.enrollment,
      location: normalizedProfile.location,
      locationCodes: {
        region: normalizedProfile.locationRegion,
        state: normalizedProfile.locationState,
        city: normalizedProfile.locationCity
      },
      hometown: normalizedProfile.hometown,
      hometownCodes: {
        region: normalizedProfile.hometownRegion,
        state: normalizedProfile.hometownState,
        city: normalizedProfile.hometownCity
      },
      introduction: normalizedProfile.introduction
    },
    displayFaculty: displayValue(normalizedProfile.faculty),
    displayMajor: displayValue(normalizedProfile.major),
    majorOptions: majorOptions,
    facultyOptions: facultyOptions,
    facultyDisplayOptions: toDisplayOptions(facultyOptions),
    majorDisplayOptions: toDisplayOptions(majorOptions),
    facultyIndex: getSafeIndex(facultyOptions, normalizedProfile.faculty),
    majorIndex: getSafeIndex(majorOptions, normalizedProfile.major),
    enrollmentOptions: enrollmentOptions,
    enrollmentDisplayOptions: toDisplayOptions(enrollmentOptions),
    enrollmentIndex: getSafeIndex(enrollmentOptions, normalizedProfile.enrollment || NOT_SELECTED),
    majorDisabled: !canSelectMajor(normalizedProfile.faculty),
    locationRanges: locationPickerState.ranges,
    locationPickerIndex: locationPickerState.indices,
    hometownRanges: hometownPickerState.ranges,
    hometownPickerIndex: hometownPickerState.indices,
    locationPickerDisabled: !locationTree.length,
    hometownPickerDisabled: !locationTree.length
  }
}

function parseBirthdayPayload(dateText) {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateText || '').trim())
  if (!matched) {
    return {
      year: null,
      month: null,
      date: null
    }
  }

  return {
    year: Number(matched[1]),
    month: Number(matched[2]),
    date: Number(matched[3])
  }
}

function buildInteractionPromise(promiseFactory) {
  return Promise.resolve()
    .then(function() {
      return promiseFactory()
    })
    .then(function(result) {
      if (!result.success) {
        throw new Error(result.message || i18n.t('profilePage.saveFailed'))
      }
      return result
    })
}

function buildTodayDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

function buildAvatarFile(filePath) {
  return {
    path: filePath
  }
}

function buildAvatarFileName(filePath, prefix) {
  const matched = /\.([a-zA-Z0-9]+)$/.exec(String(filePath || ''))
  const extension = matched ? `.${matched[1].toLowerCase()}` : '.jpg'
  return `${prefix}-${Date.now()}${extension}`
}

function validateNickname(nickname) {
  const normalizedNickname = String(nickname || '').trim()
  if (!normalizedNickname) {
    return i18n.t('profilePage.nicknameEmpty')
  }
  if (normalizedNickname.length > NICKNAME_MAX_LENGTH) {
    return i18n.tReplace('profilePage.nicknameTooLong', { max: NICKNAME_MAX_LENGTH })
  }
  return ''
}

function validateIntroduction(introduction) {
  const normalizedIntroduction = String(introduction || '').trim()
  if (normalizedIntroduction.length > INTRODUCTION_MAX_LENGTH) {
    return i18n.tReplace('profilePage.introTooLong', { max: INTRODUCTION_MAX_LENGTH })
  }
  return ''
}

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
        notSelected: i18n.t('profilePage.notSelected')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
    // Refresh display options and display values after locale change
    var updateData = {
      facultyDisplayOptions: toDisplayOptions(this.data.facultyOptions || getFacultyOptions()),
      majorDisplayOptions: toDisplayOptions(this.data.majorOptions || [NOT_SELECTED]),
      enrollmentDisplayOptions: toDisplayOptions(this.data.enrollmentOptions || getEnrollmentYearOptions())
    }
    if (this.data.form) {
      updateData.displayFaculty = displayValue(this.data.form.faculty)
      updateData.displayMajor = displayValue(this.data.form.major)
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
    const nextProfile = normalizeProfile(Object.assign({}, this.data.profile || {}, patch || {}))
    this.setData({
      profile: nextProfile
    })
    this.setEditableState(nextProfile)
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
        if (this.data.profile) {
          this.setEditableState(this.data.profile)
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
        fetchProfileOptions()
      ])
    }).then((results) => {
      const avatarResult = results[0] && results[0].status === 'fulfilled' ? results[0].value : null
      const profileResult = results[1] && results[1].status === 'fulfilled' ? results[1].value : null
      const profileOptionsResult = results[2] && results[2].status === 'fulfilled' ? results[2].value : null

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

    this.queueProfileSave('introduction', function() {
      return userApi.updateIntroduction(introduction)
    }, {
      introduction: introduction
    })
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
