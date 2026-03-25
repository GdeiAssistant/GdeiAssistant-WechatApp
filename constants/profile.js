const userApi = require('../services/apis/user.js')
const i18n = require('../utils/i18n.js')

const NOT_SELECTED = '__not_selected__'

const FACULTY_OPTIONS = [
  NOT_SELECTED,
  '教育学院',
  '政法系',
  '中文系',
  '数学系',
  '外语系',
  '物理与信息工程系',
  '化学系',
  '生物与食品工程学院',
  '体育学院',
  '美术学院',
  '计算机科学系',
  '音乐系',
  '教师研修学院',
  '成人教育学院',
  '网络教育学院',
  '马克思主义学院'
]

const MAJOR_OPTIONS_BY_FACULTY = {
  [NOT_SELECTED]: [NOT_SELECTED],
  教育学院: [NOT_SELECTED, '教育学', '学前教育', '小学教育', '特殊教育'],
  政法系: [NOT_SELECTED, '法学', '思想政治教育', '社会工作'],
  中文系: [NOT_SELECTED, '汉语言文学', '历史学', '秘书学'],
  数学系: [NOT_SELECTED, '数学与应用数学', '信息与计算科学', '统计学'],
  外语系: [NOT_SELECTED, '英语', '商务英语', '日语', '翻译'],
  物理与信息工程系: [NOT_SELECTED, '物理学', '电子信息工程', '通信工程'],
  化学系: [NOT_SELECTED, '化学', '应用化学', '材料化学'],
  生物与食品工程学院: [NOT_SELECTED, '生物科学', '生物技术', '食品科学与工程'],
  体育学院: [NOT_SELECTED, '体育教育', '社会体育指导与管理'],
  美术学院: [NOT_SELECTED, '美术学', '视觉传达设计', '环境设计'],
  计算机科学系: [NOT_SELECTED, '软件工程', '网络工程', '计算机科学与技术', '物联网工程'],
  音乐系: [NOT_SELECTED, '音乐学', '音乐表演', '舞蹈学'],
  教师研修学院: [NOT_SELECTED, '教育学', '教育技术学'],
  成人教育学院: [NOT_SELECTED, '汉语言文学', '学前教育', '行政管理'],
  网络教育学院: [NOT_SELECTED, '计算机科学与技术', '工商管理', '会计学'],
  马克思主义学院: [NOT_SELECTED, '思想政治教育', '马克思主义理论']
}

const MAJOR_CODE_MAP = {
  未选择: 'unselected',
  教育学: 'education',
  学前教育: 'preschool_education',
  小学教育: 'primary_education',
  特殊教育: 'special_education',
  法学: 'law',
  思想政治教育: 'ideological_political_education',
  社会工作: 'social_work',
  汉语言文学: 'chinese_language_literature',
  历史学: 'history',
  秘书学: 'secretarial_studies',
  数学与应用数学: 'mathematics_applied_mathematics',
  信息与计算科学: 'information_computing_science',
  统计学: 'statistics',
  英语: 'english',
  商务英语: 'business_english',
  日语: 'japanese',
  翻译: 'translation',
  物理学: 'physics',
  电子信息工程: 'electronic_information_engineering',
  通信工程: 'communication_engineering',
  化学: 'chemistry',
  应用化学: 'applied_chemistry',
  材料化学: 'materials_chemistry',
  生物科学: 'biological_science',
  生物技术: 'biotechnology',
  食品科学与工程: 'food_science_engineering',
  体育教育: 'physical_education',
  社会体育指导与管理: 'social_sports_guidance_management',
  美术学: 'fine_arts',
  视觉传达设计: 'visual_communication_design',
  环境设计: 'environmental_design',
  软件工程: 'software_engineering',
  网络工程: 'network_engineering',
  计算机科学与技术: 'computer_science_technology',
  物联网工程: 'internet_of_things_engineering',
  音乐学: 'musicology',
  音乐表演: 'music_performance',
  舞蹈学: 'dance',
  教育技术学: 'educational_technology',
  行政管理: 'public_administration',
  工商管理: 'business_administration',
  会计学: 'accounting',
  马克思主义理论: 'marxist_theory'
}

const DEFAULT_PROFILE_OPTIONS_PAYLOAD = {
  faculties: FACULTY_OPTIONS.map(function(label, index) {
    return {
      code: index,
      label: label,
      majors: (MAJOR_OPTIONS_BY_FACULTY[label] || [NOT_SELECTED]).map(function(majorLabel) {
        return {
          code: MAJOR_CODE_MAP[majorLabel] || normalizeOptionLookup(majorLabel),
          label: majorLabel
        }
      })
    }
  }),
  marketplaceItemTypes: [
    '校园代步',
    '手机',
    '电脑',
    '数码配件',
    '数码',
    '电器',
    '运动健身',
    '衣物伞帽',
    '图书教材',
    '租赁',
    '生活娱乐',
    '其他'
  ].map(function(label, index) {
    return { code: index, label: label }
  }),
  lostFoundItemTypes: [
    '手机',
    '校园卡',
    '身份证',
    '银行卡',
    '书',
    '钥匙',
    '包包',
    '衣帽',
    '校园代步',
    '运动健身',
    '数码配件',
    '其他'
  ].map(function(label, index) {
    return { code: index, label: label }
  }),
  lostFoundModes: [
    '寻物启事',
    '失物招领'
  ].map(function(label, index) {
    return { code: index, label: label }
  })
}

let cachedProfileOptions = normalizeProfileOptions(DEFAULT_PROFILE_OPTIONS_PAYLOAD)
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

    cachedProfileOptions = normalizeProfileOptions(result.data || {})
    hasLoadedRemoteProfileOptions = true
    return cachedProfileOptions
  })
}

function getCachedProfileOptions() {
  return cachedProfileOptions
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

function formatLocationDisplay(regionName, stateName, cityName) {
  return [regionName, stateName, cityName].filter(function(item, index, list) {
    return !!item && item !== list[index - 1]
  }).join(' ')
}

function normalizeProfileOptions(payload) {
  const safePayload = payload || {}
  const faculties = normalizeFacultyOptions(safePayload.faculties, DEFAULT_PROFILE_OPTIONS_PAYLOAD.faculties)

  return {
    faculties: faculties,
    marketplaceItemTypes: normalizeDictionaryOptions(safePayload.marketplaceItemTypes, DEFAULT_PROFILE_OPTIONS_PAYLOAD.marketplaceItemTypes),
    lostFoundItemTypes: normalizeDictionaryOptions(safePayload.lostFoundItemTypes, DEFAULT_PROFILE_OPTIONS_PAYLOAD.lostFoundItemTypes),
    lostFoundModes: normalizeDictionaryOptions(safePayload.lostFoundModes, DEFAULT_PROFILE_OPTIONS_PAYLOAD.lostFoundModes)
  }
}

function normalizeFacultyOptions(options, fallbackOptions) {
  const normalizedOptions = (Array.isArray(options) ? options : []).map(function(option) {
    const code = typeof option.code === 'number' ? option.code : null
    var label = String(option.label || '').trim()
    if (code === null || !label) {
      return null
    }

    // Normalize remote Chinese sentinel to internal constant
    if (label === '未选择') {
      label = NOT_SELECTED
    }

    const majors = (Array.isArray(option.majors) ? option.majors : [])
      .map(function(major) {
        if (typeof major === 'string') {
          var majorLabelFromString = String(major || '').trim()
          if (!majorLabelFromString) {
            return null
          }
          if (majorLabelFromString === '未选择') {
            majorLabelFromString = NOT_SELECTED
          }
          return {
            code: MAJOR_CODE_MAP[majorLabelFromString === NOT_SELECTED ? '未选择' : majorLabelFromString] || normalizeOptionLookup(majorLabelFromString),
            label: majorLabelFromString
          }
        }
        if (!major || typeof major !== 'object') {
          return null
        }
        var majorCode = String(major.code || '').trim()
        var majorLabel = String(major.label || '').trim()
        if (!majorCode || !majorLabel) {
          return null
        }
        if (majorLabel === '未选择') {
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
    const code = typeof option.code === 'number' ? option.code : null
    const label = String(option.label || '').trim()
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

module.exports = {
  NOT_SELECTED,
  FACULTY_OPTIONS,
  MAJOR_OPTIONS_BY_FACULTY,
  fetchProfileOptions,
  getCachedProfileOptions,
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
