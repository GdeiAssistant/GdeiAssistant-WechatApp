const { MOCK_CREDENTIALS_HINT } = require('./mock.js')

const FEATURE_LIST = [
  {
    id: 'grade',
    title: '成绩查询',
    description: '查看学年成绩与学期成绩',
    icon: '/image/mono/grade.png',
    page: '/pages/grade/grade',
    section: 'campus'
  },
  {
    id: 'schedule',
    title: '课表查询',
    description: '查看每周课表安排',
    icon: '/image/mono/schedule.png',
    page: '/pages/schedule/schedule',
    section: 'campus'
  },
  {
    id: 'cet',
    title: '四六级查询',
    description: '查询四六级成绩并保存考号',
    icon: '/image/mono/cet.png',
    page: '/pages/cet/cet',
    section: 'campus'
  },
  {
    id: 'kaoyan',
    title: '考研查询',
    description: '查询研究生成绩',
    icon: '/image/mono/kaoyan.png',
    page: '/pages/kaoyan/kaoyan',
    section: 'campus'
  },
  {
    id: 'spare',
    title: '教室查询',
    description: '查询当前空闲教室',
    icon: '/image/mono/spare.png',
    page: '/pages/spare/spare',
    section: 'campus'
  },
  {
    id: 'bill',
    title: '校园卡消费',
    description: '查看校园卡消费记录',
    icon: '/image/mono/bill.png',
    page: '/pages/bill/bill',
    section: 'campus'
  },
  {
    id: 'card',
    title: '校园卡',
    description: '查看校园卡信息与余额',
    icon: '/image/mono/card.png',
    page: '/pages/card/card',
    section: 'campus'
  },
  {
    id: 'cardLost',
    title: '校园卡挂失',
    description: '挂失校园卡',
    icon: '/image/mono/cardLost.png',
    page: '/pages/cardLost/cardLost',
    section: 'campus'
  },
  {
    id: 'evaluate',
    title: '教学评价',
    description: '一键完成教学评价',
    icon: '/image/mono/evaluate.png',
    page: '/pages/evaluate/evaluate',
    section: 'campus'
  },
  {
    id: 'collection',
    title: '图书馆',
    description: '检索馆藏并进入借阅与续借',
    icon: '/image/mono/collection.png',
    page: '/pages/collection/collection',
    section: 'campus'
  },
  {
    id: 'book',
    title: '我的借阅',
    description: '查看个人借阅记录并续借',
    icon: '/image/mono/book.png',
    page: '/pages/book/book',
    section: 'campus'
  },
  {
    id: 'data',
    title: '校园数据',
    description: '电费与黄页信息查询',
    icon: '/image/mono/data.png',
    page: '/pages/data/data',
    section: 'campus'
  },
  {
    id: 'news',
    title: '信息中心',
    description: '查看校园新闻、系统公告与互动消息',
    icon: '/image/mono/news.png',
    page: '/pages/news/news',
    section: 'information'
  },
  {
    id: 'ershou',
    title: '二手交易',
    description: '浏览与发布校园闲置',
    icon: '/image/mono/ershou.png',
    page: '/pages/communityList/communityList?module=ershou',
    section: 'community'
  },
  {
    id: 'lostandfound',
    title: '失物招领',
    description: '发布寻物与招领信息',
    icon: '/image/mono/lostandfound.png',
    page: '/pages/communityList/communityList?module=lostandfound',
    section: 'community'
  },
  {
    id: 'secret',
    title: '校园树洞',
    description: '匿名说说心里话',
    icon: '/image/mono/secret.png',
    page: '/pages/communityList/communityList?module=secret',
    section: 'community'
  },
  {
    id: 'express',
    title: '表白墙',
    description: '查看与发布校园表白',
    icon: '/image/mono/express.png',
    page: '/pages/communityList/communityList?module=express',
    section: 'community'
  },
  {
    id: 'topic',
    title: '校园话题',
    description: '参与热门校园讨论',
    icon: '/image/mono/topic.png',
    page: '/pages/communityList/communityList?module=topic',
    section: 'community'
  },
  {
    id: 'delivery',
    title: '全民快递',
    description: '发布与接取校园跑腿',
    icon: '/image/mono/delivery.png',
    page: '/pages/communityList/communityList?module=delivery',
    section: 'community'
  },
  {
    id: 'dating',
    title: '卖室友',
    description: '浏览资料、发布内容并处理互动',
    icon: '/image/mono/dating.png',
    page: '/pages/communityList/communityList?module=dating',
    section: 'community'
  },
  {
    id: 'photograph',
    title: '拍好校园',
    description: '查看与分享校园摄影',
    icon: '/image/mono/photograph.png',
    page: '/pages/communityList/communityList?module=photograph',
    section: 'community'
  }
]

const FEATURE_SECTIONS = [
  {
    id: 'campus',
    title: '校园服务',
    featureIds: [
      'grade',
      'schedule',
      'cet',
      'kaoyan',
      'spare',
      'card',
      'evaluate',
      'collection',
      'data'
    ]
  },
  {
    id: 'information',
    title: '信息中心',
    featureIds: [
      'news'
    ]
  },
  {
    id: 'community',
    title: '校园社区',
    featureIds: [
      'ershou',
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

const SYSTEM_ACTIONS = [
  {
    id: 'settings',
    title: '功能设置',
    description: '切换 mock 与管理首页模块',
    icon: '/image/mono/about.png',
    page: '/pages/settings/settings'
  },
  {
    id: 'logout',
    title: '退出账号',
    description: '退出当前账号',
    icon: '/image/mono/exit.png',
    action: 'logout'
  }
]

const FEATURE_MAP = FEATURE_LIST.reduce(function(map, feature) {
  map[feature.id] = feature
  return map
}, {})

function getDefaultFeatureVisibility() {
  return FEATURE_LIST.reduce(function(result, feature) {
    result[feature.id] = true
    return result
  }, {})
}

module.exports = {
  FEATURE_LIST,
  FEATURE_MAP,
  FEATURE_SECTIONS,
  SYSTEM_ACTIONS,
  MOCK_CREDENTIALS_HINT,
  getDefaultFeatureVisibility
}
