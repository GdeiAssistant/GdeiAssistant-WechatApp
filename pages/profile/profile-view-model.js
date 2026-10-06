const { maskAccount } = require('../../utils/mask.js')
const i18n = require('../../utils/i18n')
const {
  NOT_SELECTED, getEnrollmentYearOptions, getFacultyCodeByLabel, getFacultyOptions, getFacultyDictionaryOptions,
  getMajorCodeByLabel, getMajorLabelByCode, getMajorOptions, canSelectMajor,
  formatLocationDisplay, getLocationNodeName, getLocationDisplay, localizeIpArea
} = require('../../constants/profile.js')
const NICKNAME_MAX_LENGTH = 32
const INTRODUCTION_MAX_LENGTH = 80

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
      locationTree.map(function(item) { return getLocationNodeName(item) }),
      (region.states || []).map(function(item) { return getLocationNodeName(item) }),
      (state.cities || []).map(function(item) { return getLocationNodeName(item) })
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
    display: buildLocationDisplay(region, state, city, typeof i18n.getCurrentLocale === 'function' ? i18n.getCurrentLocale() : 'zh-CN'),
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

function normalizeProfile(profile, avatar) {
  const safeProfile = profile || {}
  const faculty = typeof safeProfile.faculty === 'string'
    ? { label: safeProfile.faculty, code: safeProfile.facultyCode }
    : (safeProfile.faculty || {})
  const major = typeof safeProfile.major === 'string'
    ? { label: safeProfile.major, code: safeProfile.majorCode }
    : (safeProfile.major || {})
  const facultyOption = getFacultyDictionaryOptions().find(function(option) { return option.code === faculty.code })
  const facultyLabel = facultyOption ? facultyOption.label : (faculty.label || NOT_SELECTED)
  const majorLabel = getMajorLabelByCode(facultyLabel, major.code) || major.label || NOT_SELECTED
  const location = typeof safeProfile.location === 'string' ? {
    displayName: safeProfile.location,
    region: safeProfile.locationRegion,
    state: safeProfile.locationState,
    city: safeProfile.locationCity
  } : (safeProfile.location || {})
  const hometown = typeof safeProfile.hometown === 'string' ? {
    displayName: safeProfile.hometown,
    region: safeProfile.hometownRegion,
    state: safeProfile.hometownState,
    city: safeProfile.hometownCity
  } : (safeProfile.hometown || {})
  return {
    username: safeProfile.username || '',
    maskedUsername: maskAccount(safeProfile.username || ''),
    nickname: safeProfile.nickname || '',
    avatar: avatar || safeProfile.avatar || '/image/default.png',
    birthday: safeProfile.birthday || '',
    faculty: facultyLabel,
    facultyCode: typeof faculty.code === 'number' ? faculty.code : null,
    major: majorLabel,
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
    ipArea: safeProfile.ipArea || '',
    displayIpArea: localizeIpArea(safeProfile.ipArea || '')
  }
}

function createEmptyProfile(avatar) {
  return normalizeProfile({}, avatar)
}

function syncProfileLocationDisplay(profile, locationTree) {
  const nextProfile = Object.assign({}, profile || {})
  ;['location', 'hometown'].forEach(function(field) {
    nextProfile[field] = getLocationDisplay({
      region: nextProfile[field + 'Region'],
      state: nextProfile[field + 'State'],
      city: nextProfile[field + 'City']
    }, nextProfile[field], i18n.getCurrentLocale(), locationTree)
  })
  nextProfile.displayIpArea = localizeIpArea(nextProfile.ipArea || '')
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
  }) || [0, 0, 0]
  const hometownIndices = findLocationIndices(locationTree, {
    region: normalizedProfile.hometownRegion,
    state: normalizedProfile.hometownState,
    city: normalizedProfile.hometownCity
  }) || [0, 0, 0]
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

module.exports = { buildLocationDisplay, getSafeIndex, clampLocationIndices, buildLocationRanges, buildLocationSelection, findLocationIndices, normalizeProfile, createEmptyProfile, syncProfileLocationDisplay, displayValue, toDisplayOptions, buildEditableState, parseBirthdayPayload, buildInteractionPromise, buildTodayDate, buildAvatarFile, buildAvatarFileName, validateNickname, validateIntroduction }
