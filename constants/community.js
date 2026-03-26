const {
  getMarketplaceItemOptions,
  getLostFoundItemOptions,
  getLostFoundModeOptions
} = require('./profile.js')
const i18n = require('../utils/i18n.js')

const SECONDHAND_CATEGORY_DEFS = [
  { labelKey: 'community.category.all', value: -1 },
  { labelKey: 'community.category.campusTransport', value: 0 },
  { labelKey: 'community.category.phone', value: 1 },
  { labelKey: 'community.category.computer', value: 2 },
  { labelKey: 'community.category.digitalAccessory', value: 3 },
  { labelKey: 'community.category.digital', value: 4 },
  { labelKey: 'community.category.appliance', value: 5 },
  { labelKey: 'community.category.sportsFitness', value: 6 },
  { labelKey: 'community.category.clothingUmbrella', value: 7 },
  { labelKey: 'community.category.booksTextbooks', value: 8 },
  { labelKey: 'community.category.rental', value: 9 },
  { labelKey: 'community.category.lifeEntertainment', value: 10 },
  { labelKey: 'community.category.other', value: 11 }
]

const LOST_FOUND_MODE_DEFS = [
  { labelKey: 'community.lostFoundMode.lostNotice', value: 0 },
  { labelKey: 'community.lostFoundMode.foundNotice', value: 1 }
]

const LOST_FOUND_ITEM_DEFS = [
  { labelKey: 'community.lostFoundItem.phone', value: 0 },
  { labelKey: 'community.lostFoundItem.campusCard', value: 1 },
  { labelKey: 'community.lostFoundItem.idCard', value: 2 },
  { labelKey: 'community.lostFoundItem.bankCard', value: 3 },
  { labelKey: 'community.lostFoundItem.book', value: 4 },
  { labelKey: 'community.lostFoundItem.key', value: 5 },
  { labelKey: 'community.lostFoundItem.bag', value: 6 },
  { labelKey: 'community.lostFoundItem.clothingHat', value: 7 },
  { labelKey: 'community.lostFoundItem.campusTransport', value: 8 },
  { labelKey: 'community.lostFoundItem.sportsFitness', value: 9 },
  { labelKey: 'community.lostFoundItem.digitalAccessory', value: 10 },
  { labelKey: 'community.lostFoundItem.other', value: 11 }
]

const SECRET_THEME_DEFS = [
  { labelKey: 'community.secretTheme.theme', value: 1, labelParam: 1 },
  { labelKey: 'community.secretTheme.theme', value: 2, labelParam: 2 },
  { labelKey: 'community.secretTheme.theme', value: 3, labelParam: 3 },
  { labelKey: 'community.secretTheme.theme', value: 4, labelParam: 4 },
  { labelKey: 'community.secretTheme.theme', value: 5, labelParam: 5 },
  { labelKey: 'community.secretTheme.theme', value: 6, labelParam: 6 },
  { labelKey: 'community.secretTheme.theme', value: 7, labelParam: 7 },
  { labelKey: 'community.secretTheme.theme', value: 8, labelParam: 8 },
  { labelKey: 'community.secretTheme.theme', value: 9, labelParam: 9 },
  { labelKey: 'community.secretTheme.theme', value: 10, labelParam: 10 },
  { labelKey: 'community.secretTheme.theme', value: 11, labelParam: 11 },
  { labelKey: 'community.secretTheme.theme', value: 12, labelParam: 12 }
]

const SECRET_TYPE_DEFS = [
  { labelKey: 'community.secretType.text', value: 0 },
  { labelKey: 'community.secretType.voice', value: 1 }
]

const EXPRESS_GENDER_DEFS = [
  { labelKey: 'community.gender.male', value: 0 },
  { labelKey: 'community.gender.female', value: 1 },
  { labelKey: 'community.gender.secret', value: 2 }
]

const DELIVERY_STATUS_DEFS = [
  { labelKey: 'community.deliveryStatus.all', value: -1 },
  { labelKey: 'community.deliveryStatus.pending', value: 0 },
  { labelKey: 'community.deliveryStatus.delivering', value: 1 },
  { labelKey: 'community.deliveryStatus.completed', value: 2 }
]

const DATING_AREA_DEFS = [
  { labelKey: 'community.datingArea.girls', value: 0 },
  { labelKey: 'community.datingArea.boys', value: 1 }
]

const DATING_GRADE_DEFS = [
  { labelKey: 'community.datingGrade.year1', value: 1 },
  { labelKey: 'community.datingGrade.year2', value: 2 },
  { labelKey: 'community.datingGrade.year3', value: 3 },
  { labelKey: 'community.datingGrade.year4', value: 4 }
]

const PHOTOGRAPH_TAB_DEFS = [
  { labelKey: 'community.photographTab.life', feedValue: 1, publishValue: 1 },
  { labelKey: 'community.photographTab.campus', feedValue: 0, publishValue: 2 }
]

function normalizeCommunityLocale(locale) {
  if (typeof i18n.normalizeLocale === 'function') {
    return i18n.normalizeLocale(locale)
  }

  const lang = String(locale || '').trim().replace(/_/g, '-').toLowerCase()
  if (!lang) return 'zh-CN'
  if (lang === 'zh-cn' || lang === 'zh-hans' || lang === 'zh-hans-cn' || lang === 'zh') return 'zh-CN'
  if (lang === 'zh-hk' || lang === 'zh-hant-hk') return 'zh-HK'
  if (lang === 'zh-tw' || lang === 'zh-hant' || lang === 'zh-hant-tw') return 'zh-TW'
  if (lang.indexOf('zh-hk') === 0) return 'zh-HK'
  if (lang.indexOf('zh-tw') === 0 || lang.indexOf('zh-hant') === 0) return 'zh-TW'
  if (lang.indexOf('zh') === 0) return 'zh-CN'
  if (lang.indexOf('en') === 0) return 'en'
  if (lang.indexOf('ja') === 0) return 'ja'
  if (lang.indexOf('ko') === 0) return 'ko'
  return 'zh-CN'
}

function getDeliveryDefaultOrderName(locale) {
  const currentLocale = typeof i18n.getCurrentLocale === 'function'
    ? i18n.getCurrentLocale()
    : 'zh-CN'
  const normalizedLocale = normalizeCommunityLocale(locale || currentLocale)

  return normalizedLocale === 'zh-CN'
    ? '代收'
    : normalizedLocale === 'zh-HK' || normalizedLocale === 'zh-TW'
      ? '代收'
      : normalizedLocale === 'en'
        ? 'Parcel pickup'
        : normalizedLocale === 'ja'
          ? '代理受取'
          : '대리수령'
}
const DELIVERY_PLACEHOLDER_PICKUP_CODE = '00000000000'

const COMMUNITY_PAGE_TITLE_KEYS = {
  marketplace: {
    center: 'community.pageTitle.marketplace.center',
    detail: 'community.pageTitle.marketplace.detail',
    publish: 'community.pageTitle.marketplace.publish',
    edit: 'community.pageTitle.marketplace.edit'
  },
  lostandfound: {
    center: 'community.pageTitle.lostandfound.center',
    detail: 'community.pageTitle.lostandfound.detail',
    publish: 'community.pageTitle.lostandfound.publish',
    edit: 'community.pageTitle.lostandfound.edit'
  },
  secret: {
    center: 'community.pageTitle.secret.center',
    detail: 'community.pageTitle.secret.detail',
    publish: 'community.pageTitle.secret.publish'
  },
  express: {
    center: 'community.pageTitle.express.center',
    detail: 'community.pageTitle.express.detail',
    publish: 'community.pageTitle.express.publish'
  },
  topic: {
    center: 'community.pageTitle.topic.center',
    detail: 'community.pageTitle.topic.detail',
    publish: 'community.pageTitle.topic.publish'
  },
  delivery: {
    center: 'community.pageTitle.delivery.center',
    detail: 'community.pageTitle.delivery.detail',
    publish: 'community.pageTitle.delivery.publish'
  },
  dating: {
    center: 'community.pageTitle.dating.center',
    detail: 'community.pageTitle.dating.detail',
    publish: 'community.pageTitle.dating.publish'
  },
  photograph: {
    center: 'community.pageTitle.photograph.center',
    detail: 'community.pageTitle.photograph.detail',
    publish: 'community.pageTitle.photograph.publish'
  }
}

const COMMUNITY_MODULE_DEFS = [
  {
    id: 'marketplace',
    titleKey: 'community.modules.marketplace.title',
    summaryKey: 'community.modules.marketplace.summary',
    icon: '/image/marketplace.png',
    heroStyle: 'background: linear-gradient(135deg, #e9fff7 0%, #f7fffc 100%);',
    page: '/pages/communityList/communityList?module=marketplace',
    supportsSearch: true,
    searchPlaceholderKey: 'community.modules.marketplace.searchPlaceholder',
    centerEnabled: true,
    publishEnabled: true
  },
  {
    id: 'lostandfound',
    titleKey: 'community.modules.lostandfound.title',
    summaryKey: 'community.modules.lostandfound.summary',
    icon: '/image/lostandfound.png',
    heroStyle: 'background: linear-gradient(135deg, #eef6ff 0%, #fafcff 100%);',
    page: '/pages/communityList/communityList?module=lostandfound',
    supportsSearch: true,
    searchPlaceholderKey: 'community.modules.lostandfound.searchPlaceholder',
    centerEnabled: true,
    publishEnabled: true
  },
  {
    id: 'secret',
    titleKey: 'community.modules.secret.title',
    summaryKey: 'community.modules.secret.summary',
    icon: '/image/secret.png',
    heroStyle: 'background: linear-gradient(135deg, #fff0f5 0%, #fffafc 100%);',
    page: '/pages/communityList/communityList?module=secret',
    centerEnabled: true,
    publishEnabled: true
  },
  {
    id: 'express',
    titleKey: 'community.modules.express.title',
    summaryKey: 'community.modules.express.summary',
    icon: '/image/express.png',
    heroStyle: 'background: linear-gradient(135deg, #fff3ef 0%, #fffaf7 100%);',
    page: '/pages/communityList/communityList?module=express',
    supportsSearch: true,
    searchPlaceholderKey: 'community.modules.express.searchPlaceholder',
    centerEnabled: true,
    publishEnabled: true
  },
  {
    id: 'topic',
    titleKey: 'community.modules.topic.title',
    summaryKey: 'community.modules.topic.summary',
    icon: '/image/topic.png',
    heroStyle: 'background: linear-gradient(135deg, #f1f5ff 0%, #fbfcff 100%);',
    page: '/pages/communityList/communityList?module=topic',
    supportsSearch: true,
    searchPlaceholderKey: 'community.modules.topic.searchPlaceholder',
    centerEnabled: true,
    publishEnabled: true
  },
  {
    id: 'delivery',
    titleKey: 'community.modules.delivery.title',
    summaryKey: 'community.modules.delivery.summary',
    icon: '/image/delivery.png',
    heroStyle: 'background: linear-gradient(135deg, #fff5e8 0%, #fffaf3 100%);',
    page: '/pages/communityList/communityList?module=delivery',
    centerEnabled: true,
    publishEnabled: true
  },
  {
    id: 'dating',
    titleKey: 'community.modules.dating.title',
    summaryKey: 'community.modules.dating.summary',
    icon: '/image/dating.png',
    heroStyle: 'background: linear-gradient(135deg, #fff2f0 0%, #fff9f8 100%);',
    page: '/pages/communityList/communityList?module=dating',
    centerEnabled: true,
    publishEnabled: true
  },
  {
    id: 'photograph',
    titleKey: 'community.modules.photograph.title',
    summaryKey: 'community.modules.photograph.summary',
    icon: '/image/photograph.png',
    heroStyle: 'background: linear-gradient(135deg, #eefbf5 0%, #fbfffd 100%);',
    page: '/pages/communityList/communityList?module=photograph',
    centerEnabled: true,
    publishEnabled: true
  }
]

function resolveOptionDef(def) {
  var label = i18n.t(def.labelKey)
  if (def.labelParam !== undefined) {
    label = i18n.tReplace('community.secretTheme.theme', { n: def.labelParam })
  }
  var result = { label: label, value: def.value }
  if (def.feedValue !== undefined) result.feedValue = def.feedValue
  if (def.publishValue !== undefined) result.publishValue = def.publishValue
  return result
}

function resolveModuleDef(def) {
  var result = {
    id: def.id,
    title: i18n.t(def.titleKey),
    summary: i18n.t(def.summaryKey),
    icon: def.icon,
    heroStyle: def.heroStyle,
    page: def.page,
    centerEnabled: def.centerEnabled,
    publishEnabled: def.publishEnabled
  }
  if (def.supportsSearch) {
    result.supportsSearch = true
    result.searchPlaceholder = i18n.t(def.searchPlaceholderKey)
  }
  return result
}

function getCommunityModules() {
  return COMMUNITY_MODULE_DEFS.map(resolveModuleDef)
}

function getCommunityModuleMap() {
  return getCommunityModules().reduce(function(result, moduleItem) {
    result[moduleItem.id] = moduleItem
    return result
  }, {})
}

function getSecondhandCategoryOptions() {
  return SECONDHAND_CATEGORY_DEFS.map(resolveOptionDef)
}

function getLostFoundModeDictionaryOptions() {
  return LOST_FOUND_MODE_DEFS.map(resolveOptionDef)
}

function getLostFoundItemDictionaryOptions() {
  return LOST_FOUND_ITEM_DEFS.map(resolveOptionDef)
}

function getSecretThemeOptions() {
  return SECRET_THEME_DEFS.map(resolveOptionDef)
}

function getSecretTypeOptions() {
  return SECRET_TYPE_DEFS.map(resolveOptionDef)
}

function getExpressGenderOptions() {
  return EXPRESS_GENDER_DEFS.map(resolveOptionDef)
}

function getDeliveryStatusOptions() {
  return DELIVERY_STATUS_DEFS.map(resolveOptionDef)
}

function getDatingAreaOptions() {
  return DATING_AREA_DEFS.map(resolveOptionDef)
}

function getDatingGradeOptions() {
  return DATING_GRADE_DEFS.map(resolveOptionDef)
}

function getPhotographTabOptions() {
  return PHOTOGRAPH_TAB_DEFS.map(resolveOptionDef)
}

function getCommunityModule(moduleId) {
  var moduleMap = getCommunityModuleMap()
  return moduleMap[moduleId] || null
}

function getCommunityPageTitle(moduleId, pageType, fallbackTitle) {
  var moduleTitleKeys = COMMUNITY_PAGE_TITLE_KEYS[moduleId] || {}
  var titleKey = moduleTitleKeys[pageType]

  if (titleKey) {
    return i18n.t(titleKey)
  }

  var moduleMap = getCommunityModuleMap()
  var moduleTitle = fallbackTitle || (moduleMap[moduleId] ? moduleMap[moduleId].title : '')

  if (!moduleTitle) {
    return ''
  }

  switch (pageType) {
    case 'edit':
      return i18n.tReplace('community.pageTitleFallback.edit', { title: moduleTitle })
    case 'publish':
      return i18n.tReplace('community.pageTitleFallback.publish', { title: moduleTitle })
    case 'center':
    case 'detail':
    case 'list':
    default:
      return moduleTitle
  }
}

module.exports = {
  COMMUNITY_MODULE_DEFS,
  COMMUNITY_PAGE_TITLE_KEYS,
  getSecondhandCategoryOptions,
  getLostFoundModeDictionaryOptions,
  getLostFoundItemDictionaryOptions,
  getSecretThemeOptions,
  getSecretTypeOptions,
  getExpressGenderOptions,
  getDeliveryStatusOptions,
  getDatingAreaOptions,
  getDatingGradeOptions,
  getPhotographTabOptions,
  getCommunityModules,
  getCommunityModuleMap,
  DELIVERY_DEFAULT_ORDER_NAME: getDeliveryDefaultOrderName(),
  getDeliveryDefaultOrderName,
  DELIVERY_PLACEHOLDER_PICKUP_CODE,
  getCommunityModule,
  getCommunityPageTitle
}
