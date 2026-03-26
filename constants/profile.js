const userApi = require('../services/apis/user.js')
const i18n = require('../utils/i18n.js')
const profileCatalog = require('./profile-catalog.js')

const NOT_SELECTED = '__not_selected__'
let cachedProfileOptionsPayload = profileCatalog.buildDefaultProfileOptionsPayload()
let cachedProfileOptions = normalizeProfileOptions(cachedProfileOptionsPayload)
let cachedProfileOptionsLocale = getCurrentLocale()
let hasLoadedRemoteProfileOptions = false

function getEnrollmentYearOptions() {
  const currentYear = new Date().getFullYear()
  const yearOptions = [NOT_SELECTED]

  for (let year = 2014; year <= currentYear; year += 1) {
    yearOptions.push(String(year))
  }

  return yearOptions
}

function fetchProfileOptions(forceRefresh) {
  if (hasLoadedRemoteProfileOptions && !forceRefresh) {
    return Promise.resolve(cachedProfileOptions)
  }

  return userApi.getProfileOptions().then(function(result) {
    if (!result.success) {
      throw new Error(result.message || i18n.t('profilePage.loadProfileFailed'))
    }

    cachedProfileOptionsPayload = result.data || {}
    cachedProfileOptionsLocale = getCurrentLocale()
    cachedProfileOptions = normalizeProfileOptions(cachedProfileOptionsPayload)
    hasLoadedRemoteProfileOptions = true
    return cachedProfileOptions
  })
}

function getCachedProfileOptions() {
  const locale = getCurrentLocale()
  if (!hasLoadedRemoteProfileOptions) {
    cachedProfileOptionsPayload = profileCatalog.buildDefaultProfileOptionsPayload(locale)
  }
  if (!cachedProfileOptions || cachedProfileOptionsLocale !== locale) {
    cachedProfileOptions = normalizeProfileOptions(cachedProfileOptionsPayload)
    cachedProfileOptionsLocale = locale
  }
  return cachedProfileOptions
}

function getDefaultProfileOptionsPayload(locale) {
  return profileCatalog.buildDefaultProfileOptionsPayload(locale)
}

function getFacultyOptions() {
  return getCachedProfileOptions().faculties.map(function(option) {
    return option.label
  })
}

function getFacultyDictionaryOptions() {
  return getCachedProfileOptions().faculties.slice()
}

function getFacultyCodeByLabel(faculty) {
  const normalizedFaculty = normalizeOptionLookup(faculty)
  const matchedOption = getCachedProfileOptions().faculties.filter(function(option) {
    return normalizeOptionLookup(option.label) === normalizedFaculty
  })[0]
  return matchedOption ? matchedOption.code : null
}

function getMajorOptions(faculty) {
  const normalizedFaculty = normalizeOptionLookup(faculty)
  const matchedOption = getCachedProfileOptions().faculties.filter(function(option) {
    return normalizeOptionLookup(option.label) === normalizedFaculty
  })[0]
  return matchedOption ? matchedOption.majors.map(function(option) { return option.label }) : [NOT_SELECTED]
}

function getMajorCodeByLabel(faculty, majorLabel) {
  const normalizedFaculty = normalizeOptionLookup(faculty)
  const normalizedMajor = normalizeOptionLookup(majorLabel)
  const matchedOption = getCachedProfileOptions().faculties.filter(function(option) {
    return normalizeOptionLookup(option.label) === normalizedFaculty
  })[0]
  if (!matchedOption) {
    return null
  }
  const matchedMajor = matchedOption.majors.filter(function(option) {
    return normalizeOptionLookup(option.label) === normalizedMajor
  })[0]
  return matchedMajor ? matchedMajor.code : null
}

function getMajorLabelByCode(faculty, majorCode) {
  const normalizedFaculty = normalizeOptionLookup(faculty)
  const matchedOption = getCachedProfileOptions().faculties.filter(function(option) {
    return normalizeOptionLookup(option.label) === normalizedFaculty
  })[0]
  if (!matchedOption) {
    return ''
  }
  const matchedMajor = matchedOption.majors.filter(function(option) {
    return option.code === majorCode
  })[0]
  return matchedMajor ? matchedMajor.label : ''
}

function canSelectMajor(faculty) {
  const normalizedFaculty = String(faculty || '').trim()
  return !!normalizedFaculty && normalizedFaculty !== NOT_SELECTED
}

function getMarketplaceItemOptions() {
  return getCachedProfileOptions().marketplaceItemTypes.slice()
}

function getLostFoundItemOptions() {
  return getCachedProfileOptions().lostFoundItemTypes.slice()
}

function getLostFoundModeOptions() {
  return getCachedProfileOptions().lostFoundModes.slice()
}

function formatLocationDisplay(regionName, stateName, cityName, locale) {
  var normalizedLocale = typeof i18n.normalizeLocale === 'function'
    ? i18n.normalizeLocale(locale || getCurrentLocale())
    : 'zh-CN'
  var parts = [regionName, stateName, cityName].filter(function(item, index, list) {
    return !!item && item !== list[index - 1]
  })

  if (normalizedLocale === 'en' || normalizedLocale === 'ja' || normalizedLocale === 'ko') {
    return parts.reverse().join(', ')
  }

  return parts.join(' ')
}

function normalizeProfileOptions(payload) {
  const fallbackPayload = profileCatalog.buildDefaultProfileOptionsPayload()
  const safePayload = payload || {}
  const normalizedFallbackFaculties = normalizeFacultyOptions(fallbackPayload.faculties, [])
  const faculties = normalizeFacultyOptions(safePayload.faculties, normalizedFallbackFaculties)

  return {
    faculties: faculties,
    marketplaceItemTypes: normalizeDictionaryOptions(safePayload.marketplaceItemTypes, fallbackPayload.marketplaceItemTypes),
    lostFoundItemTypes: normalizeDictionaryOptions(safePayload.lostFoundItemTypes, fallbackPayload.lostFoundItemTypes),
    lostFoundModes: normalizeDictionaryOptions(safePayload.lostFoundModes, fallbackPayload.lostFoundModes)
  }
}

function normalizeFacultyOptions(options, fallbackOptions) {
  const legacyFallbackLocale = typeof i18n.getCurrentLocale === 'function'
    ? i18n.getCurrentLocale()
    : 'zh-CN'
  const legacyFallbackFaculties = profileCatalog.buildDefaultProfileOptionsPayload(legacyFallbackLocale).faculties
  const fallbackFacultyByCode = fallbackOptions.reduce(function(result, faculty) {
    if (faculty && typeof faculty.code === 'number') {
      result[faculty.code] = faculty
    }
    return result
  }, {})
  const fallbackMajorCodeByLabel = legacyFallbackFaculties.reduce(function(result, faculty) {
    (faculty.majors || []).forEach(function(major) {
      if (major && major.label && major.code) {
        result[normalizeOptionLookup(major.label)] = major.code
      }
    })
    return result
  }, {})

  const normalizedOptions = (Array.isArray(options) ? options : []).map(function(option) {
    const code = typeof option.code === 'number' ? option.code : null
    const fallbackFaculty = code === null ? null : fallbackFacultyByCode[code]
    var label = String(option.label || (fallbackFaculty && fallbackFaculty.label) || '').trim()
    if (code === null || !label) {
      return null
    }

    if (code === 0) {
      label = NOT_SELECTED
    }

    const majors = (Array.isArray(option.majors) ? option.majors : [])
      .map(function(major) {
        if (typeof major === 'string') {
          var majorValueFromString = String(major || '').trim()
          if (!majorValueFromString) {
            return null
          }

          const normalizedMajorValue = normalizeOptionLookup(majorValueFromString)
          const fallbackMajorCode = fallbackMajorCodeByLabel[normalizedMajorValue]

          if (majorValueFromString === 'unselected' || fallbackMajorCode === 'unselected') {
            return {
              code: 'unselected',
              label: NOT_SELECTED
            }
          }

          const fallbackMajor = ((fallbackFaculty && fallbackFaculty.majors) || []).filter(function(item) {
            return item && item.code === majorValueFromString
          })[0]

          return {
            code: fallbackMajorCode || majorValueFromString,
            label: String((fallbackMajor && fallbackMajor.label) || '').trim() || majorValueFromString
          }
        }
        if (!major || typeof major !== 'object') {
          return null
        }
        var majorCode = String(major.code || '').trim()
        var majorLabel = String(major.label || '').trim()
        if (!majorLabel) {
          majorLabel = String((((fallbackFaculty && fallbackFaculty.majors) || []).filter(function(item) {
            return item && item.code === majorCode
          })[0] || {}).label || '').trim()
        }
        if (!majorCode || !majorLabel) {
          return null
        }
        if (majorCode === 'unselected') {
          majorLabel = NOT_SELECTED
        }
        return {
          code: majorCode,
          label: majorLabel
        }
      })
      .filter(function(major) {
        return !!major
      })

    return {
      code: code,
      label: label,
      majors: majors.length ? majors : [NOT_SELECTED]
    }
  }).filter(function(option) {
    return !!option
  })

  return normalizedOptions.length ? normalizedOptions : fallbackOptions.slice()
}

function normalizeDictionaryOptions(options, fallbackOptions) {
  const normalizedOptions = (Array.isArray(options) ? options : []).map(function(option) {
    const code = typeof option === 'number'
      ? option
      : (typeof option.code === 'number' ? option.code : null)
    const fallbackOption = Array.isArray(fallbackOptions)
      ? fallbackOptions.filter(function(item) { return item && item.code === code })[0]
      : null
    const label = String(
      (option && typeof option === 'object' ? option.label : '') ||
      (fallbackOption && fallbackOption.label) ||
      ''
    ).trim()
    if (code === null || !label) {
      return null
    }

    return {
      code: code,
      label: label
    }
  }).filter(function(option) {
    return !!option
  })

  return normalizedOptions.length ? normalizedOptions : fallbackOptions.slice()
}

function normalizeOptionLookup(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
}

function getCurrentLocale() {
  return typeof i18n.getCurrentLocale === 'function'
    ? i18n.getCurrentLocale()
    : 'zh-CN'
}

module.exports = {
  NOT_SELECTED,
  fetchProfileOptions,
  getCachedProfileOptions,
  getDefaultProfileOptionsPayload,
  getFacultyOptions,
  getFacultyDictionaryOptions,
  getFacultyCodeByLabel,
  getEnrollmentYearOptions,
  getMajorOptions,
  getMajorCodeByLabel,
  getMajorLabelByCode,
  canSelectMajor,
  getMarketplaceItemOptions,
  getLostFoundItemOptions,
  getLostFoundModeOptions,
  formatLocationDisplay
}
