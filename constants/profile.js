const i18n = require('../utils/i18n.js')
const profileCatalog = require('./profile-catalog.js')

const loadNodeModule =
  typeof module !== 'undefined' && typeof module.require === 'function'
    ? module.require.bind(module)
    : null

const NOT_SELECTED = '__not_selected__'
let cachedProfileOptionsPayload = profileCatalog.buildDefaultProfileOptionsPayload()
let cachedProfileOptions = normalizeProfileOptions(cachedProfileOptionsPayload)
let cachedProfileOptionsLocale = getCurrentLocale()
let hasLoadedRemoteProfileOptions = false
let cachedLocationRegions = null
let locationRegionsPromise = null

function getLocationRegionsSync() {
  if (Array.isArray(cachedLocationRegions)) {
    return cachedLocationRegions
  }
  if (typeof require.async !== 'function' && loadNodeModule) {
    cachedLocationRegions = loadNodeModule('../subpackages/location/location-regions.js')
    return cachedLocationRegions
  }
  return []
}

function loadLocationRegions() {
  if (Array.isArray(cachedLocationRegions)) {
    return Promise.resolve(cachedLocationRegions)
  }
  if (locationRegionsPromise) {
    return locationRegionsPromise
  }
  const loader =
    typeof require.async === 'function'
      ? require.async('../subpackages/location/location-regions.js')
      : Promise.resolve(
          loadNodeModule ? loadNodeModule('../subpackages/location/location-regions.js') : []
        )
  locationRegionsPromise = loader
    .then(function(regions) {
      const list = Array.isArray(regions) ? regions : (regions && regions.default) || []
      if (list.length) {
        cachedLocationRegions = list
      }
      locationRegionsPromise = null
      return list
    })
    .catch(function(error) {
      locationRegionsPromise = null
      throw error
    })
  return locationRegionsPromise
}

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
    cachedProfileOptions = normalizeProfileOptions(
      cachedProfileOptionsPayload,
      hasLoadedRemoteProfileOptions
    )
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

function getFacultyByCode(facultyCode) {
  if (facultyCode === null || facultyCode === undefined || facultyCode === '') {
    return null
  }
  const targetCode = Number(facultyCode)
  if (!Number.isFinite(targetCode)) {
    return null
  }
  return (
    getCachedProfileOptions().faculties.find(function(option) {
      return option.code === targetCode
    }) || null
  )
}

function getFacultyLabelByCode(facultyCode) {
  const matchedOption = getFacultyByCode(facultyCode)
  return matchedOption ? matchedOption.label : NOT_SELECTED
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
  return matchedOption
    ? matchedOption.majors.map(function(option) {
        return option.label
      })
    : [NOT_SELECTED]
}

function getMajorDictionaryOptionsByFacultyCode(facultyCode) {
  const matchedOption = getFacultyByCode(facultyCode)
  return matchedOption && Array.isArray(matchedOption.majors) && matchedOption.majors.length
    ? matchedOption.majors.slice()
    : [{ code: 'unselected', label: NOT_SELECTED }]
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

function getMajorLabelByFacultyCode(facultyCode, majorCode) {
  if (!majorCode) {
    return ''
  }
  const matchedOption = getFacultyByCode(facultyCode)
  if (!matchedOption) {
    return ''
  }
  const matchedMajor = matchedOption.majors.find(function(option) {
    return option.code === majorCode
  })
  return matchedMajor ? matchedMajor.label : ''
}

function canSelectMajor(faculty) {
  const normalizedFaculty = String(faculty || '').trim()
  return !!normalizedFaculty && normalizedFaculty !== NOT_SELECTED
}

function canSelectMajorByCode(facultyCode) {
  return typeof facultyCode === 'number' && facultyCode !== 0
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
  var normalizedLocale =
    typeof i18n.normalizeLocale === 'function'
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
  const regions = locationTree || getLocationRegionsSync()
  const region = regions.find(function(node) {
    return node.code === regionCode
  })
  if (!region || (!stateCode && cityCode)) {
    return null
  }
  const state = stateCode
    ? (region.states || []).find(function(node) {
        return node.code === stateCode
      })
    : null
  if (stateCode && !state) {
    return null
  }
  const city = cityCode
    ? (state.cities || []).find(function(node) {
        return node.code === cityCode
      })
    : null
  return cityCode && !city ? null : { region: region, state: state, city: city }
}

function getLocationDisplay(codes, fallback, locale, locationTree) {
  const nodes = findLocationNodes(codes, locationTree)
  return nodes
    ? formatLocationDisplay(
        getLocationNodeName(nodes.region, locale),
        getLocationNodeName(nodes.state, locale),
        getLocationNodeName(nodes.city, locale),
        locale
      )
    : fallback || ''
}

const FOREIGN_LOCALES = { en: true, ja: true, ko: true }
let ipAreaCache = new WeakMap()

function nodeMatchesExact(node, target, locales) {
  if (node.name === target || node.aliasesName === target || node.latinName === target) {
    return true
  }
  const localized = node.localizedNames
  if (!localized) {
    return false
  }
  for (let i = 0; i < locales.length; i += 1) {
    if (localized[locales[i]] === target) {
      return true
    }
  }
  return false
}

function nodeSubstrMatches(node, target, locales) {
  if (!node.name) {
    return true
  }
  if (
    target.indexOf(node.name) !== -1 ||
    (node.aliasesName && target.indexOf(node.aliasesName) !== -1) ||
    (node.latinName && target.indexOf(node.latinName) !== -1)
  ) {
    return true
  }
  const localized = node.localizedNames
  if (!localized) {
    return false
  }
  for (let i = 0; i < locales.length; i += 1) {
    const label = localized[locales[i]]
    if (label && target.indexOf(label) !== -1) {
      return true
    }
  }
  return false
}

function resolveLocaleLabel(node, lang, isForeign) {
  const localized = node.localizedNames
  return (localized && localized[lang]) || (isForeign && node.latinName) || node.aliasesName || node.name
}

function matchPathMulti(target, locales, n0, n1, n2) {
  const s1 = n1.name
  const s2 = n2 ? n2.name : ''
  const rawSpaced = n2 ? n0.name + ' ' + s1 + ' ' + s2 : n0.name + ' ' + s1
  const rawCompact = n2 ? n0.name + s1 + s2 : n0.name + s1
  const a0 = n0.aliasesName || n0.name
  const a1 = n1.aliasesName || s1
  const a2 = n2 ? n2.aliasesName || s2 : ''
  const aliasSpaced = n2 ? a0 + ' ' + a1 + ' ' + a2 : a0 + ' ' + a1
  const l0 = n0.latinName || n0.name
  const l1 = n1.latinName || s1
  const l2 = n2 ? n2.latinName || s2 : ''
  const latinSpaced = n2 ? l0 + ' ' + l1 + ' ' + l2 : l0 + ' ' + l1
  if (
    rawSpaced === target ||
    rawCompact === target ||
    aliasSpaced === target ||
    latinSpaced === target
  ) {
    return true
  }
  for (let i = 0; i < locales.length; i += 1) {
    const lang = locales[i]
    const isForeign = !!FOREIGN_LOCALES[lang]
    const p0 = resolveLocaleLabel(n0, lang, isForeign)
    const p1 = resolveLocaleLabel(n1, lang, isForeign)
    const p2 = n2 ? resolveLocaleLabel(n2, lang, isForeign) : ''
    const spaced = n2 ? p0 + ' ' + p1 + ' ' + p2 : p0 + ' ' + p1
    if (
      spaced === target ||
      (isForeign && (n2 ? p2 + ', ' + p1 + ', ' + p0 : p1 + ', ' + p0) === target) ||
      (lang.indexOf('zh-') === 0 && (n2 ? p0 + p1 + p2 : p0 + p1) === target)
    ) {
      return true
    }
  }
  return false
}

function findIpAreaCandidates(value, regions) {
  let byValue = ipAreaCache.get(regions)
  if (byValue && byValue.has(value)) {
    return byValue.get(value)
  }
  const locales = i18n.SUPPORTED_LOCALES
  const candidates = []
  for (let i = 0; i < regions.length; i += 1) {
    const region = regions[i]
    if (nodeMatchesExact(region, value, locales)) {
      candidates.push([region])
    }
    const regionSub = nodeSubstrMatches(region, value, locales)
    const states = region.states || []
    for (let j = 0; j < states.length; j += 1) {
      const state = states[j]
      const stateSub = nodeSubstrMatches(state, value, locales)
      if (regionSub && stateSub && matchPathMulti(value, locales, region, state, null)) {
        candidates.push([region, state])
      }
      if (nodeMatchesExact(state, value, locales)) {
        candidates.push([state])
      }
      const cities = state.cities || []
      for (let k = 0; k < cities.length; k += 1) {
        const city = cities[k]
        if (nodeMatchesExact(city, value, locales)) {
          candidates.push([city])
        }
        if (stateSub && nodeSubstrMatches(city, value, locales)) {
          if (regionSub && matchPathMulti(value, locales, region, state, city)) {
            candidates.push([region, state, city])
          }
          if (matchPathMulti(value, locales, state, city, null)) {
            candidates.push([state, city])
          }
        }
      }
    }
  }
  if (!byValue) {
    byValue = new Map()
    ipAreaCache.set(regions, byValue)
  }
  byValue.set(value, candidates)
  return candidates
}

function localizeIpArea(value, locale, locationTree) {
  // Only complete catalog names/paths are system geography. Unknown text is kept verbatim.
  if (!value) {
    return ''
  }
  const regions = locationTree || getLocationRegionsSync()
  if (!Array.isArray(regions) || !regions.length) {
    return value
  }
  const candidates = findIpAreaCandidates(value, regions)
  if (!candidates.length) {
    return value
  }
  const names = candidates.map(function(nodes) {
    const labels = nodes.map(function(node) {
      return getLocationNodeName(node, locale)
    })
    return formatLocationDisplay(labels[0], labels[1], labels[2], locale)
  })
  return names.every(function(name) {
    return name === names[0]
  })
    ? names[0]
    : value
}

function normalizeProfileOptions(payload, relocalize) {
  const fallbackPayload = profileCatalog.buildDefaultProfileOptionsPayload()
  const safePayload = payload || {}
  const normalizedFallbackFaculties = normalizeFacultyOptions(fallbackPayload.faculties, [])
  const faculties = normalizeFacultyOptions(
    safePayload.faculties,
    normalizedFallbackFaculties,
    relocalize
  )

  return {
    faculties: faculties,
    marketplaceItemTypes: normalizeDictionaryOptions(
      safePayload.marketplaceItemTypes,
      fallbackPayload.marketplaceItemTypes,
      relocalize
    ),
    lostFoundItemTypes: normalizeDictionaryOptions(
      safePayload.lostFoundItemTypes,
      fallbackPayload.lostFoundItemTypes,
      relocalize
    ),
    lostFoundModes: normalizeDictionaryOptions(
      safePayload.lostFoundModes,
      fallbackPayload.lostFoundModes,
      relocalize
    )
  }
}

function normalizeFacultyOptions(options, fallbackOptions, relocalize) {
  const fallbackFacultyByCode = fallbackOptions.reduce(function(result, faculty) {
    if (faculty && typeof faculty.code === 'number') {
      result[faculty.code] = faculty
    }
    return result
  }, {})

  const normalizedOptions = (Array.isArray(options) ? options : [])
    .map(function(option) {
      const code = typeof option.code === 'number' ? option.code : null
      const fallbackFaculty = code === null ? null : fallbackFacultyByCode[code]
      var label = String(
        (relocalize && fallbackFaculty && fallbackFaculty.label) ||
          option.label ||
          (fallbackFaculty && fallbackFaculty.label) ||
          ''
      ).trim()
      if (code === null || !label) {
        return null
      }

      if (code === 0) {
        label = NOT_SELECTED
      }

      const majors = (Array.isArray(option.majors) ? option.majors : [])
        .map(function(major) {
          if (typeof major === 'string') {
            const majorCode = String(major || '').trim()
            if (!majorCode) {
              return null
            }
            if (majorCode === 'unselected') {
              return {
                code: 'unselected',
                label: NOT_SELECTED
              }
            }
            const fallbackMajor = ((fallbackFaculty && fallbackFaculty.majors) || []).find(
              function(item) {
                return item && item.code === majorCode
              }
            )
            return {
              code: majorCode,
              label: String((fallbackMajor && fallbackMajor.label) || '').trim() || majorCode
            }
          }
          if (!major || typeof major !== 'object') {
            return null
          }
          var majorCode = String(major.code || '').trim()
          var majorLabel = String(major.label || '').trim()
          if (!majorLabel || relocalize) {
            majorLabel = String(
              (
                ((fallbackFaculty && fallbackFaculty.majors) || []).filter(function(item) {
                  return item && item.code === majorCode
                })[0] || {}
              ).label || majorLabel
            ).trim()
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
        majors: majors.length ? majors : [{ code: 'unselected', label: NOT_SELECTED }]
      }
    })
    .filter(function(option) {
      return !!option
    })

  return normalizedOptions.length ? normalizedOptions : fallbackOptions.slice()
}

function normalizeDictionaryOptions(options, fallbackOptions, relocalize) {
  const normalizedOptions = (Array.isArray(options) ? options : [])
    .map(function(option) {
      const code =
        typeof option === 'number' ? option : typeof option.code === 'number' ? option.code : null
      const fallbackOption = Array.isArray(fallbackOptions)
        ? fallbackOptions.filter(function(item) {
            return item && item.code === code
          })[0]
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
    })
    .filter(function(option) {
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
  return typeof i18n.getCurrentLocale === 'function' ? i18n.getCurrentLocale() : 'zh-CN'
}

module.exports = {
  NOT_SELECTED,
  loadLocationRegions,
  getLocationRegionsSync,
  fetchProfileOptions,
  getCachedProfileOptions,
  getDefaultProfileOptionsPayload,
  getFacultyOptions,
  getFacultyDictionaryOptions,
  getFacultyByCode,
  getFacultyLabelByCode,
  getFacultyCodeByLabel,
  getEnrollmentYearOptions,
  getMajorOptions,
  getMajorDictionaryOptionsByFacultyCode,
  getMajorCodeByLabel,
  getMajorLabelByCode,
  getMajorLabelByFacultyCode,
  canSelectMajor,
  canSelectMajorByCode,
  getMarketplaceItemOptions,
  getLostFoundItemOptions,
  getLostFoundModeOptions,
  formatLocationDisplay,
  getLocationNodeName,
  findLocationNodes,
  getLocationDisplay,
  localizeIpArea
}
