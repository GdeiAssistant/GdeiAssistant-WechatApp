const userApi = require('../services/apis/user.js')

const FACULTY_OPTIONS = [
  '未选择',
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
  未选择: ['未选择'],
  教育学院: ['未选择', '教育学', '学前教育', '小学教育', '特殊教育'],
  政法系: ['未选择', '法学', '思想政治教育', '社会工作'],
  中文系: ['未选择', '汉语言文学', '历史学', '秘书学'],
  数学系: ['未选择', '数学与应用数学', '信息与计算科学', '统计学'],
  外语系: ['未选择', '英语', '商务英语', '日语', '翻译'],
  物理与信息工程系: ['未选择', '物理学', '电子信息工程', '通信工程'],
  化学系: ['未选择', '化学', '应用化学', '材料化学'],
  生物与食品工程学院: ['未选择', '生物科学', '生物技术', '食品科学与工程'],
  体育学院: ['未选择', '体育教育', '社会体育指导与管理'],
  美术学院: ['未选择', '美术学', '视觉传达设计', '环境设计'],
  计算机科学系: ['未选择', '软件工程', '网络工程', '计算机科学与技术', '物联网工程'],
  音乐系: ['未选择', '音乐学', '音乐表演', '舞蹈学'],
  教师研修学院: ['未选择', '教育学', '教育技术学'],
  成人教育学院: ['未选择', '汉语言文学', '学前教育', '行政管理'],
  网络教育学院: ['未选择', '计算机科学与技术', '工商管理', '会计学'],
  马克思主义学院: ['未选择', '思想政治教育', '马克思主义理论']
}

const DEFAULT_PROFILE_OPTIONS_PAYLOAD = {
  faculties: FACULTY_OPTIONS.map(function(label, index) {
    return {
      code: index,
      label: label,
      majors: MAJOR_OPTIONS_BY_FACULTY[label] || ['未选择']
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
  const yearOptions = ['未选择']

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
      throw new Error(result.message || '加载资料选项失败')
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
  return matchedOption ? matchedOption.majors.slice() : ['未选择']
}

function canSelectMajor(faculty) {
  const normalizedFaculty = String(faculty || '').trim()
  return !!normalizedFaculty && normalizedFaculty !== '未选择'
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
    const label = String(option.label || '').trim()
    if (code === null || !label) {
      return null
    }

    const majors = (Array.isArray(option.majors) ? option.majors : [])
      .map(function(major) {
        return String(major || '').trim()
      })
      .filter(function(major) {
        return !!major
      })

    return {
      code: code,
      label: label,
      majors: majors.length ? majors : ['未选择']
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
  FACULTY_OPTIONS,
  MAJOR_OPTIONS_BY_FACULTY,
  fetchProfileOptions,
  getCachedProfileOptions,
  getFacultyOptions,
  getFacultyDictionaryOptions,
  getFacultyCodeByLabel,
  getEnrollmentYearOptions,
  getMajorOptions,
  canSelectMajor,
  getMarketplaceItemOptions,
  getLostFoundItemOptions,
  getLostFoundModeOptions,
  formatLocationDisplay
}
