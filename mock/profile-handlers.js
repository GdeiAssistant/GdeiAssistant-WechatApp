var LOCATION_REGIONS = require('../constants/location-regions.js')
var {
  FACULTY_OPTIONS,
  getMajorLabelByCode,
  getMajorOptions,
  formatLocationDisplay
} = require('../constants/profile.js')

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

function findLocationNodeByCodes(regionCode, stateCode, cityCode) {
  var region = LOCATION_REGIONS.filter(function(item) {
    return item.code === regionCode
  })[0]
  if (!region) {
    return null
  }

  var states = Array.isArray(region.states) ? region.states : []
  var state = states.filter(function(item) {
    return item.code === stateCode
  })[0] || states[0] || null
  if (!state && states.length) {
    return null
  }

  var cities = state && Array.isArray(state.cities) ? state.cities : []
  var city = cities.filter(function(item) {
    return item.code === cityCode
  })[0] || cities[0] || null
  if (!city && cities.length) {
    return null
  }

  return { region: region, state: state, city: city }
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
  return utils.resolveWithDelay(utils.buildSuccess(Object.assign({}, state.profile)))
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
  var faculty = FACULTY_OPTIONS[facultyIndex] || FACULTY_OPTIONS[0]

  return applyProfileUpdate(token, function(profile) {
    var currentMajorLabel = String(((profile.major || {}).label) || '').trim()
    profile.faculty = {
      code: facultyIndex,
      label: faculty
    }
    if (getMajorOptions(faculty).indexOf(currentMajorLabel) === -1) {
      profile.major = {
        code: 'unselected',
        label: '未选择'
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
      label: '未选择'
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
    return utils.rejectWithMessage('未找到对应的地区信息')
  }

  return applyProfileUpdate(token, function(profile) {
    var displayText = buildLocationDisplay(locationNode.region, locationNode.state, locationNode.city)
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
  handleProfile: handleProfile,
  handleAvatar: handleAvatar,
  handleAvatarUpdate: handleAvatarUpdate,
  handleAvatarDelete: handleAvatarDelete,
  handleLocationList: handleLocationList,
  handleNicknameUpdate: handleNicknameUpdate,
  handleIntroductionUpdate: handleIntroductionUpdate,
  handleBirthdayUpdate: handleBirthdayUpdate,
  handleFacultyUpdate: handleFacultyUpdate,
  handleMajorUpdate: handleMajorUpdate,
  handleEnrollmentUpdate: handleEnrollmentUpdate,
  handleLocationUpdate: handleLocationUpdate
}
