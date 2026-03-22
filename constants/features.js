const { getMockCredentialsHint } = require('./mock.js')
const i18n = require('../utils/i18n.js')

const FEATURE_DEFS = [
  {
    id: 'grade',
    titleKey: 'features.grade.title',
    descKey: 'features.grade.desc',
    icon: '/image/mono/grade.png',
    page: '/pages/grade/grade',
    section: 'campus'
  },
  {
    id: 'schedule',
    titleKey: 'features.schedule.title',
    descKey: 'features.schedule.desc',
    icon: '/image/mono/schedule.png',
    page: '/pages/schedule/schedule',
    section: 'campus'
  },
  {
    id: 'cet',
    titleKey: 'features.cet.title',
    descKey: 'features.cet.desc',
    icon: '/image/mono/cet.png',
    page: '/pages/cet/cet',
    section: 'campus'
  },
  {
    id: 'graduateExam',
    titleKey: 'features.graduateExam.title',
    descKey: 'features.graduateExam.desc',
    icon: '/image/mono/graduateExam.png',
    page: '/pages/graduateExam/graduateExam',
    section: 'campus'
  },
  {
    id: 'spare',
    titleKey: 'features.spare.title',
    descKey: 'features.spare.desc',
    icon: '/image/mono/spare.png',
    page: '/pages/spare/spare',
    section: 'campus'
  },
  {
    id: 'bill',
    titleKey: 'features.bill.title',
    descKey: 'features.bill.desc',
    icon: '/image/mono/bill.png',
    page: '/pages/bill/bill',
    section: 'campus'
  },
  {
    id: 'card',
    titleKey: 'features.card.title',
    descKey: 'features.card.desc',
    icon: '/image/mono/card.png',
    page: '/pages/card/card',
    section: 'campus'
  },
  {
    id: 'cardLost',
    titleKey: 'features.cardLost.title',
    descKey: 'features.cardLost.desc',
    icon: '/image/mono/cardLost.png',
    page: '/pages/cardLost/cardLost',
    section: 'campus'
  },
  {
    id: 'evaluate',
    titleKey: 'features.evaluate.title',
    descKey: 'features.evaluate.desc',
    icon: '/image/mono/evaluate.png',
    page: '/pages/evaluate/evaluate',
    section: 'campus'
  },
  {
    id: 'collection',
    titleKey: 'features.collection.title',
    descKey: 'features.collection.desc',
    icon: '/image/mono/collection.png',
    page: '/pages/collection/collection',
    section: 'campus'
  },
  {
    id: 'book',
    titleKey: 'features.book.title',
    descKey: 'features.book.desc',
    icon: '/image/mono/book.png',
    page: '/pages/book/book',
    section: 'campus'
  },
  {
    id: 'data',
    titleKey: 'features.data.title',
    descKey: 'features.data.desc',
    icon: '/image/mono/data.png',
    page: '/pages/data/data',
    section: 'campus'
  },
  {
    id: 'news',
    titleKey: 'features.news.title',
    descKey: 'features.news.desc',
    icon: '/image/mono/news.png',
    page: '/pages/news/news',
    section: 'information'
  },
  {
    id: 'marketplace',
    titleKey: 'features.marketplace.title',
    descKey: 'features.marketplace.desc',
    icon: '/image/mono/marketplace.png',
    page: '/pages/communityList/communityList?module=marketplace',
    section: 'community'
  },
  {
    id: 'lostandfound',
    titleKey: 'features.lostandfound.title',
    descKey: 'features.lostandfound.desc',
    icon: '/image/mono/lostandfound.png',
    page: '/pages/communityList/communityList?module=lostandfound',
    section: 'community'
  },
  {
    id: 'secret',
    titleKey: 'features.secret.title',
    descKey: 'features.secret.desc',
    icon: '/image/mono/secret.png',
    page: '/pages/communityList/communityList?module=secret',
    section: 'community'
  },
  {
    id: 'express',
    titleKey: 'features.express.title',
    descKey: 'features.express.desc',
    icon: '/image/mono/express.png',
    page: '/pages/communityList/communityList?module=express',
    section: 'community'
  },
  {
    id: 'topic',
    titleKey: 'features.topic.title',
    descKey: 'features.topic.desc',
    icon: '/image/mono/topic.png',
    page: '/pages/communityList/communityList?module=topic',
    section: 'community'
  },
  {
    id: 'delivery',
    titleKey: 'features.delivery.title',
    descKey: 'features.delivery.desc',
    icon: '/image/mono/delivery.png',
    page: '/pages/communityList/communityList?module=delivery',
    section: 'community'
  },
  {
    id: 'dating',
    titleKey: 'features.dating.title',
    descKey: 'features.dating.desc',
    icon: '/image/mono/dating.png',
    page: '/pages/communityList/communityList?module=dating',
    section: 'community'
  },
  {
    id: 'photograph',
    titleKey: 'features.photograph.title',
    descKey: 'features.photograph.desc',
    icon: '/image/mono/photograph.png',
    page: '/pages/communityList/communityList?module=photograph',
    section: 'community'
  }
]

const SECTION_DEFS = [
  {
    id: 'campus',
    titleKey: 'features.sections.campus',
    featureIds: [
      'grade',
      'schedule',
      'cet',
      'graduateExam',
      'spare',
      'card',
      'evaluate',
      'collection',
      'data'
    ]
  },
  {
    id: 'information',
    titleKey: 'features.sections.information',
    featureIds: [
      'news'
    ]
  },
  {
    id: 'community',
    titleKey: 'features.sections.community',
    featureIds: [
      'marketplace',
      'lostandfound',
      'secret',
      'express',
      'topic',
      'delivery',
      'dating',
      'photograph'
    ]
  }
]

const SYSTEM_ACTION_DEFS = [
  {
    id: 'appearance',
    titleKey: 'features.actions.appearance.title',
    descKey: 'features.actions.appearance.desc',
    icon: '/image/mono/about.png',
    page: '/pages/appearance/appearance'
  },
  {
    id: 'settings',
    titleKey: 'features.actions.settings.title',
    descKey: 'features.actions.settings.desc',
    icon: '/image/mono/about.png',
    page: '/pages/settings/settings'
  },
  {
    id: 'logout',
    titleKey: 'features.actions.logout.title',
    descKey: 'features.actions.logout.desc',
    icon: '/image/mono/exit.png',
    action: 'logout'
  }
]

function resolveFeature(def) {
  return {
    id: def.id,
    title: i18n.t(def.titleKey),
    description: i18n.t(def.descKey),
    icon: def.icon,
    page: def.page,
    section: def.section
  }
}

function getFeatureList() {
  return FEATURE_DEFS.map(resolveFeature)
}

function getFeatureMap() {
  return getFeatureList().reduce(function(map, feature) {
    map[feature.id] = feature
    return map
  }, {})
}

function getFeatureSections() {
  return SECTION_DEFS.map(function(section) {
    return {
      id: section.id,
      title: i18n.t(section.titleKey),
      featureIds: section.featureIds
    }
  })
}

function getSystemActions() {
  return SYSTEM_ACTION_DEFS.map(function(def) {
    var result = {
      id: def.id,
      title: i18n.t(def.titleKey),
      description: i18n.t(def.descKey),
      icon: def.icon
    }
    if (def.page) result.page = def.page
    if (def.action) result.action = def.action
    return result
  })
}

function getDefaultFeatureVisibility() {
  return FEATURE_DEFS.reduce(function(result, def) {
    result[def.id] = true
    return result
  }, {})
}

module.exports = {
  FEATURE_DEFS,
  SECTION_DEFS,
  getFeatureList,
  getFeatureMap,
  getFeatureSections,
  getSystemActions,
  getMockCredentialsHint,
  getDefaultFeatureVisibility
}
