var {
  loadLocationRegions,
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

  return loadLocationRegions().then(function(locationRegions) {
    var state = utils.readState()
    var locale = utils.currentLocale ? utils.currentLocale() : 'zh-CN'
    var localizedProfile = mockData.buildBaseProfile(locale)
    var mergedProfile = Object.assign({}, localizedProfile, state.profile || {})
    var rawFacultyCode =
      state.profile && typeof state.profile.facultyCode === 'number'
        ? state.profile.facultyCode
        : state.profile && state.profile.faculty && state.profile.faculty.code !== undefined
          ? Number(state.profile.faculty.code)
          : undefined
    mergedProfile.faculty =
      rawFacultyCode !== undefined
        ? getDefaultProfileOptionsPayload(locale).faculties.filter(function(item) {
            return item.code === rawFacultyCode
          })[0] || localizedProfile.faculty
        : localizedProfile.faculty
    mergedProfile.facultyCode = mergedProfile.faculty.code
    var rawMajorCode =
      state.profile && (state.profile.majorCode || (state.profile.major && state.profile.major.code))
    mergedProfile.major =
      mergedProfile.faculty && rawMajorCode
        ? (function() {
            var majorLabel = getMajorLabelByCode(mergedProfile.faculty.label, rawMajorCode)
            return {
              code: rawMajorCode,
              label: majorLabel || localizedProfile.major.label
            }
          })()
        : localizedProfile.major
    mergedProfile.majorCode = mergedProfile.major.code
    ;['location', 'hometown'].forEach(function(field) {
      var location = mergedProfile[field] || {}
      mergedProfile[field] = Object.assign({}, location, {
        displayName: getLocationDisplay(location, location.displayName, locale, locationRegions)
      })
    })
    mergedProfile.ipArea = localizeIpArea(mergedProfile.ipArea, locale, locationRegions)
    return utils.resolveWithDelay(utils.buildSuccess(mergedProfile))
  })
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
  return applyProfileUpdate(
    token,
    function(profile) {
      profile.avatar = avatarKey
    },
    utils
  )
}

function handleAvatarDelete(token, utils) {
  return applyProfileUpdate(
    token,
    function(profile) {
      profile.avatar = ''
    },
    utils
  )
}

function handleLocationList(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  return loadLocationRegions().then(function(locationRegions) {
    return utils.resolveWithDelay(utils.buildSuccess(utils.cloneValue(locationRegions)))
  })
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
  return applyProfileUpdate(
    token,
    function(profile) {
      profile.nickname = nickname
    },
    utils
  )
}

function handleIntroductionUpdate(token, payload, utils) {
  return applyProfileUpdate(
    token,
    function(profile) {
      profile.introduction = String(payload.introduction || '').trim()
    },
    utils
  )
}

function handleBirthdayUpdate(token, payload, utils) {
  var year = Number(payload.year)
  var month = Number(payload.month)
  var date = Number(payload.date)

  return applyProfileUpdate(
    token,
    function(profile) {
      if (!year || !month || !date) {
        profile.birthday = ''
        return
      }
      profile.birthday = [
        String(year),
        String(month).padStart(2, '0'),
        String(date).padStart(2, '0')
      ].join('-')
    },
    utils
  )
}

function handleFacultyUpdate(token, payload, utils) {
  var facultyIndex = Number(payload.faculty)
  var options = getFacultyDictionaryOptions()
  var faculty = (
    options.filter(function(item) {
      return item.code === facultyIndex
    })[0] ||
    options[0] || { label: '' }
  ).label

  return applyProfileUpdate(
    token,
    function(profile) {
      var currentMajorLabel = String((profile.major || {}).label || '').trim()
      profile.facultyCode = facultyIndex
      profile.faculty = {
        code: facultyIndex,
        label: faculty
      }
      if (getMajorOptions(faculty).indexOf(currentMajorLabel) === -1) {
        profile.majorCode = 'unselected'
        profile.major = {
          code: 'unselected',
          label: getDefaultProfileOptionsPayload(
            utils.currentLocale ? utils.currentLocale() : 'zh-CN'
          ).faculties[0].label
        }
      }
    },
    utils
  )
}

function handleMajorUpdate(token, payload, utils) {
  var majorCode = String(payload.major || '').trim()

  return applyProfileUpdate(
    token,
    function(profile) {
      var facultyLabel = String((profile.faculty || {}).label || '').trim()
      var majorLabel = getMajorLabelByCode(facultyLabel, majorCode)
      profile.majorCode = majorLabel ? majorCode : 'unselected'
      profile.major = majorLabel
        ? {
            code: majorCode,
            label: majorLabel
          }
        : {
            code: 'unselected',
            label: getDefaultProfileOptionsPayload(
              utils.currentLocale ? utils.currentLocale() : 'zh-CN'
            ).faculties[0].label
          }
    },
    utils
  )
}

function handleEnrollmentUpdate(token, payload, utils) {
  var year =
    payload.year === null || payload.year === undefined || payload.year === ''
      ? ''
      : String(payload.year)

  return applyProfileUpdate(
    token,
    function(profile) {
      profile.enrollment = year
    },
    utils
  )
}

function invalidLocationMessage(utils) {
  return mockData.localizedMockText(
    '未找到对应的地区选项',
    '找不到對應的地區選項',
    'The selected location option was not found',
    '選択した地域オプションが見つかりませんでした',
    '선택한 지역 옵션을 찾을 수 없습니다',
    utils.currentLocale && utils.currentLocale(),
    '未找到對應的地區選項'
  )
}

function handleLocationUpdate(token, payload, type, utils) {
  var regionCode = String(payload.region || '').trim()
  var stateCode = String(payload.state || '').trim()
  var cityCode = String(payload.city || '').trim()

  return loadLocationRegions().then(function(locationRegions) {
    var locationNode = findLocationNodes(
      { region: regionCode, state: stateCode, city: cityCode },
      locationRegions
    )

    if (!locationNode) {
      return utils.rejectWithMessage(invalidLocationMessage(utils))
    }

    return applyProfileUpdate(
      token,
      function(profile) {
        var currentLocale = utils.currentLocale ? utils.currentLocale() : 'zh-CN'
        var displayText = buildLocationDisplay(
          locationNode.region,
          locationNode.state,
          locationNode.city,
          currentLocale
        )
        var nextLocation = {
          region: locationNode.region.code,
          state: locationNode.state ? locationNode.state.code : '',
          city: locationNode.city ? locationNode.city.code : '',
          displayName: displayText
        }
        if (type === 'hometown') {
          profile.hometown = nextLocation
          return
        }
        profile.location = nextLocation
      },
      utils
    )
  })
}

function handleProfilePatch(token, payload, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return utils.rejectWithMessage('请求参数不合法')
  }

  var allowedFields = [
    'nickname',
    'introduction',
    'birthday',
    'faculty',
    'major',
    'enrollment',
    'location',
    'hometown'
  ]
  var keys = Object.keys(payload)
  if (
    keys.some(function(key) {
      return allowedFields.indexOf(key) === -1
    })
  ) {
    return utils.rejectWithMessage('不支持修改此字段')
  }

  var needsLocations = 'location' in payload || 'hometown' in payload
  var regionsPromise = needsLocations ? loadLocationRegions() : Promise.resolve(null)

  return regionsPromise.then(function(locationRegions) {
    var nextState = utils.cloneValue(utils.readState())
    var profile = nextState.profile
    var currentLocale = utils.currentLocale ? utils.currentLocale() : 'zh-CN'
    var options = getDefaultProfileOptionsPayload(currentLocale)

    if ('nickname' in payload) {
      if (typeof payload.nickname !== 'string') {
        return utils.rejectWithMessage('昵称长度不合法')
      }
      var trimmedNickname = payload.nickname.trim()
      if (!trimmedNickname || trimmedNickname.length > 32) {
        return utils.rejectWithMessage('昵称长度不合法')
      }
      profile.nickname = trimmedNickname
    }

    if ('introduction' in payload) {
      var introValue = payload.introduction === null ? '' : payload.introduction
      if (typeof introValue !== 'string' || introValue.trim().length > 80) {
        return utils.rejectWithMessage('个人简介长度不合法')
      }
      profile.introduction = introValue.trim()
    }

    if ('birthday' in payload) {
      var birthday = payload.birthday
      if (birthday === null) {
        profile.birthday = ''
      } else if (!birthday || typeof birthday !== 'object' || Array.isArray(birthday)) {
        return utils.rejectWithMessage('生日不合法')
      } else {
        var year = birthday.year
        var month = birthday.month
        var date = birthday.date
        var parsedDate = new Date(Date.UTC(year, month - 1, date))
        if (
          !Number.isInteger(year) ||
          !Number.isInteger(month) ||
          !Number.isInteger(date) ||
          year < 1900 ||
          parsedDate.getUTCFullYear() !== year ||
          parsedDate.getUTCMonth() !== month - 1 ||
          parsedDate.getUTCDate() !== date ||
          parsedDate > new Date()
        ) {
          return utils.rejectWithMessage('生日不合法')
        }
        profile.birthday = parsedDate.toISOString().slice(0, 10)
      }
    }

    if ('enrollment' in payload) {
      var enrollment = payload.enrollment
      if (enrollment === null) {
        profile.enrollment = ''
      } else if (
        !Number.isInteger(enrollment) ||
        enrollment < 1900 ||
        enrollment > new Date().getFullYear()
      ) {
        return utils.rejectWithMessage('入学年份不合法')
      } else {
        profile.enrollment = String(enrollment)
      }
    }

    var currentFacultyCode =
      typeof profile.facultyCode === 'number'
        ? profile.facultyCode
        : profile.faculty && typeof profile.faculty.code === 'number'
          ? profile.faculty.code
          : 0
    var targetFacultyCode = currentFacultyCode
    if ('faculty' in payload) {
      if (!Number.isInteger(payload.faculty)) {
        return utils.rejectWithMessage('院系不合法')
      }
      targetFacultyCode = payload.faculty
    }
    var matchedFaculty = options.faculties.find(function(item) {
      return item.code === targetFacultyCode
    })
    if (!matchedFaculty) {
      return utils.rejectWithMessage('院系不合法')
    }

    var currentMajorCode =
      profile.majorCode || (profile.major && profile.major.code) || 'unselected'
    var targetMajorCode =
      'major' in payload
        ? payload.major === null || payload.major === ''
          ? 'unselected'
          : payload.major
        : 'faculty' in payload && targetFacultyCode !== currentFacultyCode
          ? 'unselected'
          : currentMajorCode
    if (typeof targetMajorCode !== 'string') {
      return utils.rejectWithMessage('专业必须属于所选院系')
    }
    var matchedMajor = (matchedFaculty.majors || []).find(function(item) {
      return item.code === targetMajorCode
    })
    if (!matchedMajor) {
      return utils.rejectWithMessage('专业必须属于所选院系')
    }
    profile.facultyCode = matchedFaculty.code
    profile.faculty = {
      code: matchedFaculty.code,
      label: matchedFaculty.label
    }
    profile.majorCode = matchedMajor.code
    profile.major = {
      code: matchedMajor.code,
      label: matchedMajor.label
    }

    var locationFields = ['location', 'hometown']
    for (var i = 0; i < locationFields.length; i += 1) {
      var field = locationFields[i]
      if (!(field in payload)) {
        continue
      }
      var codes = payload[field]
      if (codes === null) {
        profile[field] = {
          region: '',
          state: '',
          city: '',
          displayName: ''
        }
        continue
      }
      if (!codes || typeof codes !== 'object' || Array.isArray(codes)) {
        return utils.rejectWithMessage(invalidLocationMessage(utils))
      }
      if (
        typeof codes.region !== 'string' ||
        (codes.state !== undefined && codes.state !== null && typeof codes.state !== 'string') ||
        (codes.city !== undefined && codes.city !== null && typeof codes.city !== 'string')
      ) {
        return utils.rejectWithMessage(invalidLocationMessage(utils))
      }
      var node = findLocationNodes(
        {
          region: codes.region,
          state: codes.state || '',
          city: codes.city || ''
        },
        locationRegions
      )
      if (
        !node ||
        (node.region.states && node.region.states.length > 0 && !node.state) ||
        (node.state && node.state.cities && node.state.cities.length > 0 && !node.city)
      ) {
        return utils.rejectWithMessage(invalidLocationMessage(utils))
      }
      profile[field] = {
        region: node.region.code,
        state: node.state ? node.state.code : '',
        city: node.city ? node.city.code : '',
        displayName: buildLocationDisplay(node.region, node.state, node.city, currentLocale)
      }
    }

    utils.writeState(nextState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  })
}

module.exports = {
  handleProfile: handleProfile,
  handleProfilePatch: handleProfilePatch,
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
