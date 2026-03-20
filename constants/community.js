const {
  getMarketplaceItemOptions,
  getLostFoundItemOptions,
  getLostFoundModeOptions
} = require('./profile.js')

const SECONDHAND_CATEGORY_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '校园代步', value: 0 },
  { label: '手机', value: 1 },
  { label: '电脑', value: 2 },
  { label: '数码配件', value: 3 },
  { label: '数码', value: 4 },
  { label: '电器', value: 5 },
  { label: '运动健身', value: 6 },
  { label: '衣物伞帽', value: 7 },
  { label: '图书教材', value: 8 },
  { label: '租赁', value: 9 },
  { label: '生活娱乐', value: 10 },
  { label: '其他', value: 11 }
]

const LOST_FOUND_MODE_OPTIONS = [
  { label: '寻物启事', value: 0 },
  { label: '失物招领', value: 1 }
]

const LOST_FOUND_ITEM_OPTIONS = [
  { label: '手机', value: 0 },
  { label: '校园卡', value: 1 },
  { label: '身份证', value: 2 },
  { label: '银行卡', value: 3 },
  { label: '书', value: 4 },
  { label: '钥匙', value: 5 },
  { label: '包包', value: 6 },
  { label: '衣帽', value: 7 },
  { label: '校园代步', value: 8 },
  { label: '运动健身', value: 9 },
  { label: '数码配件', value: 10 },
  { label: '其他', value: 11 }
]

const SECRET_THEME_OPTIONS = [
  { label: '主题 1', value: 1 },
  { label: '主题 2', value: 2 },
  { label: '主题 3', value: 3 },
  { label: '主题 4', value: 4 },
  { label: '主题 5', value: 5 },
  { label: '主题 6', value: 6 },
  { label: '主题 7', value: 7 },
  { label: '主题 8', value: 8 },
  { label: '主题 9', value: 9 },
  { label: '主题 10', value: 10 },
  { label: '主题 11', value: 11 },
  { label: '主题 12', value: 12 }
]

const SECRET_TYPE_OPTIONS = [
  { label: '文字', value: 0 },
  { label: '语音', value: 1 }
]

const EXPRESS_GENDER_OPTIONS = [
  { label: '男', value: 0 },
  { label: '女', value: 1 },
  { label: '保密', value: 2 }
]

const DELIVERY_STATUS_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '待接单', value: 0 },
  { label: '配送中', value: 1 },
  { label: '已完成', value: 2 }
]

const DATING_AREA_OPTIONS = [
  { label: '小姐姐', value: 0 },
  { label: '小哥哥', value: 1 }
]

const DATING_GRADE_OPTIONS = [
  { label: '大一', value: 1 },
  { label: '大二', value: 2 },
  { label: '大三', value: 3 },
  { label: '大四', value: 4 }
]

const PHOTOGRAPH_TAB_OPTIONS = [
  { label: '生活照', feedValue: 1, publishValue: 1 },
  { label: '校园照', feedValue: 0, publishValue: 2 }
]

const DELIVERY_DEFAULT_ORDER_NAME = '代收'
const DELIVERY_PLACEHOLDER_PICKUP_CODE = '00000000000'

const COMMUNITY_PAGE_TITLES = {
  marketplace: {
    center: '个人中心',
    detail: '商品详情',
    publish: '发布商品',
    edit: '编辑商品'
  },
  lostandfound: {
    center: '个人中心',
    detail: '详情',
    publish: '发布信息',
    edit: '编辑信息'
  },
  secret: {
    center: '我的树洞',
    detail: '匿名详情',
    publish: '发布树洞'
  },
  express: {
    center: '我的',
    detail: '详情',
    publish: '发布表白'
  },
  topic: {
    center: '我的',
    detail: '话题详情',
    publish: '发布话题'
  },
  delivery: {
    center: '我的跑腿',
    detail: '任务详情',
    publish: '发布全民快递'
  },
  dating: {
    center: '互动中心',
    detail: '卖室友',
    publish: '发布资料'
  },
  photograph: {
    center: '我的作品',
    detail: '作品详情',
    publish: '发布作品'
  }
}

const COMMUNITY_MODULES = [
  {
    id: 'marketplace',
    title: '二手交易',
    summary: '浏览和发布校园闲置物品',
    icon: '/image/marketplace.png',
    heroStyle: 'background: linear-gradient(135deg, #e9fff7 0%, #f7fffc 100%);',
    page: '/pages/communityList/communityList?module=marketplace',
    supportsSearch: true,
    searchPlaceholder: '搜索商品名称或关键词',
    centerEnabled: true,
    publishEnabled: true
  },
  {
    id: 'lostandfound',
    title: '失物招领',
    summary: '发布寻物启事和失物招领信息',
    icon: '/image/lostandfound.png',
    heroStyle: 'background: linear-gradient(135deg, #eef6ff 0%, #fafcff 100%);',
    page: '/pages/communityList/communityList?module=lostandfound',
    supportsSearch: true,
    searchPlaceholder: '搜索失物关键词',
    centerEnabled: true,
    publishEnabled: true
  },
  {
    id: 'secret',
    title: '校园树洞',
    summary: '匿名记录心情，分享不想说出口的话',
    icon: '/image/secret.png',
    heroStyle: 'background: linear-gradient(135deg, #fff0f5 0%, #fffafc 100%);',
    page: '/pages/communityList/communityList?module=secret',
    centerEnabled: true,
    publishEnabled: true
  },
  {
    id: 'express',
    title: '表白墙',
    summary: '给心动的人留下一句悄悄话',
    icon: '/image/express.png',
    heroStyle: 'background: linear-gradient(135deg, #fff3ef 0%, #fffaf7 100%);',
    page: '/pages/communityList/communityList?module=express',
    supportsSearch: true,
    searchPlaceholder: '搜索名字或内容',
    centerEnabled: true,
    publishEnabled: true
  },
  {
    id: 'topic',
    title: '校园话题',
    summary: '参与热门讨论，看看同学们在聊什么',
    icon: '/image/topic.png',
    heroStyle: 'background: linear-gradient(135deg, #f1f5ff 0%, #fbfcff 100%);',
    page: '/pages/communityList/communityList?module=topic',
    supportsSearch: true,
    searchPlaceholder: '搜索话题关键词',
    centerEnabled: true,
    publishEnabled: true
  },
  {
    id: 'delivery',
    title: '全民快递',
    summary: '代拿快递与校园跑腿互助',
    icon: '/image/delivery.png',
    heroStyle: 'background: linear-gradient(135deg, #fff5e8 0%, #fffaf3 100%);',
    page: '/pages/communityList/communityList?module=delivery',
    centerEnabled: true,
    publishEnabled: true
  },
  {
    id: 'dating',
    title: '卖室友',
    summary: '查看和发布室友推荐信息',
    icon: '/image/dating.png',
    heroStyle: 'background: linear-gradient(135deg, #fff2f0 0%, #fff9f8 100%);',
    page: '/pages/communityList/communityList?module=dating',
    centerEnabled: true,
    publishEnabled: true
  },
  {
    id: 'photograph',
    title: '拍好校园',
    summary: '分享镜头里的校园瞬间与作品',
    icon: '/image/photograph.png',
    heroStyle: 'background: linear-gradient(135deg, #eefbf5 0%, #fbfffd 100%);',
    page: '/pages/communityList/communityList?module=photograph',
    centerEnabled: true,
    publishEnabled: true
  }
]

const COMMUNITY_MODULE_MAP = COMMUNITY_MODULES.reduce(function(result, moduleItem) {
  result[moduleItem.id] = moduleItem
  return result
}, {})

function getSecondhandCategoryOptions() {
  return [{ label: '全部', value: -1 }].concat(getMarketplaceItemOptions().map(function(option) {
    return {
      label: option.label,
      value: option.code
    }
  }))
}

function getLostFoundModeDictionaryOptions() {
  return getLostFoundModeOptions().map(function(option) {
    return {
      label: option.label,
      value: option.code
    }
  })
}

function getLostFoundItemDictionaryOptions() {
  return getLostFoundItemOptions().map(function(option) {
    return {
      label: option.label,
      value: option.code
    }
  })
}

function getCommunityModule(moduleId) {
  return COMMUNITY_MODULE_MAP[moduleId] || null
}

function getCommunityPageTitle(moduleId, pageType, fallbackTitle) {
  const moduleTitleConfig = COMMUNITY_PAGE_TITLES[moduleId] || {}
  const pageTitle = moduleTitleConfig[pageType]

  if (pageTitle) {
    return pageTitle
  }

  const moduleTitle = fallbackTitle || (COMMUNITY_MODULE_MAP[moduleId] ? COMMUNITY_MODULE_MAP[moduleId].title : '')

  if (!moduleTitle) {
    return ''
  }

  switch (pageType) {
    case 'edit':
      return `编辑${moduleTitle}`
    case 'publish':
      return `发布${moduleTitle}`
    case 'center':
    case 'detail':
    case 'list':
    default:
      return moduleTitle
  }
}

module.exports = {
  COMMUNITY_MODULES,
  COMMUNITY_MODULE_MAP,
  COMMUNITY_PAGE_TITLES,
  SECONDHAND_CATEGORY_OPTIONS,
  LOST_FOUND_MODE_OPTIONS,
  LOST_FOUND_ITEM_OPTIONS,
  getSecondhandCategoryOptions,
  getLostFoundModeDictionaryOptions,
  getLostFoundItemDictionaryOptions,
  SECRET_THEME_OPTIONS,
  SECRET_TYPE_OPTIONS,
  EXPRESS_GENDER_OPTIONS,
  DELIVERY_STATUS_OPTIONS,
  DATING_AREA_OPTIONS,
  DATING_GRADE_OPTIONS,
  PHOTOGRAPH_TAB_OPTIONS,
  DELIVERY_DEFAULT_ORDER_NAME,
  DELIVERY_PLACEHOLDER_PICKUP_CODE,
  getCommunityModule,
  getCommunityPageTitle
}
