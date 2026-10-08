var LOCATION_REGIONS = require('../constants/location-regions.js')
var {
  getDefaultProfileOptionsPayload,
  getFacultyDictionaryOptions,
  getMajorLabelByCode,
  getMajorOptions,
  formatLocationDisplay,
  getLocationNodeName,
  findLocationNodes,
  getLocationDisplay,
  localizeIpArea
} = require('../constants/profile.js')
var mockData = require('./mock-data.js')

function buildLocationDisplay(region, state, city, locale) {
  return formatLocationDisplay(
    getLocationNodeName(region, locale),
    getLocationNodeName(state, locale),
    getLocationNodeName(city, locale),
    locale
  )
}

function findLocationNodeByCodes(regionCode, stateCode, cityCode) {
  return findLocationNodes({ region: regionCode, state: stateCode, city: cityCode }, LOCATION_REGIONS)
}

function applyProfileUpdate(token, updater, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var nextState = utils.readState()
  updater(nextState.profile)
  utils.writeState(nextState)
  return utils.resolveWithDelay(utils.buildSuccess(Object.assign({}, nextState.profile)))
}

function handleProfile(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var state = utils.readState()
  var locale = utils.currentLocale ? utils.currentLocale() : 'zh-CN'
  var localizedProfile = mockData.buildBaseProfile(locale)
  var mergedProfile = Object.assign({}, localizedProfile, state.profile || {})
  mergedProfile.faculty = (state.profile && state.profile.faculty && state.profile.faculty.code !== undefined)
    ? (getDefaultProfileOptionsPayload(locale).faculties.filter(function(item) { return item.code === Number(state.profile.faculty.code) })[0] || localizedProfile.faculty)
    : localizedProfile.faculty
  mergedProfile.major = mergedProfile.faculty && state.profile && state.profile.major
    ? (function() {
        var majorLabel = getMajorLabelByCode(mergedProfile.faculty.label, state.profile.major.code)
        return { code: state.profile.major.code, label: majorLabel || localizedProfile.major.label }
      })()
    : localizedProfile.major
  ;['location', 'hometown'].forEach(function(field) {
    var location = mergedProfile[field] || {}
    mergedProfile[field] = Object.assign({}, location, {
      displayName: getLocationDisplay(location, location.displayName, locale, LOCATION_REGIONS)
    })
  })
  mergedProfile.ipArea = localizeIpArea(mergedProfile.ipArea, locale)
  return utils.resolveWithDelay(utils.buildSuccess(mergedProfile))
}

function handleAvatar(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var state = utils.readState()
  return utils.resolveWithDelay(utils.buildSuccess(state.profile.avatar || ''))
}

function handleAvatarUpdate(token, payload, utils) {
  var avatarKey = String(payload.avatarKey || payload.avatarHdKey || '').trim()
  return applyProfileUpdate(token, function(profile) {
    profile.avatar = avatarKey
  }, utils)
}

function handleAvatarDelete(token, utils) {
  return applyProfileUpdate(token, function(profile) {
    profile.avatar = ''
  }, utils)
}

function handleLocationList(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  return utils.resolveWithDelay(utils.buildSuccess(utils.cloneValue(LOCATION_REGIONS)))
}

function handleProfileOptions(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var locale = utils.currentLocale ? utils.currentLocale() : 'zh-CN'
  return utils.resolveWithDelay(utils.buildSuccess(getDefaultProfileOptionsPayload(locale)))
}

function handleNicknameUpdate(token, payload, utils) {
  var nickname = String(payload.nickname || '').trim()
  return applyProfileUpdate(token, function(profile) {
    profile.nickname = nickname
  }, utils)
}

function handleIntroductionUpdate(token, payload, utils) {
  return applyProfileUpdate(token, function(profile) {
    profile.introduction = String(payload.introduction || '').trim()
  }, utils)
}

function handleBirthdayUpdate(token, payload, utils) {
  var year = Number(payload.year)
  var month = Number(payload.month)
  var date = Number(payload.date)

  return applyProfileUpdate(token, function(profile) {
    if (!year || !month || !date) {
      profile.birthday = ''
      return
    }
    profile.birthday = [String(year), String(month).padStart(2, '0'), String(date).padStart(2, '0')].join('-')
  }, utils)
}

function handleFacultyUpdate(token, payload, utils) {
  var facultyIndex = Number(payload.faculty)
  var options = getFacultyDictionaryOptions()
  var faculty = (options.filter(function(item) { return item.code === facultyIndex })[0] || options[0] || { label: '' }).label

  return applyProfileUpdate(token, function(profile) {
    var currentMajorLabel = String(((profile.major || {}).label) || '').trim()
    profile.faculty = {
      code: facultyIndex,
      label: faculty
    }
    if (getMajorOptions(faculty).indexOf(currentMajorLabel) === -1) {
      profile.major = {
        code: 'unselected',
        label: getDefaultProfileOptionsPayload(utils.currentLocale ? utils.currentLocale() : 'zh-CN').faculties[0].label
      }
    }
  }, utils)
}

function handleMajorUpdate(token, payload, utils) {
  var majorCode = String(payload.major || '').trim()

  return applyProfileUpdate(token, function(profile) {
    var facultyLabel = String(((profile.faculty || {}).label) || '').trim()
    var majorLabel = getMajorLabelByCode(facultyLabel, majorCode)
    profile.major = majorLabel ? {
      code: majorCode,
      label: majorLabel
    } : {
      code: 'unselected',
      label: getDefaultProfileOptionsPayload(utils.currentLocale ? utils.currentLocale() : 'zh-CN').faculties[0].label
    }
  }, utils)
}

function handleEnrollmentUpdate(token, payload, utils) {
  var year = payload.year === null || payload.year === undefined || payload.year === '' ? '' : String(payload.year)

  return applyProfileUpdate(token, function(profile) {
    profile.enrollment = year
  }, utils)
}

function handleLocationUpdate(token, payload, type, utils) {
  var regionCode = String(payload.region || '').trim()
  var stateCode = String(payload.state || '').trim()
  var cityCode = String(payload.city || '').trim()
  var locationNode = findLocationNodeByCodes(regionCode, stateCode, cityCode)

  if (!locationNode) {
    return utils.rejectWithMessage(
      mockData.localizedMockText(
        '未找到对应的地区选项',
        '找不到對應的地區選項',
        'The selected location option was not found',
        '選択した地域オプションが見つかりませんでした',
        '선택한 지역 옵션을 찾을 수 없습니다',
        utils.currentLocale && utils.currentLocale(),
        '未找到對應的地區選項'
      )
    )
  }

  return applyProfileUpdate(token, function(profile) {
    var currentLocale = utils.currentLocale ? utils.currentLocale() : 'zh-CN'
    var displayText = buildLocationDisplay(locationNode.region, locationNode.state, locationNode.city, currentLocale)
    if (type === 'hometown') {
      profile.hometown = {
        region: locationNode.region.code,
        state: locationNode.state ? locationNode.state.code : '',
        city: locationNode.city ? locationNode.city.code : '',
        displayName: displayText
      }
      return
    }

    profile.location = {
      region: locationNode.region.code,
      state: locationNode.state ? locationNode.state.code : '',
      city: locationNode.city ? locationNode.city.code : '',
      displayName: displayText
    }
  }, utils)
}

module.exports = {
  handleProfilePatch,
  handleProfile: handleProfile,
  handleAvatar: handleAvatar,
  handleAvatarUpdate: handleAvatarUpdate,
  handleAvatarDelete: handleAvatarDelete,
  handleLocationList: handleLocationList,
  handleProfileOptions: handleProfileOptions,
  handleNicknameUpdate: handleNicknameUpdate,
  handleIntroductionUpdate: handleIntroductionUpdate,
  handleBirthdayUpdate: handleBirthdayUpdate,
  handleFacultyUpdate: handleFacultyUpdate,
  handleMajorUpdate: handleMajorUpdate,
  handleEnrollmentUpdate: handleEnrollmentUpdate,
  handleLocationUpdate: handleLocationUpdate
}


function handleProfilePatch(token, payload, utils) {
  const authError = utils.ensureAuthorized(token)
  if (authError) return authError
  const next = utils.cloneValue ? utils.cloneValue(utils.readState()) : JSON.parse(JSON.stringify(utils.readState()))
  const profile = next.profile
  const allowed = ['nickname', 'introduction', 'birthday', 'faculty', 'major', 'enrollment', 'location', 'hometown']
  if (Object.keys(payload).some(key => !allowed.includes(key))) return utils.rejectWithMessage('不支持修改此字段')
  for (const key of ['nickname', 'introduction']) if (key in payload) {
    const value = payload[key] === null && key === 'introduction' ? '' : payload[key]
    if (typeof value !== 'string' || (key === 'nickname' && !value.trim()) || value.trim().length > (key === 'nickname' ? 32 : 80)) return utils.rejectWithMessage('长度不合法')
    profile[key] = value.trim()
  }
  if ('birthday' in payload) {
    const date = payload.birthday
    if (date === null) profile.birthday = ''
    else {
      const value = new Date(Date.UTC(date.year, date.month - 1, date.date))
      if (![date.year, date.month, date.date].every(Number.isInteger) || date.year < 1900 || value.getUTCFullYear() !== date.year || value.getUTCMonth() !== date.month - 1 || value.getUTCDate() !== date.date || value > new Date()) return utils.rejectWithMessage('生日不合法')
      profile.birthday = value.toISOString().slice(0, 10)
    }
  }
  if ('enrollment' in payload) {
    if (payload.enrollment !== null && (!Number.isInteger(payload.enrollment) || payload.enrollment < 1900 || payload.enrollment > new Date().getFullYear())) return utils.rejectWithMessage('入学年份不合法')
    profile.enrollment = payload.enrollment === null ? '' : String(payload.enrollment)
  }
  const faculties = getDefaultProfileOptionsPayload().faculties
  const oldFaculty = typeof profile.faculty === 'object' ? profile.faculty.code : profile.facultyCode
  const code = 'faculty' in payload ? payload.faculty : oldFaculty
  const faculty = faculties.find(item => item.code === code)
  if (!faculty) return utils.rejectWithMessage('院系不合法')
  const oldMajor = typeof profile.major === 'object' ? profile.major.code : profile.majorCode
  const major = 'major' in payload ? payload.major : ('faculty' in payload && code !== oldFaculty ? null : oldMajor)
  const option = (faculty.majors || []).find(item => item.code === major)
  if (major && major !== 'unselected' && !option) return utils.rejectWithMessage('专业必须属于所选院系')
  profile.faculty = { code: code, label: faculty.label }
  profile.major = { code: major || 'unselected', label: option ? option.label : '' }
  for (const key of ['location', 'hometown']) if (key in payload) {
    const codes = payload[key]
    if (codes === null) { profile[key] = null; continue }
    const node = findLocationNodeByCodes(codes.region, codes.state, codes.city)
    if (!node) return utils.rejectWithMessage('地区代码不合法')
    profile[key] = { region: codes.region, state: codes.state, city: codes.city }
  }
  utils.writeState(next)
  return utils.resolveWithDelay(utils.buildSuccess(null))
}
