const i18n = require('../utils/i18n.js')
const profileCatalog = require('./profile-catalog.js')
const LOCATION_REGIONS = require('./location-regions.js')

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
    return Promise.resolve(getCachedProfileOptions())
  }

  // Resolve the API lazily: request -> mock -> profile handlers also use this catalog.
  const userApi = require('../services/apis/user.js')
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
    cachedProfileOptions = normalizeProfileOptions(cachedProfileOptionsPayload, hasLoadedRemoteProfileOptions)
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

function getLocationNodeName(node, locale) {
  if (!node || typeof node !== 'object') {
    return ''
  }
  const normalizedLocale = i18n.normalizeLocale(locale || getCurrentLocale())
  const localizedName = (node.localizedNames || {})[normalizedLocale]
  if (localizedName) {
    return String(localizedName).trim()
  }
  if (normalizedLocale === 'en' || normalizedLocale === 'ja' || normalizedLocale === 'ko') {
    return String(node.latinName || node.aliasesName || node.name || '').trim()
  }
  return String(node.aliasesName || node.name || '').trim()
}

function findLocationNodes(codes, locationTree) {
  const safeCodes = codes || {}
  const regionCode = String(safeCodes.region || '')
  const stateCode = String(safeCodes.state || '')
  const cityCode = String(safeCodes.city || '')
  const region = (locationTree || LOCATION_REGIONS).find(function(node) { return node.code === regionCode })
  if (!region || (!stateCode && cityCode)) {
    return null
  }
  const state = stateCode ? (region.states || []).find(function(node) { return node.code === stateCode }) : null
  if (stateCode && !state) {
    return null
  }
  const city = cityCode ? (state.cities || []).find(function(node) { return node.code === cityCode }) : null
  return cityCode && !city ? null : { region: region, state: state, city: city }
}

function getLocationDisplay(codes, fallback, locale, locationTree) {
  const nodes = findLocationNodes(codes, locationTree)
  return nodes ? formatLocationDisplay(
    getLocationNodeName(nodes.region, locale),
    getLocationNodeName(nodes.state, locale),
    getLocationNodeName(nodes.city, locale),
    locale
  ) : (fallback || '')
}

let locationNameIndex

function localizeIpArea(value, locale) {
  // Only complete catalog names/paths are system geography. Unknown text is kept verbatim.
  if (!locationNameIndex) {
    locationNameIndex = Object.create(null)
    const addPath = function(nodes) {
      const aliases = [
        nodes.map(function(node) { return node.name }).join(' '),
        nodes.map(function(node) { return node.name }).join(''),
        nodes.map(function(node) { return node.aliasesName || node.name }).join(' '),
        nodes.map(function(node) { return node.latinName || node.name }).join(' ')
      ]
      i18n.SUPPORTED_LOCALES.forEach(function(language) {
        const foreign = language === 'en' || language === 'ja' || language === 'ko'
        const names = nodes.map(function(node) {
          return (node.localizedNames || {})[language] || (foreign && node.latinName) || node.aliasesName || node.name
        })
        aliases.push(names.join(' '), foreign ? names.slice().reverse().join(', ') : names.join(' '))
        if (language.indexOf('zh-') === 0) aliases.push(names.join(''))
      })
      aliases.forEach(function(name) {
        if (!name) return
        const candidates = locationNameIndex[name] || (locationNameIndex[name] = [])
        if (candidates.indexOf(nodes) === -1) candidates.push(nodes)
      })
    }
    const addNodes = function(nodes, parents, level) {
      nodes.forEach(function(node) {
        const fullPath = parents.concat(node)
        for (let start = 0; start < fullPath.length; start += 1) addPath(fullPath.slice(start))
        if (level < 2) addNodes(node[level === 0 ? 'states' : 'cities'] || [], fullPath, level + 1)
      })
    }
    addNodes(LOCATION_REGIONS, [], 0)
  }
  const candidates = locationNameIndex[value]
  if (!candidates || !candidates.length) {
    return value || ''
  }
  const names = candidates.map(function(nodes) {
    const labels = nodes.map(function(node) { return getLocationNodeName(node, locale) })
    return formatLocationDisplay(labels[0], labels[1], labels[2], locale)
  })
  return names.every(function(name) { return name === names[0] }) ? names[0] : value
}

function normalizeProfileOptions(payload, relocalize) {
  const fallbackPayload = profileCatalog.buildDefaultProfileOptionsPayload()
  const safePayload = payload || {}
  const normalizedFallbackFaculties = normalizeFacultyOptions(fallbackPayload.faculties, [])
  const faculties = normalizeFacultyOptions(safePayload.faculties, normalizedFallbackFaculties, relocalize)

  return {
    faculties: faculties,
    marketplaceItemTypes: normalizeDictionaryOptions(safePayload.marketplaceItemTypes, fallbackPayload.marketplaceItemTypes, relocalize),
    lostFoundItemTypes: normalizeDictionaryOptions(safePayload.lostFoundItemTypes, fallbackPayload.lostFoundItemTypes, relocalize),
    lostFoundModes: normalizeDictionaryOptions(safePayload.lostFoundModes, fallbackPayload.lostFoundModes, relocalize)
  }
}

function normalizeFacultyOptions(options, fallbackOptions, relocalize) {
  const legacyFallbackFaculties = (i18n.SUPPORTED_LOCALES || [getCurrentLocale()]).reduce(function(result, language) {
    return result.concat(profileCatalog.buildDefaultProfileOptionsPayload(language).faculties)
  }, [])
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
    var label = String((relocalize && fallbackFaculty && fallbackFaculty.label) || option.label || (fallbackFaculty && fallbackFaculty.label) || '').trim()
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

          const majorCode = fallbackMajorCode || majorValueFromString
          const fallbackMajor = ((fallbackFaculty && fallbackFaculty.majors) || []).find(function(item) {
            return item && item.code === majorCode
          })

          return {
            code: majorCode,
            label: String((fallbackMajor && fallbackMajor.label) || '').trim() || majorValueFromString
          }
        }
        if (!major || typeof major !== 'object') {
          return null
        }
        var majorCode = String(major.code || '').trim()
        var majorLabel = String(major.label || '').trim()
        if (!majorLabel || relocalize) {
          majorLabel = String((((fallbackFaculty && fallbackFaculty.majors) || []).filter(function(item) {
            return item && item.code === majorCode
          })[0] || {}).label || majorLabel).trim()
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

function normalizeDictionaryOptions(options, fallbackOptions, relocalize) {
  const normalizedOptions = (Array.isArray(options) ? options : []).map(function(option) {
    const code = typeof option === 'number'
      ? option
      : (typeof option.code === 'number' ? option.code : null)
    const fallbackOption = Array.isArray(fallbackOptions)
      ? fallbackOptions.filter(function(item) { return item && item.code === code })[0]
      : null
    const label = String(
      (relocalize && fallbackOption && fallbackOption.label) ||
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
  formatLocationDisplay,
  getLocationNodeName,
  findLocationNodes,
  getLocationDisplay,
  localizeIpArea
}
