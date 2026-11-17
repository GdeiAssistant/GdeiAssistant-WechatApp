const { maskAccount } = require('../../utils/mask.js')
const i18n = require('../../utils/i18n')
const {
  NOT_SELECTED,
  getEnrollmentYearOptions,
  getFacultyDictionaryOptions,
  getFacultyByCode,
  getFacultyLabelByCode,
  getMajorDictionaryOptionsByFacultyCode,
  getMajorLabelByFacultyCode,
  canSelectMajorByCode,
  formatLocationDisplay,
  getLocationNodeName,
  getLocationDisplay,
  localizeIpArea
} = require('../../constants/profile.js')
const NICKNAME_MAX_LENGTH = 32
const INTRODUCTION_MAX_LENGTH = 80

function isUnselectedMajorCode(majorCode) {
  return !majorCode || majorCode === 'unselected'
}

function buildLocationDisplay(region, state, city, locale) {
  return formatLocationDisplay(
    getLocationNodeName(region, locale),
    getLocationNodeName(state, locale),
    getLocationNodeName(city, locale),
    locale
  )
}

function getSafeIndex(options, value) {
  const targetValue = String(value || '').trim()
  const matchedIndex = (options || []).indexOf(targetValue)
  return matchedIndex === -1 ? 0 : matchedIndex
}

function getCodeIndex(options, code, fallbackCode) {
  if (!Array.isArray(options) || !options.length) {
    return 0
  }
  const idx = options.indexOf(code)
  if (idx !== -1) {
    return idx
  }
  if (fallbackCode !== undefined) {
    const fallbackIdx = options.indexOf(fallbackCode)
    if (fallbackIdx !== -1) {
      return fallbackIdx
    }
  }
  return 0
}

function clampLocationIndices(locationTree, sourceIndices) {
  if (!Array.isArray(locationTree) || !locationTree.length) {
    return [0, 0, 0]
  }

  const inputIndices = Array.isArray(sourceIndices) ? sourceIndices : [0, 0, 0]
  const regionIndex = Math.min(Math.max(Number(inputIndices[0]) || 0, 0), locationTree.length - 1)
  const region = locationTree[regionIndex]
  const states = region.states || []
  const stateIndex = Math.min(
    Math.max(Number(inputIndices[1]) || 0, 0),
    Math.max(states.length - 1, 0)
  )
  const state = states[stateIndex] || { cities: [] }
  const cities = state.cities || []
  const cityIndex = Math.min(
    Math.max(Number(inputIndices[2]) || 0, 0),
    Math.max(cities.length - 1, 0)
  )

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
      locationTree.map(function(item) {
        return getLocationNodeName(item)
      }),
      (region.states || []).map(function(item) {
        return getLocationNodeName(item)
      }),
      (state.cities || []).map(function(item) {
        return getLocationNodeName(item)
      })
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
    display: buildLocationDisplay(
      region,
      state,
      city,
      typeof i18n.getCurrentLocale === 'function' ? i18n.getCurrentLocale() : 'zh-CN'
    ),
    codes: {
      region: region.code,
      state: state ? state.code : '',
      city: city ? city.code : ''
    },
    indices: safeIndices
  }
}

function findLocationIndices(locationTree, codes) {
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
  return null
}

function normalizeProfile(profile, avatar, locationTree) {
  const safeProfile = profile || {}
  const facultyObj = safeProfile.faculty || {}
  const majorObj = safeProfile.major || {}
  const facultyCode =
    typeof safeProfile.facultyCode === 'number'
      ? safeProfile.facultyCode
      : typeof facultyObj.code === 'number'
        ? facultyObj.code
        : null
  const majorCode = String(safeProfile.majorCode || majorObj.code || '').trim()
  const facultyOption = getFacultyByCode(facultyCode)
  const facultyLabel = facultyOption ? facultyOption.label : facultyObj.label || NOT_SELECTED
  const majorLabel =
    getMajorLabelByFacultyCode(facultyCode, majorCode) || majorObj.label || NOT_SELECTED
  const location = safeProfile.location || {}
  const hometown = safeProfile.hometown || {}
  const locale = typeof i18n.getCurrentLocale === 'function' ? i18n.getCurrentLocale() : 'zh-CN'

  return {
    username: safeProfile.username || '',
    maskedUsername: maskAccount(safeProfile.username || ''),
    nickname: safeProfile.nickname || '',
    avatar: avatar || safeProfile.avatar || '/image/default.png',
    birthday: safeProfile.birthday || '',
    faculty: facultyLabel,
    facultyCode: facultyCode,
    major: majorLabel,
    majorCode: majorCode,
    enrollment: safeProfile.enrollment ? String(safeProfile.enrollment) : '',
    location: getLocationDisplay(location, location.displayName || '', locale, locationTree),
    locationRegion: location.region || '',
    locationState: location.state || '',
    locationCity: location.city || '',
    hometown: getLocationDisplay(hometown, hometown.displayName || '', locale, locationTree),
    hometownRegion: hometown.region || '',
    hometownState: hometown.state || '',
    hometownCity: hometown.city || '',
    introduction: safeProfile.introduction || '',
    ipArea: safeProfile.ipArea || '',
    displayIpArea: localizeIpArea(safeProfile.ipArea || '', locale, locationTree)
  }
}

function createEmptyProfile(avatar, locationTree) {
  return normalizeProfile({}, avatar, locationTree)
}

function syncProfileLocationDisplay(profile, locationTree) {
  const nextProfile = Object.assign({}, profile || {})
  const locale = typeof i18n.getCurrentLocale === 'function' ? i18n.getCurrentLocale() : 'zh-CN'
  if (getFacultyByCode(nextProfile.facultyCode)) {
    nextProfile.faculty = getFacultyLabelByCode(nextProfile.facultyCode)
  }
  const localizedMajor = getMajorLabelByFacultyCode(nextProfile.facultyCode, nextProfile.majorCode)
  if (localizedMajor) {
    nextProfile.major = localizedMajor
  }
  ;['location', 'hometown'].forEach(function(field) {
    nextProfile[field] = getLocationDisplay(
      {
        region: nextProfile[field + 'Region'],
        state: nextProfile[field + 'State'],
        city: nextProfile[field + 'City']
      },
      nextProfile[field],
      locale,
      locationTree
    )
  })
  nextProfile.displayIpArea = localizeIpArea(nextProfile.ipArea || '', locale, locationTree)
  return nextProfile
}

function applyProfilePatchToProfile(profile, patch, locationTree) {
  const baseProfile = profile || createEmptyProfile('', locationTree)
  const safePatch = patch || {}
  const nextProfile = Object.assign({}, baseProfile)
  const locale = typeof i18n.getCurrentLocale === 'function' ? i18n.getCurrentLocale() : 'zh-CN'

  if (Object.prototype.hasOwnProperty.call(safePatch, 'avatar')) {
    nextProfile.avatar = safePatch.avatar || '/image/default.png'
  }
  if (Object.prototype.hasOwnProperty.call(safePatch, 'nickname')) {
    nextProfile.nickname = safePatch.nickname || ''
  }
  if (Object.prototype.hasOwnProperty.call(safePatch, 'introduction')) {
    nextProfile.introduction = safePatch.introduction || ''
  }
  if (Object.prototype.hasOwnProperty.call(safePatch, 'birthday')) {
    nextProfile.birthday = safePatch.birthday || ''
  }
  if (Object.prototype.hasOwnProperty.call(safePatch, 'enrollment')) {
    nextProfile.enrollment = safePatch.enrollment ? String(safePatch.enrollment) : ''
  }
  if (
    Object.prototype.hasOwnProperty.call(safePatch, 'facultyCode') ||
    Object.prototype.hasOwnProperty.call(safePatch, 'majorCode')
  ) {
    if (Object.prototype.hasOwnProperty.call(safePatch, 'facultyCode')) {
      nextProfile.facultyCode =
        typeof safePatch.facultyCode === 'number' ? safePatch.facultyCode : null
    }
    if (Object.prototype.hasOwnProperty.call(safePatch, 'majorCode')) {
      nextProfile.majorCode = String(safePatch.majorCode || '').trim()
    }
    const facultyOption = getFacultyByCode(nextProfile.facultyCode)
    nextProfile.faculty = facultyOption ? facultyOption.label : NOT_SELECTED
    nextProfile.major =
      getMajorLabelByFacultyCode(nextProfile.facultyCode, nextProfile.majorCode) || NOT_SELECTED
  }

  ;['location', 'hometown'].forEach(function(field) {
    const codesKey = field + 'Codes'
    const hasCodes = Object.prototype.hasOwnProperty.call(safePatch, codesKey)
    const hasObject =
      Object.prototype.hasOwnProperty.call(safePatch, field) &&
      safePatch[field] &&
      typeof safePatch[field] === 'object'
    if (!hasCodes && !hasObject) {
      return
    }
    const source = hasCodes ? safePatch[codesKey] || {} : safePatch[field] || {}
    nextProfile[field + 'Region'] = source.region || ''
    nextProfile[field + 'State'] = source.state || ''
    nextProfile[field + 'City'] = source.city || ''
    nextProfile[field] = getLocationDisplay(
      {
        region: nextProfile[field + 'Region'],
        state: nextProfile[field + 'State'],
        city: nextProfile[field + 'City']
      },
      hasObject ? source.displayName || '' : safePatch[field] || '',
      locale,
      locationTree
    )
  })

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

function buildEditableState(normalizedProfile, locationTree) {
  const safeProfile = normalizedProfile || createEmptyProfile('', locationTree)
  const tree = Array.isArray(locationTree) ? locationTree : []
  const facultyDict = getFacultyDictionaryOptions()
  const facultyOptions = facultyDict.map(function(option) {
    return option.code
  })
  const facultyLabels = facultyDict.map(function(option) {
    return option.label
  })
  const majorDict = getMajorDictionaryOptionsByFacultyCode(safeProfile.facultyCode)
  const majorOptions = majorDict.map(function(option) {
    return option.code
  })
  const majorLabels = majorDict.map(function(option) {
    return option.label
  })
  const enrollmentOptions = getEnrollmentYearOptions()
  const locationIndices = findLocationIndices(tree, {
    region: safeProfile.locationRegion,
    state: safeProfile.locationState,
    city: safeProfile.locationCity
  }) || [0, 0, 0]
  const hometownIndices = findLocationIndices(tree, {
    region: safeProfile.hometownRegion,
    state: safeProfile.hometownState,
    city: safeProfile.hometownCity
  }) || [0, 0, 0]
  const locationPickerState = buildLocationRanges(tree, locationIndices)
  const hometownPickerState = buildLocationRanges(tree, hometownIndices)
  const facultyOption = getFacultyByCode(safeProfile.facultyCode)
  const facultyLabel = facultyOption ? facultyOption.label : safeProfile.faculty || NOT_SELECTED
  const majorLabel =
    getMajorLabelByFacultyCode(safeProfile.facultyCode, safeProfile.majorCode) ||
    safeProfile.major ||
    NOT_SELECTED

  return {
    form: {
      nickname: safeProfile.nickname,
      birthday: safeProfile.birthday,
      facultyCode: safeProfile.facultyCode,
      majorCode: safeProfile.majorCode,
      enrollment: safeProfile.enrollment,
      location: safeProfile.location,
      locationCodes: {
        region: safeProfile.locationRegion,
        state: safeProfile.locationState,
        city: safeProfile.locationCity
      },
      hometown: safeProfile.hometown,
      hometownCodes: {
        region: safeProfile.hometownRegion,
        state: safeProfile.hometownState,
        city: safeProfile.hometownCity
      },
      introduction: safeProfile.introduction
    },
    displayFaculty: displayValue(facultyLabel),
    displayMajor: displayValue(majorLabel),
    majorOptions: majorOptions,
    facultyOptions: facultyOptions,
    facultyDisplayOptions: toDisplayOptions(facultyLabels),
    majorDisplayOptions: toDisplayOptions(majorLabels),
    facultyIndex: getCodeIndex(facultyOptions, safeProfile.facultyCode, 0),
    majorIndex: getCodeIndex(majorOptions, safeProfile.majorCode || 'unselected', 'unselected'),
    enrollmentOptions: enrollmentOptions,
    enrollmentDisplayOptions: toDisplayOptions(enrollmentOptions),
    enrollmentIndex: getSafeIndex(enrollmentOptions, safeProfile.enrollment || NOT_SELECTED),
    majorDisabled: !canSelectMajorByCode(safeProfile.facultyCode),
    locationRanges: locationPickerState.ranges,
    locationPickerIndex: locationPickerState.indices,
    hometownRanges: hometownPickerState.ranges,
    hometownPickerIndex: hometownPickerState.indices,
    locationPickerDisabled: !tree.length,
    hometownPickerDisabled: !tree.length
  }
}

function parseBirthdayPayload(dateText) {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateText || '').trim())
  if (!matched) {
    return null
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

module.exports = {
  isUnselectedMajorCode,
  buildLocationDisplay,
  getSafeIndex,
  getCodeIndex,
  clampLocationIndices,
  buildLocationRanges,
  buildLocationSelection,
  findLocationIndices,
  normalizeProfile,
  createEmptyProfile,
  syncProfileLocationDisplay,
  applyProfilePatchToProfile,
  displayValue,
  toDisplayOptions,
  buildEditableState,
  parseBirthdayPayload,
  buildInteractionPromise,
  buildTodayDate,
  buildAvatarFile,
  buildAvatarFileName,
  validateNickname,
  validateIntroduction
}
