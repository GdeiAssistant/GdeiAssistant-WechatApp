const storageKeys = require('../constants/storage.js')
const { MOCK_ACCOUNT_USERNAME, MOCK_ACCOUNT_PASSWORD } = require('../constants/mock.js')
const { FACULTY_OPTIONS, getMajorOptions, formatLocationDisplay } = require('../constants/profile.js')
const LOCATION_REGIONS = require('../constants/location-regions.js')
const communityMock = require('./community.js')

const MOCK_ACCOUNT = {
  username: MOCK_ACCOUNT_USERNAME,
  password: MOCK_ACCOUNT_PASSWORD
}

const BASE_PROFILE = {
  username: 'gdeiassistant',
  nickname: '林知远',
  avatar: '',
  birthday: '2004-09-16',
  faculty: '计算机科学系',
  major: '软件工程',
  enrollment: '2023',
  location: formatLocationDisplay('中国', '广东', '广州'),
  locationRegion: 'CN',
  locationState: '44',
  locationCity: '1',
  hometown: formatLocationDisplay('中国', '广东', '汕头'),
  hometownRegion: 'CN',
  hometownState: '44',
  hometownCity: '5',
  introduction: '喜欢做实用的小工具，也在准备移动端开发实习。',
  ipArea: '广东'
}

const GRADE_REPORTS = [
  {
    year: 0,
    firstTermGradeList: [
      { gradeName: '高等数学', gradeScore: '92' },
      { gradeName: '程序设计基础', gradeScore: '95' },
      { gradeName: '大学英语', gradeScore: '88' }
    ],
    secondTermGradeList: [
      { gradeName: '数据结构', gradeScore: '94' },
      { gradeName: '离散数学', gradeScore: '90' },
      { gradeName: '大学物理', gradeScore: '85' }
    ]
  },
  {
    year: 1,
    firstTermGradeList: [
      { gradeName: '数据库系统概论', gradeScore: '93' },
      { gradeName: '操作系统', gradeScore: '89' },
      { gradeName: '计算机网络', gradeScore: '91' }
    ],
    secondTermGradeList: [
      { gradeName: '软件工程', gradeScore: '95' },
      { gradeName: '编译原理', gradeScore: '86' },
      { gradeName: '概率论与数理统计', gradeScore: '87' }
    ]
  },
  {
    year: 2,
    firstTermGradeList: [
      { gradeName: 'iOS 移动开发', gradeScore: '97' },
      { gradeName: '前端工程化', gradeScore: '92' },
      { gradeName: '计算机图形学', gradeScore: '85' }
    ],
    secondTermGradeList: [
      { gradeName: '软件测试', gradeScore: '91' },
      { gradeName: '项目管理', gradeScore: '90' },
      { gradeName: '人工智能导论', gradeScore: '89' }
    ]
  },
  {
    year: 3,
    firstTermGradeList: [
      { gradeName: '毕业实习', gradeScore: '优' },
      { gradeName: '创新创业实践', gradeScore: '良' }
    ],
    secondTermGradeList: [
      { gradeName: '毕业设计', gradeScore: '进行中' }
    ]
  }
]

const SCHEDULE_TEMPLATE = [
  {
    column: 0,
    scheduleLesson: '第 1-2 节',
    scheduleName: '移动应用开发',
    minScheduleWeek: 1,
    maxScheduleWeek: 16,
    scheduleTeacher: '陈老师',
    scheduleLocation: '教学楼 A201'
  },
  {
    column: 1,
    scheduleLesson: '第 3-4 节',
    scheduleName: '软件测试',
    minScheduleWeek: 1,
    maxScheduleWeek: 16,
    scheduleTeacher: '张老师',
    scheduleLocation: '教学楼 C402'
  },
  {
    column: 2,
    scheduleLesson: '第 1-2 节',
    scheduleName: '数据库原理',
    minScheduleWeek: 1,
    maxScheduleWeek: 16,
    scheduleTeacher: '李老师',
    scheduleLocation: '教学楼 B305'
  },
  {
    column: 3,
    scheduleLesson: '第 5-6 节',
    scheduleName: '编译原理',
    minScheduleWeek: 1,
    maxScheduleWeek: 16,
    scheduleTeacher: '王老师',
    scheduleLocation: '教学楼 B402'
  },
  {
    column: 4,
    scheduleLesson: '第 1-2 节',
    scheduleName: '计算机网络',
    minScheduleWeek: 1,
    maxScheduleWeek: 16,
    scheduleTeacher: '周老师',
    scheduleLocation: '教学楼 D202'
  },
  {
    column: 4,
    scheduleLesson: '第 7-8 节',
    scheduleName: '就业指导',
    minScheduleWeek: 1,
    maxScheduleWeek: 16,
    scheduleTeacher: '辅导员',
    scheduleLocation: '教学楼 A101'
  }
]

const CARD_TRANSACTIONS = [
  { merchantName: '第一食堂', tradeName: '消费', tradePrice: '-13.50', tradeTime: '2026-03-15 12:16:20' },
  { merchantName: '第三食堂', tradeName: '消费', tradePrice: '-11.00', tradeTime: '2026-03-15 07:42:11' },
  { merchantName: '校园卡服务中心', tradeName: '充值', tradePrice: '100.00', tradeTime: '2026-03-14 18:03:51' },
  { merchantName: '超市', tradeName: '消费', tradePrice: '-26.80', tradeTime: '2026-03-14 16:35:07' }
]

const COLLECTION_ITEMS = [
  {
    bookname: 'SwiftUI 界面开发实践',
    author: '李明',
    publishingHouse: '人民邮电出版社',
    detailURL: 'detail_swiftui'
  },
  {
    bookname: '操作系统概念',
    author: 'Abraham Silberschatz',
    publishingHouse: '机械工业出版社',
    detailURL: 'detail_os'
  },
  {
    bookname: '大学英语六级真题精讲',
    author: '刘洋',
    publishingHouse: '外语教学出版社',
    detailURL: 'detail_cet'
  },
  {
    bookname: '研究生入学考试数学复习全书',
    author: '张宇',
    publishingHouse: '高等教育出版社',
    detailURL: 'detail_kaoyan'
  }
]

const COLLECTION_DETAILS = {
  detail_swiftui: {
    bookname: 'SwiftUI 界面开发实践',
    author: '李明',
    principal: 'SwiftUI 界面开发实践 李明',
    publishingHouse: '人民邮电出版社 2025',
    price: '9787115600001 68.00',
    physicalDescriptionArea: '16 开，附录含实验案例与索引',
    personalPrincipal: '李明',
    subjectTheme: '移动开发 / 界面设计',
    chineseLibraryClassification: 'TP312.8',
    collectionDistributionList: [
      { location: '北校区图书馆 3 楼 A 区', callNumber: 'TP312.8/S12', barcode: 'B1002381', state: '在馆' },
      { location: '南校区图书馆 2 楼借阅区', callNumber: 'TP312.8/S12', barcode: 'B1002382', state: '可借' }
    ]
  },
  detail_os: {
    bookname: '操作系统概念',
    author: 'Abraham Silberschatz',
    principal: '操作系统概念 Abraham Silberschatz',
    publishingHouse: '机械工业出版社 2024',
    price: '9787111700002 99.00',
    physicalDescriptionArea: '精装，配套习题集',
    personalPrincipal: 'Abraham Silberschatz',
    subjectTheme: '操作系统',
    chineseLibraryClassification: 'TP316',
    collectionDistributionList: [
      { location: '图书馆 4 楼计算机专区', callNumber: 'TP316/O11', barcode: 'B2003291', state: '在馆' }
    ]
  },
  detail_cet: {
    bookname: '大学英语六级真题精讲',
    author: '刘洋',
    principal: '大学英语六级真题精讲 刘洋',
    publishingHouse: '外语教学出版社 2026',
    price: '9787567899999 49.80',
    physicalDescriptionArea: '附赠音频资料',
    personalPrincipal: '刘洋',
    subjectTheme: '英语六级',
    chineseLibraryClassification: 'H319.6',
    collectionDistributionList: [
      { location: '图书馆 2 楼外语专区', callNumber: 'H319.6/L25', barcode: 'B5200081', state: '可借' }
    ]
  },
  detail_kaoyan: {
    bookname: '研究生入学考试数学复习全书',
    author: '张宇',
    principal: '研究生入学考试数学复习全书 张宇',
    publishingHouse: '高等教育出版社 2026',
    price: '9787040654321 59.00',
    physicalDescriptionArea: '附章节练习与答案',
    personalPrincipal: '张宇',
    subjectTheme: '考研数学',
    chineseLibraryClassification: 'O13',
    collectionDistributionList: [
      { location: '图书馆 1 楼考试专区', callNumber: 'O13/Z11', barcode: 'B8801022', state: '在馆' }
    ]
  }
}

const DEFAULT_BORROWED_BOOKS = [
  {
    name: 'iOS 架构设计实践',
    id: 'B0001001',
    sn: 'sn_1001',
    code: 'code_1001',
    author: '王磊',
    borrowDate: '2026-03-01',
    returnDate: '2026-03-22',
    renewTime: 0
  },
  {
    name: '数据库系统概论',
    id: 'B0001002',
    sn: 'sn_1002',
    code: 'code_1002',
    author: '陈小华',
    borrowDate: '2026-02-24',
    returnDate: '2026-03-17',
    renewTime: 1
  }
]

const NEWS_BY_TYPE = {
  1: [
    { id: 'news_1_1', title: '下周《移动应用开发》实验课教室调整', publishDate: '2026-03-08', content: '实验课将调整到教学楼 B402，请同学们提前查看课表通知。' },
    { id: 'news_1_2', title: '春季学期专业选修课补退选开放通知', publishDate: '2026-03-06', content: '补退选时间为 3 月 10 日 9:00 至 3 月 12 日 17:00。' }
  ],
  2: [
    { id: 'news_2_1', title: '大学英语六级模拟考试安排发布', publishDate: '2026-03-07', content: '模拟考试将于本周六上午 9 点进行，地点见准考证。' },
    { id: 'news_2_2', title: '计算机等级考试报名信息说明', publishDate: '2026-03-04', content: '报名通道已开启，请在规定时间内完成缴费。' }
  ],
  3: [
    { id: 'news_3_1', title: '教务系统维护公告', publishDate: '2026-03-05', content: '教务系统将于周末凌晨维护，请提前保存选课和成绩查询信息。' },
    { id: 'news_3_2', title: '课程成绩复核流程更新', publishDate: '2026-03-02', content: '如需申请成绩复核，请按学院要求提交纸质材料。' }
  ],
  4: [
    { id: 'news_4_1', title: '宿舍区热水系统例行检修', publishDate: '2026-03-03', content: '北区宿舍热水系统将于明晚分时段检修，请提前安排洗漱时间。' },
    { id: 'news_4_2', title: '图书馆临时闭馆维护通知', publishDate: '2026-03-01', content: '因设备维护，图书馆将于周日 8:00-12:00 暂停开放。' }
  ],
  5: [
    { id: 'news_5_1', title: '春季校园招聘双选会报名开启', publishDate: '2026-03-05', content: '双选会将于体育馆举行，报名截止至周四中午。' },
    { id: 'news_5_2', title: '体育馆临时借用安排更新', publishDate: '2026-03-04', content: '本周末体育馆将优先保障校级活动，部分场地借用时间已调整。' }
  ]
}

const READING_LIST = [
  { id: 'reading_1', title: '春招简历如何写出项目亮点', description: '结合校园项目和实习经历，整理出适合开发岗的简历表达方式。', link: 'https://example.com/reading/resume', createTime: '2026-03-08' },
  { id: 'reading_2', title: '图书馆高效自习方法整理', description: '从番茄钟、资料归档到错题复盘，建立稳定的学习节奏。', link: 'https://example.com/reading/library', createTime: '2026-03-06' },
  { id: 'reading_3', title: '四六级冲刺阶段的听力复习建议', description: '最后两周如何提高正确率，并避免时间分配失衡。', link: 'https://example.com/reading/cet', createTime: '2026-03-04' }
]

const ANNOUNCEMENT_LIST = [
  {
    id: 'announcement_001',
    title: '系统维护通知',
    publishTime: '1小时前',
    content: '为配合学期中服务器扩容，本周三 18:00 至 20:00 将进行例行维护。维护期间消息中心、校园社区和部分查询服务可能出现短暂不可用，建议提前保存正在编辑的内容。'
  },
  {
    id: 'announcement_002',
    title: '春季双选会入场安排',
    publishTime: '今天 09:10',
    content: '春季校园双选会将于本周五 14:30 在体育馆举行。请已报名同学提前准备校园卡，按学院分批入场，现场会同步开放企业岗位二维码与志愿者咨询台。'
  },
  {
    id: 'announcement_003',
    title: '图书馆夜间开放时段调整',
    publishTime: '昨天',
    content: '从下周起，图书馆一楼自习区开放时间延长至 23:00，二楼研讨室仍需预约。若遇到插座、座位预约或入馆设备异常，可直接在资讯页提交反馈。'
  },
  {
    id: 'announcement_004',
    title: '校医院门诊排班更新',
    publishTime: '昨天 18:40',
    content: '校医院本周起调整晚间门诊排班，工作日 18:30 后优先接待急诊与发热相关问诊，普通门诊请尽量在白天时段前往。'
  },
  {
    id: 'announcement_005',
    title: '宿舍门禁系统升级提醒',
    publishTime: '前天',
    content: '北区与中区宿舍门禁将于本周末夜间分批升级，升级期间刷卡开门可能存在短暂延迟，请提前留意楼栋群通知。'
  },
  {
    id: 'announcement_006',
    title: '就业指导中心咨询时段开放',
    publishTime: '2026-03-01',
    content: '就业指导中心新增春招一对一简历咨询时段，已开放线上预约。需要模拟面试或简历修改的同学可在工作日预约。'
  }
]

const INTERACTION_MESSAGES = [
  {
    id: 'msg_interaction_001',
    module: 'dating',
    type: 'interaction',
    targetType: 'sent',
    targetId: '802',
    targetSubId: '701',
    title: '卖室友互动',
    content: '你发出的卖室友申请已被对方查看，去看看最新状态。',
    createdAt: '刚刚',
    isRead: false
  },
  {
    id: 'msg_interaction_002',
    module: 'delivery',
    type: 'interaction',
    targetType: 'published',
    targetId: '601',
    targetSubId: '9001',
    title: '全民快递提醒',
    content: '你发布的订单已被接单，建议尽快和接单同学确认送达时间。',
    createdAt: '6分钟前',
    isRead: false
  },
  {
    id: 'msg_interaction_003',
    module: 'delivery',
    type: 'interaction',
    targetType: 'accepted',
    targetId: '602',
    targetSubId: '9001',
    title: '全民快递提醒',
    content: '你接的订单已完成，系统已同步为已完成状态。',
    createdAt: '12分钟前',
    isRead: false
  },
  {
    id: 'msg_interaction_004',
    module: 'secret',
    type: 'comment',
    targetType: 'comment',
    targetId: '301',
    targetSubId: '1',
    title: '树洞互动',
    content: '有人回复了你的树洞，打开详情即可查看最新评论。',
    createdAt: '10分钟前',
    isRead: false
  },
  {
    id: 'msg_interaction_005',
    module: 'express',
    type: 'comment',
    targetType: 'comment',
    targetId: '401',
    targetSubId: '1',
    title: '表白墙互动',
    content: '有人给你的表白留了言，打开详情即可查看最新评论。',
    createdAt: '14分钟前',
    isRead: false
  },
  {
    id: 'msg_interaction_006',
    module: 'express',
    type: 'interaction',
    targetType: 'guess',
    targetId: '401',
    targetSubId: '',
    title: '表白墙互动',
    content: '有人参与了你的猜名字互动，去看看最新猜测次数。',
    createdAt: '18分钟前',
    isRead: true
  },
  {
    id: 'msg_interaction_007',
    module: 'topic',
    type: 'like',
    targetType: 'like',
    targetId: '501',
    targetSubId: '',
    title: '话题互动',
    content: '你的话题收到了新的点赞。',
    createdAt: '25分钟前',
    isRead: true
  },
  {
    id: 'msg_interaction_008',
    module: 'photograph',
    type: 'comment',
    targetType: 'comment',
    targetId: '901',
    targetSubId: '1',
    title: '拍好校园互动',
    content: '有人评论了你的作品，打开详情即可查看最新评论。',
    createdAt: '40分钟前',
    isRead: false
  }
]

const YELLOW_PAGE_RESULT = {
  type: [
    { typeCode: 1, typeName: '教务服务' },
    { typeCode: 2, typeName: '后勤服务' },
    { typeCode: 3, typeName: '学生服务' },
    { typeCode: 4, typeName: '图书与网络' }
  ],
  data: [
    { typeCode: 1, section: '教务处值班室', majorPhone: '020-12345678', minorPhone: '', address: '行政楼 302', email: 'jwc@gdei.edu.cn', website: 'https://www.gdei.edu.cn/jwc' },
    { typeCode: 1, section: '考务办公室', majorPhone: '020-12345680', minorPhone: '020-12345681', address: '行政楼 306', email: 'exam@gdei.edu.cn', website: '' },
    { typeCode: 2, section: '宿舍报修', majorPhone: '020-87654321', minorPhone: '', address: '后勤楼 1 楼', email: 'repair@gdei.edu.cn', website: '' },
    { typeCode: 2, section: '校园保卫处', majorPhone: '020-87654323', minorPhone: '020-87654324', address: '保卫处值班室', email: '', website: '' },
    { typeCode: 3, section: '学生工作部', majorPhone: '020-66554411', minorPhone: '', address: '行政楼 201', email: 'xgb@gdei.edu.cn', website: '' },
    { typeCode: 3, section: '就业指导中心', majorPhone: '020-66554413', minorPhone: '', address: '创新创业楼', email: 'job@gdei.edu.cn', website: 'https://job.gdei.edu.cn' },
    { typeCode: 4, section: '图书馆总服务台', majorPhone: '020-99887711', minorPhone: '', address: '图书馆 1 楼', email: 'library@gdei.edu.cn', website: 'https://lib.gdei.edu.cn' },
    { typeCode: 4, section: '网络信息中心', majorPhone: '020-99887712', minorPhone: '020-99887713', address: '信息楼 402', email: 'nic@gdei.edu.cn', website: 'https://nic.gdei.edu.cn' }
  ]
}

const SPARE_ROOMS = [
  { number: 'A201', name: '教学楼 A201', type: '多媒体课室', zone: '海珠校区', classSeating: '120', section: '第 1-2 节', examSeating: '96' },
  { number: 'B305', name: '教学楼 B305', type: '普通课室', zone: '海珠校区', classSeating: '80', section: '第 1-2 节', examSeating: '64' },
  { number: 'E402', name: '实验楼 E402', type: '机房', zone: '海珠校区', classSeating: '60', section: '第 1-2 节', examSeating: '48' }
]

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value))
}

function getLocationNodeName(node) {
  if (!node || typeof node !== 'object') {
    return ''
  }

  return String(node.aliasesName || node.name || '').trim()
}

function buildLocationDisplay(region, state, city) {
  return formatLocationDisplay(
    getLocationNodeName(region),
    getLocationNodeName(state),
    getLocationNodeName(city)
  )
}

function readState() {
  const defaultState = {
    token: '',
    savedCetNumber: '',
    savedCetName: '',
    cardLostState: '正常',
    renewedBookCodes: [],
    profile: cloneValue(BASE_PROFILE),
    interactionMessages: cloneValue(INTERACTION_MESSAGES)
  }

  try {
    const state = wx.getStorageSync(storageKeys.mockState)
    if (state && typeof state === 'object') {
      return {
        token: state.token || '',
        savedCetNumber: state.savedCetNumber || '',
        savedCetName: state.savedCetName || '',
        cardLostState: state.cardLostState || '正常',
        renewedBookCodes: Array.isArray(state.renewedBookCodes) ? state.renewedBookCodes : [],
        profile: Object.assign({}, cloneValue(BASE_PROFILE), state.profile || {}),
        interactionMessages: Array.isArray(state.interactionMessages) ? state.interactionMessages : cloneValue(INTERACTION_MESSAGES)
      }
    }
  } catch (error) {
    // Ignore mock storage read failures.
  }

  return defaultState
}

function writeState(nextState) {
  try {
    wx.setStorageSync(storageKeys.mockState, nextState)
  } catch (error) {
    // Ignore mock storage write failures.
  }
}

function buildSuccess(data, message) {
  return {
    success: true,
    code: 200,
    message: message || 'success',
    data: data === undefined ? null : data
  }
}

function rejectWithMessage(message, options) {
  const error = new Error(message)
  error.message = message
  error.statusCode = options && options.statusCode ? options.statusCode : 400
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      reject(error)
    }, 180)
  })
}

function resolveWithDelay(payload) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(cloneValue(payload))
    }, 180)
  })
}

function parseQueryString(queryString) {
  if (!queryString) {
    return {}
  }

  return queryString.split('&').reduce(function(result, item) {
    if (!item) {
      return result
    }

    const segments = item.split('=')
    const key = decodeURIComponent(segments[0] || '')
    const value = decodeURIComponent(segments.slice(1).join('=') || '')
    if (result[key] === undefined) {
      result[key] = value
    } else if (Array.isArray(result[key])) {
      result[key].push(value)
    } else {
      result[key] = [result[key], value]
    }
    return result
  }, {})
}

function parseRequestParts(rawUrl, requestData) {
  const normalizedUrl = (rawUrl || '').replace(/^https?:\/\/[^/]+/, '')
  const urlParts = normalizedUrl.split('?')
  const parsedBody = typeof requestData === 'string'
    ? parseQueryString(requestData)
    : requestData
  return {
    path: urlParts[0],
    query: Object.assign({}, parseQueryString(urlParts[1]), parsedBody || {})
  }
}

function isSessionTokenValid(token) {
  const state = readState()
  return !!token && token === state.token
}

function ensureAuthorized(token) {
  if (!isSessionTokenValid(token)) {
    return rejectWithMessage('登录凭证已过期，请重新登录', { statusCode: 401 })
  }

  return null
}

function buildBorrowedBooks(state) {
  return DEFAULT_BORROWED_BOOKS.map(function(item) {
    const renewedTimes = state.renewedBookCodes.indexOf(item.code) !== -1 ? item.renewTime + 1 : item.renewTime
    return Object.assign({}, item, {
      renewTime: renewedTimes,
      returnDate: state.renewedBookCodes.indexOf(item.code) !== -1 ? '2026-04-05' : item.returnDate
    })
  })
}

function queryCollectionList(keyword) {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase()
  if (!normalizedKeyword) {
    return COLLECTION_ITEMS
  }

  return COLLECTION_ITEMS.filter(function(item) {
    return item.bookname.toLowerCase().indexOf(normalizedKeyword) !== -1 ||
      item.author.toLowerCase().indexOf(normalizedKeyword) !== -1
  })
}

function findLocationNodeByCodes(regionCode, stateCode, cityCode) {
  const region = LOCATION_REGIONS.filter(function(item) {
    return item.code === regionCode
  })[0]
  if (!region) {
    return null
  }

  const states = Array.isArray(region.states) ? region.states : []
  const state = states.filter(function(item) {
    return item.code === stateCode
  })[0] || states[0] || null
  if (!state && states.length) {
    return null
  }

  const cities = state && Array.isArray(state.cities) ? state.cities : []
  const city = cities.filter(function(item) {
    return item.code === cityCode
  })[0] || cities[0] || null
  if (!city && cities.length) {
    return null
  }

  return {
    region: region,
    state: state,
    city: city
  }
}

function applyProfileUpdate(token, updater) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const nextState = readState()
  updater(nextState.profile)
  writeState(nextState)
  return resolveWithDelay(buildSuccess(Object.assign({}, nextState.profile)))
}

function handleLocationList(token) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  return resolveWithDelay(buildSuccess(cloneValue(LOCATION_REGIONS)))
}

function handleNicknameUpdate(token, payload) {
  const nickname = String(payload.nickname || '').trim()
  return applyProfileUpdate(token, function(profile) {
    profile.nickname = nickname
  })
}

function handleIntroductionUpdate(token, payload) {
  return applyProfileUpdate(token, function(profile) {
    profile.introduction = String(payload.introduction || '').trim()
  })
}

function handleBirthdayUpdate(token, payload) {
  const year = Number(payload.year)
  const month = Number(payload.month)
  const date = Number(payload.date)

  return applyProfileUpdate(token, function(profile) {
    if (!year || !month || !date) {
      profile.birthday = ''
      return
    }

    profile.birthday = [
      String(year),
      String(month).padStart(2, '0'),
      String(date).padStart(2, '0')
    ].join('-')
  })
}

function handleFacultyUpdate(token, payload) {
  const facultyIndex = Number(payload.faculty)
  const faculty = FACULTY_OPTIONS[facultyIndex] || FACULTY_OPTIONS[0]

  return applyProfileUpdate(token, function(profile) {
    profile.faculty = faculty
    if (getMajorOptions(faculty).indexOf(profile.major) === -1) {
      profile.major = '未选择'
    }
  })
}

function handleMajorUpdate(token, payload) {
  const major = String(payload.major || '').trim()

  return applyProfileUpdate(token, function(profile) {
    const majorOptions = getMajorOptions(profile.faculty)
    profile.major = majorOptions.indexOf(major) !== -1 ? major : '未选择'
  })
}

function handleEnrollmentUpdate(token, payload) {
  const year = payload.year === null || payload.year === undefined || payload.year === '' ? '' : String(payload.year)

  return applyProfileUpdate(token, function(profile) {
    profile.enrollment = year
  })
}

function handleLocationUpdate(token, payload, type) {
  const regionCode = String(payload.region || '').trim()
  const stateCode = String(payload.state || '').trim()
  const cityCode = String(payload.city || '').trim()
  const locationNode = findLocationNodeByCodes(regionCode, stateCode, cityCode)

  if (!locationNode) {
    return rejectWithMessage('未找到对应的地区信息')
  }

  return applyProfileUpdate(token, function(profile) {
    const displayText = buildLocationDisplay(locationNode.region, locationNode.state, locationNode.city)
    if (type === 'hometown') {
      profile.hometownRegion = locationNode.region.code
      profile.hometownState = locationNode.state ? locationNode.state.code : ''
      profile.hometownCity = locationNode.city ? locationNode.city.code : ''
      profile.hometown = displayText
      return
    }

    profile.locationRegion = locationNode.region.code
    profile.locationState = locationNode.state ? locationNode.state.code : ''
    profile.locationCity = locationNode.city ? locationNode.city.code : ''
    profile.location = displayText
  })
}

function handleAnnouncementList(token, path) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const matched = /^\/api\/announcement\/start\/(\d+)\/size\/(\d+)$/.exec(path)
  const start = matched ? Number(matched[1]) : 0
  const size = matched ? Number(matched[2]) : 10
  return resolveWithDelay(buildSuccess(ANNOUNCEMENT_LIST.slice(start, start + size)))
}

function handleInteractionList(token, path) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const matched = /^\/api\/message\/interaction\/start\/(\d+)\/size\/(\d+)$/.exec(path)
  const start = matched ? Number(matched[1]) : 0
  const size = matched ? Number(matched[2]) : 20
  const state = readState()
  return resolveWithDelay(buildSuccess(state.interactionMessages.slice(start, start + size)))
}

function handleUnreadCount(token) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const state = readState()
  const unreadCount = state.interactionMessages.filter(function(item) {
    return !item.isRead
  }).length
  return resolveWithDelay(buildSuccess(unreadCount))
}

function handleMessageRead(token, path) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const messageId = /^\/api\/message\/id\/(.+)\/read$/.exec(path)
  if (!messageId) {
    return rejectWithMessage('消息不存在')
  }

  const nextState = readState()
  nextState.interactionMessages = nextState.interactionMessages.map(function(item) {
    if (item.id === messageId[1]) {
      return Object.assign({}, item, { isRead: true })
    }
    return item
  })
  writeState(nextState)
  return resolveWithDelay(buildSuccess(null))
}

function handleMessageReadAll(token) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const nextState = readState()
  nextState.interactionMessages = nextState.interactionMessages.map(function(item) {
    return Object.assign({}, item, { isRead: true })
  })
  writeState(nextState)
  return resolveWithDelay(buildSuccess(null))
}

function handleLogin(payload) {
  const username = String(payload.username || '').trim()
  const password = String(payload.password || '').trim()

  if (!username || !password) {
    return rejectWithMessage('校园网账号和密码不能为空')
  }

  if (username !== MOCK_ACCOUNT.username || password !== MOCK_ACCOUNT.password) {
    return rejectWithMessage('账号或密码错误，请检查后重试', { statusCode: 401 })
  }

  const nextState = readState()
  nextState.token = 'mock-session-token'
  writeState(nextState)
  return resolveWithDelay(buildSuccess({ token: nextState.token }))
}

function handleProfile(token) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const state = readState()
  return resolveWithDelay(buildSuccess(Object.assign({}, state.profile)))
}

function handleAvatar(token) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const state = readState()
  return resolveWithDelay(buildSuccess(state.profile.avatar || ''))
}

function handleAvatarUpdate(token, payload) {
  const avatarKey = String(payload.avatarKey || payload.avatarHdKey || '').trim()

  return applyProfileUpdate(token, function(profile) {
    profile.avatar = avatarKey
  })
}

function handleAvatarDelete(token) {
  return applyProfileUpdate(token, function(profile) {
    profile.avatar = ''
  })
}

function handleGrade(token, query) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const requestedYear = query && query.year !== undefined ? Number(query.year) : NaN
  const report = GRADE_REPORTS.filter(function(item) {
    return item.year === requestedYear
  })[0] || GRADE_REPORTS[0]

  return resolveWithDelay(buildSuccess(report))
}

function handleSchedule(token, query) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const week = query && query.week ? Number(query.week) : 5
  return resolveWithDelay(buildSuccess({
    week: week,
    scheduleList: cloneValue(SCHEDULE_TEMPLATE)
  }))
}

function handleCardInfo(token) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const state = readState()
  return resolveWithDelay(buildSuccess({
    name: '林知远',
    number: '20231234567',
    cardBalance: '128.50',
    cardInterimBalance: '0.00',
    cardNumber: '6217000012345678',
    cardLostState: state.cardLostState,
    cardFreezeState: '正常'
  }))
}

function handleCardQuery(token) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  return resolveWithDelay(buildSuccess({
    cardList: cloneValue(CARD_TRANSACTIONS)
  }))
}

function handleCardLost(token, query) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const cardPassword = String(query.cardPassword || '').trim()
  if (!/^\d{6}$/.test(cardPassword)) {
    return rejectWithMessage('请输入正确的校园卡查询密码')
  }

  if (cardPassword !== '246810') {
    return rejectWithMessage('模拟挂失失败：校园卡查询密码不正确')
  }

  const state = readState()
  state.cardLostState = '已挂失'
  writeState(state)
  return resolveWithDelay(buildSuccess(null))
}

function handleBookBorrow(token, query) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const password = String(query.password || '').trim()
  if (password && password !== 'library123' && password !== '123456') {
    return rejectWithMessage('图书馆密码不正确')
  }

  return resolveWithDelay(buildSuccess(buildBorrowedBooks(readState())))
}

function handleBookRenew(token, payload) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const password = String(payload.password || '').trim()
  if (!password) {
    return rejectWithMessage('请输入图书馆密码')
  }

  if (password !== 'library123') {
    return rejectWithMessage('模拟续借失败：图书馆密码不正确')
  }

  const state = readState()
  if (payload.code) {
    state.renewedBookCodes = state.renewedBookCodes.concat([payload.code]).filter(function(item, index, list) {
      return list.indexOf(item) === index
    })
    writeState(state)
  }
  return resolveWithDelay(buildSuccess(null))
}

function handleCollectionBorrow(token, query) {
  return handleBookBorrow(token, query)
}

function handleCollectionRenew(token, query) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const state = readState()
  if (query.code) {
    state.renewedBookCodes = state.renewedBookCodes.concat([query.code]).filter(function(item, index, list) {
      return list.indexOf(item) === index
    })
    writeState(state)
  }
  return resolveWithDelay(buildSuccess(null))
}

function handleCollectionSearch(query) {
  const resultList = queryCollectionList(query.keyword)
  return resolveWithDelay(buildSuccess({
    collectionList: resultList,
    sumPage: resultList.length > 0 ? 1 : 0
  }))
}

function handleCollectionDetail(query) {
  const detailUrl = String(query.detailURL || '').trim()
  const detail = COLLECTION_DETAILS[detailUrl] || COLLECTION_DETAILS.detail_swiftui
  return resolveWithDelay(buildSuccess(detail))
}

function handleCetNumberGet(token) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const state = readState()
  return resolveWithDelay(buildSuccess({
    number: state.savedCetNumber,
    name: state.savedCetName
  }))
}

function handleCetNumberSave(token, payload) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const number = String(payload.number || '').trim()
  const name = String(payload.name || '').trim()

  if (!/^\d{15}$/.test(number)) {
    return rejectWithMessage('准考证号必须为15位数字')
  }

  const state = readState()
  state.savedCetNumber = number
  state.savedCetName = name
  writeState(state)
  return resolveWithDelay(buildSuccess(null))
}

function handleCetQuery(token, query) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const checkcode = String(query.checkcode || '').trim().toLowerCase()
  if (checkcode !== 'gd26' && checkcode !== '1234') {
    return rejectWithMessage('模拟查询失败：验证码错误')
  }

  return resolveWithDelay(buildSuccess({
    name: String(query.name || '').trim() || '林知远',
    school: '广东第二师范学院',
    type: '英语六级',
    admissionCard: String(query.ticketNumber || '').trim(),
    totalScore: '568',
    listeningScore: '189',
    readingScore: '205',
    writingAndTranslatingScore: '174'
  }))
}

function handleGraduateExam(payload) {
  if (!String(payload.name || '').trim() || !String(payload.examNumber || '').trim() || !String(payload.idNumber || '').trim()) {
    return rejectWithMessage('请完整填写考研查询信息')
  }

  return resolveWithDelay(buildSuccess({
    name: String(payload.name || '').trim(),
    signUpNumber: 'K202600889',
    examNumber: String(payload.examNumber || '').trim(),
    totalScore: '372',
    firstScore: '68',
    secondScore: '74',
    thirdScore: '116',
    fourthScore: '114'
  }))
}

function handleSpareRoom(token) {
  const authError = ensureAuthorized(token)
  if (authError) {
    return authError
  }

  return resolveWithDelay(buildSuccess(cloneValue(SPARE_ROOMS)))
}

function handleNews(path) {
  const matched = /^\/api\/news\/type\/(\d+)\/start\/(\d+)\/size\/(\d+)$/.exec(path)
  if (!matched) {
    return rejectWithMessage('未匹配到新闻接口')
  }

  const type = Number(matched[1])
  const start = Number(matched[2])
  const size = Number(matched[3])
  const list = NEWS_BY_TYPE[type] || []
  return resolveWithDelay(buildSuccess(list.slice(start, start + size)))
}

function handleReading() {
  return resolveWithDelay(buildSuccess(cloneValue(READING_LIST)))
}

function handleElectricFees(payload) {
  const name = String(payload.name || '').trim()
  const number = String(payload.number || '').trim()
  const year = Number(payload.year)

  if (!name || !number) {
    return rejectWithMessage('请完整填写姓名和学号')
  }

  return resolveWithDelay(buildSuccess({
    year: year || 2026,
    buildingNumber: '11 栋',
    roomNumber: 503,
    peopleNumber: 4,
    department: '信息工程学院',
    number: Number(number),
    name: name,
    usedElectricAmount: 128.5,
    freeElectricAmount: 30,
    feeBasedElectricAmount: 98.5,
    electricPrice: 0.68,
    totalElectricBill: 66.98,
    averageElectricBill: 16.75
  }))
}

function handleYellowPage() {
  return resolveWithDelay(buildSuccess(cloneValue(YELLOW_PAGE_RESULT)))
}

function handleModuleStateDetail() {
  return resolveWithDelay(buildSuccess({
    extension: {
      EMAIL: true,
      ENCRYPTION: true,
      ALIPAY_MINIPROGRAM: true,
      QQ_MINIPROGRAM: true,
      ALIYUN_API: true,
      ALIYUN_SMS: true,
      JWT: true,
      NEWS: true,
      REPLAY_ATTACKS_VALIDATE: true,
      WECHAT_OFFICIAL_ACCOUNT: true,
      WECHAT_MINI_PROGRAM: true
    },
    core: {
      MYSQL: true,
      MONGODB: true,
      REDIS: true
    }
  }))
}

function handleLogout(token) {
  if (!token) {
    return Promise.resolve()
  }

  const state = readState()
  if (state.token === token) {
    state.token = ''
    writeState(state)
  }
  return Promise.resolve()
}

function handleRequest(options) {
  const requestOptions = options || {}
  const method = String(requestOptions.method || 'GET').toUpperCase()
  const requestParts = parseRequestParts(requestOptions.path || requestOptions.url || '', requestOptions.data)
  const path = requestParts.path
  const payload = requestOptions.data || {}
  const query = requestParts.query
  const token = requestOptions.sessionToken || requestOptions.token || ''

  if (path === '/api/auth/login' && method === 'POST') {
    return handleLogin(payload)
  }

  if (path === '/api/profile/avatar' && method === 'GET') {
    return handleAvatar(token)
  }

  if (path === '/api/profile/avatar' && method === 'POST') {
    return handleAvatarUpdate(token, payload)
  }

  if (path === '/api/profile/avatar' && method === 'DELETE') {
    return handleAvatarDelete(token)
  }

  if (path === '/api/user/profile' && method === 'GET') {
    return handleProfile(token)
  }

  if (path === '/api/locationList' && method === 'GET') {
    return handleLocationList(token)
  }

  if (path === '/api/profile/nickname' && method === 'POST') {
    return handleNicknameUpdate(token, payload)
  }

  if (path === '/api/introduction' && method === 'POST') {
    return handleIntroductionUpdate(token, payload)
  }

  if (path === '/api/profile/birthday' && method === 'POST') {
    return handleBirthdayUpdate(token, payload)
  }

  if (path === '/api/profile/faculty' && method === 'POST') {
    return handleFacultyUpdate(token, payload)
  }

  if (path === '/api/profile/major' && method === 'POST') {
    return handleMajorUpdate(token, payload)
  }

  if (path === '/api/profile/enrollment' && method === 'POST') {
    return handleEnrollmentUpdate(token, payload)
  }

  if (path === '/api/profile/location' && method === 'POST') {
    return handleLocationUpdate(token, payload, 'location')
  }

  if (path === '/api/profile/hometown' && method === 'POST') {
    return handleLocationUpdate(token, payload, 'hometown')
  }

  if (path === '/api/grade' && method === 'GET') {
    return handleGrade(token, query)
  }

  if (path === '/api/schedule' && method === 'GET') {
    return handleSchedule(token, query)
  }

  if (path === '/api/card/info' && method === 'GET') {
    return handleCardInfo(token)
  }

  if (path === '/api/card/query' && method === 'POST') {
    return handleCardQuery(token)
  }

  if (path === '/api/evaluate/submit' && method === 'POST') {
    return resolveWithDelay(buildSuccess(null))
  }

  if (path === '/api/card/lost' && method === 'POST') {
    return handleCardLost(token, query)
  }

  if (path === '/api/collection/search' && method === 'GET') {
    return handleCollectionSearch(query)
  }

  if (path === '/api/collection/detail' && method === 'GET') {
    return handleCollectionDetail(query)
  }

  if (path === '/api/book/borrow' && method === 'GET') {
    return handleBookBorrow(token, query)
  }

  if (path === '/api/book/renew' && method === 'POST') {
    return handleBookRenew(token, payload)
  }

  if (path === '/api/collection/borrow' && method === 'GET') {
    return handleCollectionBorrow(token, query)
  }

  if (path === '/api/collection/renew' && method === 'POST') {
    return handleCollectionRenew(token, query)
  }

  if (path === '/api/cet/number' && method === 'GET') {
    return handleCetNumberGet(token)
  }

  if (path === '/api/cet/number' && method === 'POST') {
    return handleCetNumberSave(token, payload)
  }

  if (path === '/api/cet/checkcode' && method === 'GET') {
    return resolveWithDelay(buildSuccess(''))
  }

  if (path === '/api/cet/query' && method === 'GET') {
    return handleCetQuery(token, query)
  }

  if (path === '/api/kaoyan/query' && method === 'POST') {
    return handleGraduateExam(payload)
  }

  if (path === '/api/spare/query' && method === 'POST') {
    return handleSpareRoom(token)
  }

  if (/^\/api\/news\/type\/\d+\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    return handleNews(path)
  }

  if (path === '/api/reading' && method === 'GET') {
    return handleReading()
  }

  if (/^\/api\/announcement\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    return handleAnnouncementList(token, path)
  }

  if (/^\/api\/message\/interaction\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    return handleInteractionList(token, path)
  }

  if (path === '/api/message/unread' && method === 'GET') {
    return handleUnreadCount(token)
  }

  if (/^\/api\/message\/id\/.+\/read$/.test(path) && method === 'POST') {
    return handleMessageRead(token, path)
  }

  if (path === '/api/message/readall' && method === 'POST') {
    return handleMessageReadAll(token)
  }

  if (path === '/api/data/electricfees' && method === 'POST') {
    return handleElectricFees(payload)
  }

  if (path === '/api/data/yellowpage' && method === 'GET') {
    return handleYellowPage()
  }

  if (path === '/api/module/state/detail' && method === 'GET') {
    return handleModuleStateDetail()
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    return resolveWithDelay(buildSuccess(null))
  }

  const communityResponse = communityMock.handleRequest({
    path: path,
    method: method,
    payload: payload,
    query: query,
    token: token,
    utils: {
      cloneValue: cloneValue,
      buildSuccess: buildSuccess,
      rejectWithMessage: rejectWithMessage,
      resolveWithDelay: resolveWithDelay,
      ensureAuthorized: ensureAuthorized,
      readState: readState,
      writeState: writeState
    }
  })
  if (communityResponse) {
    return communityResponse
  }

  return rejectWithMessage('该模拟接口暂未实现')
}

module.exports = {
  handleRequest,
  isSessionTokenValid,
  handleLogout
}
