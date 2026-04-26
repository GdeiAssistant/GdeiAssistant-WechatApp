var { formatLocationDisplay, getDefaultProfileOptionsPayload } = require('../constants/profile.js')
var i18n = require('../utils/i18n.js')

var MOCK_ACCOUNT_DATA = {
  username: require('../constants/mock.js').MOCK_ACCOUNT_USERNAME,
  password: require('../constants/mock.js').MOCK_ACCOUNT_PASSWORD
}

function localizedProfileText(simplifiedChinese, traditionalChinese, english, japanese, korean, locale) {
  var normalizedLocale = i18n.normalizeLocale(locale)
  if (normalizedLocale === 'zh-HK' || normalizedLocale === 'zh-TW') return traditionalChinese
  if (normalizedLocale === 'en') return english
  if (normalizedLocale === 'ja') return japanese
  if (normalizedLocale === 'ko') return korean
  return simplifiedChinese
}

function buildBaseProfile(locale) {
  var normalizedLocale = i18n.normalizeLocale(locale || i18n.getCurrentLocale())
  var options = getDefaultProfileOptionsPayload(normalizedLocale)
  var computerFaculty = options.faculties.filter(function(item) { return item.code === 11 })[0] || { label: '', majors: [] }
  var softwareEngineering = computerFaculty.majors.filter(function(item) { return item.code === 'software_engineering' })[0] || { label: '' }

  return {
    username: 'gdeiassistant',
    nickname: localizedProfileText('林知远', '林知遠', 'Lin Zhiyuan', 'リン・ジーユエン', '린즈위안', normalizedLocale),
    avatar: '',
    birthday: '2004-09-16',
    faculty: {
      code: 11,
      label: computerFaculty.label
    },
    major: {
      code: 'software_engineering',
      label: softwareEngineering.label
    },
    enrollment: '2023',
    location: {
      region: 'CN',
      state: '44',
      city: '1',
      displayName: localizedProfileText('中国 广东 广州', '中國 廣東 廣州', 'China Guangdong Guangzhou', '中国 広東 広州', '중국 광둥 광저우', normalizedLocale)
    },
    hometown: {
      region: 'CN',
      state: '44',
      city: '5',
      displayName: localizedProfileText('中国 广东 汕头', '中國 廣東 汕頭', 'China Guangdong Shantou', '中国 広東 汕頭', '중국 광둥 산터우', normalizedLocale)
    },
    introduction: localizedProfileText(
      '喜欢做实用的小工具，也在准备移动端开发实习。',
      '喜歡做實用的小工具，也在準備流動端開發實習。',
      'Enjoys building practical tools and is preparing for a mobile development internship.',
      '実用的な小さなツールを作るのが好きで、モバイル開発インターンの準備もしています。',
      '실용적인 작은 도구를 만드는 것을 좋아하고, 모바일 개발 인턴을 준비하고 있습니다.',
      normalizedLocale
    ),
    ipArea: localizedProfileText('广东', '廣東', 'Guangdong', '広東', '광둥', normalizedLocale)
  }
}

var GRADE_REPORTS = [
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

var SCHEDULE_TEMPLATE = [
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

var CARD_TRANSACTIONS = [
  { merchantName: '第一食堂', tradeName: '消费', tradePrice: '-13.50', tradeTime: '2026-03-15 12:16:20' },
  { merchantName: '第三食堂', tradeName: '消费', tradePrice: '-11.00', tradeTime: '2026-03-15 07:42:11' },
  { merchantName: '校园卡服务中心', tradeName: '充值', tradePrice: '100.00', tradeTime: '2026-03-14 18:03:51' },
  { merchantName: '超市', tradeName: '消费', tradePrice: '-26.80', tradeTime: '2026-03-14 16:35:07' }
]

var COLLECTION_ITEMS = [
  { bookname: 'SwiftUI 界面开发实践', author: '李明', publishingHouse: '人民邮电出版社', detailURL: 'detail_swiftui' },
  { bookname: '操作系统概念', author: 'Abraham Silberschatz', publishingHouse: '机械工业出版社', detailURL: 'detail_os' },
  { bookname: '大学英语六级真题精讲', author: '刘洋', publishingHouse: '外语教学出版社', detailURL: 'detail_cet' },
  { bookname: '研究生入学考试数学复习全书', author: '张宇', publishingHouse: '高等教育出版社', detailURL: 'detail_kaoyan' }
]

var COLLECTION_DETAILS = {
  detail_swiftui: {
    bookname: 'SwiftUI 界面开发实践', author: '李明',
    principal: 'SwiftUI 界面开发实践 李明', publishingHouse: '人民邮电出版社 2025',
    price: '9787115600001 68.00', physicalDescriptionArea: '16 开，附录含实验案例与索引',
    personalPrincipal: '李明', subjectTheme: '移动开发 / 界面设计', chineseLibraryClassification: 'TP312.8',
    collectionDistributionList: [
      { location: '北校区图书馆 3 楼 A 区', callNumber: 'TP312.8/S12', barcode: 'B1002381', state: '在馆' },
      { location: '南校区图书馆 2 楼借阅区', callNumber: 'TP312.8/S12', barcode: 'B1002382', state: '可借' }
    ]
  },
  detail_os: {
    bookname: '操作系统概念', author: 'Abraham Silberschatz',
    principal: '操作系统概念 Abraham Silberschatz', publishingHouse: '机械工业出版社 2024',
    price: '9787111700002 99.00', physicalDescriptionArea: '精装，配套习题集',
    personalPrincipal: 'Abraham Silberschatz', subjectTheme: '操作系统', chineseLibraryClassification: 'TP316',
    collectionDistributionList: [
      { location: '图书馆 4 楼计算机专区', callNumber: 'TP316/O11', barcode: 'B2003291', state: '在馆' }
    ]
  },
  detail_cet: {
    bookname: '大学英语六级真题精讲', author: '刘洋',
    principal: '大学英语六级真题精讲 刘洋', publishingHouse: '外语教学出版社 2026',
    price: '9787567899999 49.80', physicalDescriptionArea: '附赠音频资料',
    personalPrincipal: '刘洋', subjectTheme: '英语六级', chineseLibraryClassification: 'H319.6',
    collectionDistributionList: [
      { location: '图书馆 2 楼外语专区', callNumber: 'H319.6/L25', barcode: 'B5200081', state: '可借' }
    ]
  },
  detail_kaoyan: {
    bookname: '研究生入学考试数学复习全书', author: '张宇',
    principal: '研究生入学考试数学复习全书 张宇', publishingHouse: '高等教育出版社 2026',
    price: '9787040654321 59.00', physicalDescriptionArea: '附章节练习与答案',
    personalPrincipal: '张宇', subjectTheme: '考研数学', chineseLibraryClassification: 'O13',
    collectionDistributionList: [
      { location: '图书馆 1 楼考试专区', callNumber: 'O13/Z11', barcode: 'B8801022', state: '在馆' }
    ]
  }
}

var DEFAULT_BORROWED_BOOKS = [
  { name: 'iOS 架构设计实践', id: 'B0001001', sn: 'sn_1001', code: 'code_1001', author: '王磊', borrowDate: '2026-03-01', returnDate: '2026-03-22', renewTime: 0 },
  { name: '数据库系统概论', id: 'B0001002', sn: 'sn_1002', code: 'code_1002', author: '陈小华', borrowDate: '2026-02-24', returnDate: '2026-03-17', renewTime: 1 }
]

var NEWS_BY_TYPE = {
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

var ANNOUNCEMENT_LIST = [
  { id: 'announcement_001', title: '系统维护通知', publishTime: '1小时前', content: '为配合学期中服务器扩容，本周三 18:00 至 20:00 将进行例行维护。维护期间消息中心、校园社区和部分查询服务可能出现短暂不可用，建议提前保存正在编辑的内容。' },
  { id: 'announcement_002', title: '春季双选会入场安排', publishTime: '今天 09:10', content: '春季校园双选会将于本周五 14:30 在体育馆举行。请已报名同学提前准备校园卡，按学院分批入场，现场会同步开放企业岗位二维码与志愿者咨询台。' },
  { id: 'announcement_003', title: '图书馆夜间开放时段调整', publishTime: '昨天', content: '从下周起，图书馆一楼自习区开放时间延长至 23:00，二楼研讨室仍需预约。若遇到插座、座位预约或入馆设备异常，可直接在资讯页提交反馈。' },
  { id: 'announcement_004', title: '校医院门诊排班更新', publishTime: '昨天 18:40', content: '校医院本周起调整晚间门诊排班，工作日 18:30 后优先接待急诊与发热相关问诊，普通门诊请尽量在白天时段前往。' },
  { id: 'announcement_005', title: '宿舍门禁系统升级提醒', publishTime: '前天', content: '北区与中区宿舍门禁将于本周末夜间分批升级，升级期间刷卡开门可能存在短暂延迟，请提前留意楼栋群通知。' },
  { id: 'announcement_006', title: '就业指导中心咨询时段开放', publishTime: '2026-03-01', content: '就业指导中心新增春招一对一简历咨询时段，已开放线上预约。需要模拟面试或简历修改的同学可在工作日预约。' }
]

var INTERACTION_MESSAGES = [
  { id: 'msg_interaction_001', module: 'dating', type: 'interaction', targetType: 'sent', targetId: '802', targetSubId: '701', title: '卖室友互动', content: '你发出的卖室友申请已被对方查看，去看看最新状态。', createdAt: '刚刚', isRead: false },
  { id: 'msg_interaction_002', module: 'delivery', type: 'interaction', targetType: 'published', targetId: '601', targetSubId: '9001', title: '全民快递提醒', content: '你发布的订单已被接单，建议尽快和接单同学确认送达时间。', createdAt: '6分钟前', isRead: false },
  { id: 'msg_interaction_003', module: 'delivery', type: 'interaction', targetType: 'accepted', targetId: '602', targetSubId: '9001', title: '全民快递提醒', content: '你接的订单已完成，系统已同步为已完成状态。', createdAt: '12分钟前', isRead: false },
  { id: 'msg_interaction_004', module: 'secret', type: 'comment', targetType: 'comment', targetId: '301', targetSubId: '1', title: '树洞互动', content: '有人回复了你的树洞，打开详情即可查看最新评论。', createdAt: '10分钟前', isRead: false },
  { id: 'msg_interaction_005', module: 'express', type: 'comment', targetType: 'comment', targetId: '401', targetSubId: '1', title: '表白墙互动', content: '有人给你的表白留了言，打开详情即可查看最新评论。', createdAt: '14分钟前', isRead: false },
  { id: 'msg_interaction_006', module: 'express', type: 'interaction', targetType: 'guess', targetId: '401', targetSubId: '', title: '表白墙互动', content: '有人参与了你的猜名字互动，去看看最新猜测次数。', createdAt: '18分钟前', isRead: true },
  { id: 'msg_interaction_007', module: 'topic', type: 'like', targetType: 'like', targetId: '501', targetSubId: '', title: '话题互动', content: '你的话题收到了新的点赞。', createdAt: '25分钟前', isRead: true },
  { id: 'msg_interaction_008', module: 'photograph', type: 'comment', targetType: 'comment', targetId: '901', targetSubId: '1', title: '拍好校园互动', content: '有人评论了你的作品，打开详情即可查看最新评论。', createdAt: '40分钟前', isRead: false }
]

var YELLOW_PAGE_RESULT = {
  type: [
    { typeCode: 1, typeName: '教务服务' },
    { typeCode: 2, typeName: '后勤服务' },
    { typeCode: 3, typeName: '学生服务' },
    { typeCode: 4, typeName: '图书与网络' }
  ],
  data: [
    { typeCode: 1, section: '教务处值班室', majorPhone: '020-00000001', minorPhone: '', address: '示例楼栋 302', email: 'service@example.test', website: 'https://example.test/academic' },
    { typeCode: 1, section: '考务办公室', majorPhone: '020-00000002', minorPhone: '020-00000003', address: '示例楼栋 306', email: 'exam@example.test', website: '' },
    { typeCode: 2, section: '宿舍报修', majorPhone: '020-00000004', minorPhone: '', address: '示例后勤楼 1 层', email: 'repair@example.test', website: '' },
    { typeCode: 2, section: '校园保卫处', majorPhone: '020-00000005', minorPhone: '020-00000006', address: '示例值班室', email: '', website: '' },
    { typeCode: 3, section: '学生工作部', majorPhone: '020-00000007', minorPhone: '', address: '示例楼栋 201', email: 'student@example.test', website: '' },
    { typeCode: 3, section: '就业指导中心', majorPhone: '020-00000008', minorPhone: '', address: '示例服务楼', email: 'career@example.test', website: 'https://example.test/career' },
    { typeCode: 4, section: '图书馆总服务台', majorPhone: '020-00000009', minorPhone: '', address: '示例图书馆 1 层', email: 'library@example.test', website: 'https://example.test/library' },
    { typeCode: 4, section: '网络信息中心', majorPhone: '020-00000010', minorPhone: '020-00000011', address: '示例信息楼 402', email: 'network@example.test', website: 'https://example.test/network' }
  ]
}

var SPARE_ROOMS = [
  { number: 'A201', name: '教学楼 A201', type: '多媒体课室', zone: '海珠校区', classSeating: '120', section: '第 1-2 节', examSeating: '96' },
  { number: 'B305', name: '教学楼 B305', type: '普通课室', zone: '海珠校区', classSeating: '80', section: '第 1-2 节', examSeating: '64' },
  { number: 'E402', name: '实验楼 E402', type: '机房', zone: '海珠校区', classSeating: '60', section: '第 1-2 节', examSeating: '48' }
]

function cloneMockValue(value) {
  return JSON.parse(JSON.stringify(value))
}

function localizedMockText(simplifiedChinese, traditionalChinese, english, japanese, korean, locale) {
  return localizedProfileText(simplifiedChinese, traditionalChinese, english, japanese, korean, locale || i18n.getCurrentLocale())
}

function getGradeReports(locale) {
  var normalizedLocale = i18n.normalizeLocale(locale || i18n.getCurrentLocale())
  var reports = cloneMockValue(GRADE_REPORTS)

  reports[0].firstTermGradeList[0].gradeName = localizedMockText('高等数学', '高等數學', 'Advanced Mathematics', '高等数学', '고등수학', normalizedLocale)
  reports[0].firstTermGradeList[1].gradeName = localizedMockText('程序设计基础', '程式設計基礎', 'Programming Fundamentals', 'プログラミング基礎', '프로그래밍 기초', normalizedLocale)
  reports[0].firstTermGradeList[2].gradeName = localizedMockText('大学英语', '大學英語', 'College English', '大学英語', '대학 영어', normalizedLocale)
  reports[0].secondTermGradeList[0].gradeName = localizedMockText('数据结构', '資料結構', 'Data Structures', 'データ構造', '자료구조', normalizedLocale)
  reports[0].secondTermGradeList[1].gradeName = localizedMockText('离散数学', '離散數學', 'Discrete Mathematics', '離散数学', '이산수학', normalizedLocale)
  reports[0].secondTermGradeList[2].gradeName = localizedMockText('大学物理', '大學物理', 'College Physics', '大学物理', '대학 물리', normalizedLocale)

  reports[1].firstTermGradeList[0].gradeName = localizedMockText('数据库系统概论', '資料庫系統概論', 'Introduction to Database Systems', 'データベースシステム概論', '데이터베이스 시스템 개론', normalizedLocale)
  reports[1].firstTermGradeList[1].gradeName = localizedMockText('操作系统', '作業系統', 'Operating Systems', 'オペレーティングシステム', '운영체제', normalizedLocale)
  reports[1].firstTermGradeList[2].gradeName = localizedMockText('计算机网络', '計算機網路', 'Computer Networks', 'コンピュータネットワーク', '컴퓨터 네트워크', normalizedLocale)
  reports[1].secondTermGradeList[0].gradeName = localizedMockText('软件工程', '軟體工程', 'Software Engineering', 'ソフトウェア工学', '소프트웨어 공학', normalizedLocale)
  reports[1].secondTermGradeList[1].gradeName = localizedMockText('编译原理', '編譯原理', 'Compiler Principles', 'コンパイラ原理', '컴파일러 원리', normalizedLocale)
  reports[1].secondTermGradeList[2].gradeName = localizedMockText('概率论与数理统计', '機率論與數理統計', 'Probability and Statistics', '確率論と数理統計', '확률론과 수리통계', normalizedLocale)

  reports[2].firstTermGradeList[0].gradeName = localizedMockText('iOS 移动开发', 'iOS 移動開發', 'iOS Mobile Development', 'iOS モバイル開発', 'iOS 모바일 개발', normalizedLocale)
  reports[2].firstTermGradeList[1].gradeName = localizedMockText('前端工程化', '前端工程化', 'Frontend Engineering', 'フロントエンドエンジニアリング', '프론트엔드 엔지니어링', normalizedLocale)
  reports[2].firstTermGradeList[2].gradeName = localizedMockText('计算机图形学', '計算機圖形學', 'Computer Graphics', 'コンピュータグラフィックス', '컴퓨터 그래픽스', normalizedLocale)
  reports[2].secondTermGradeList[0].gradeName = localizedMockText('软件测试', '軟體測試', 'Software Testing', 'ソフトウェアテスト', '소프트웨어 테스트', normalizedLocale)
  reports[2].secondTermGradeList[1].gradeName = localizedMockText('项目管理', '項目管理', 'Project Management', 'プロジェクト管理', '프로젝트 관리', normalizedLocale)
  reports[2].secondTermGradeList[2].gradeName = localizedMockText('人工智能导论', '人工智慧導論', 'Introduction to AI', '人工知能入門', '인공지능 입문', normalizedLocale)

  reports[3].firstTermGradeList[0].gradeName = localizedMockText('毕业实习', '畢業實習', 'Graduation Internship', '卒業実習', '졸업 인턴십', normalizedLocale)
  reports[3].firstTermGradeList[1].gradeName = localizedMockText('创新创业实践', '創新創業實踐', 'Innovation Practice', 'イノベーション実践', '창업 실습', normalizedLocale)
  reports[3].secondTermGradeList[0].gradeName = localizedMockText('毕业设计', '畢業設計', 'Graduation Project', '卒業制作', '졸업 프로젝트', normalizedLocale)
  reports[3].firstTermGradeList[0].gradeScore = localizedMockText('优', '優', 'Excellent', '優', '우수', normalizedLocale)
  reports[3].firstTermGradeList[1].gradeScore = localizedMockText('良', '良', 'Good', '良', '양호', normalizedLocale)
  reports[3].secondTermGradeList[0].gradeScore = localizedMockText('进行中', '進行中', 'In Progress', '進行中', '진행 중', normalizedLocale)

  return reports
}

function getScheduleTemplate(locale) {
  var normalizedLocale = i18n.normalizeLocale(locale || i18n.getCurrentLocale())
  var list = cloneMockValue(SCHEDULE_TEMPLATE)

  list[0].scheduleLesson = localizedMockText('第 1-2 节', '第 1-2 節', 'Sections 1-2', '1-2限', '1-2교시', normalizedLocale)
  list[0].scheduleName = localizedMockText('移动应用开发', '移動應用開發', 'Mobile App Development', 'モバイルアプリ開発', '모바일 앱 개발', normalizedLocale)
  list[0].scheduleTeacher = localizedMockText('陈老师', '陳老師', 'Prof. Chen', '陳先生', '천 교수', normalizedLocale)
  list[0].scheduleLocation = localizedMockText('教学楼 A201', '教學樓 A201', 'Teaching Building A201', '講義棟 A201', '강의동 A201', normalizedLocale)

  list[1].scheduleLesson = localizedMockText('第 3-4 节', '第 3-4 節', 'Sections 3-4', '3-4限', '3-4교시', normalizedLocale)
  list[1].scheduleName = localizedMockText('软件测试', '軟體測試', 'Software Testing', 'ソフトウェアテスト', '소프트웨어 테스트', normalizedLocale)
  list[1].scheduleTeacher = localizedMockText('张老师', '張老師', 'Prof. Zhang', '張先生', '장 교수', normalizedLocale)
  list[1].scheduleLocation = localizedMockText('教学楼 C402', '教學樓 C402', 'Teaching Building C402', '講義棟 C402', '강의동 C402', normalizedLocale)

  list[2].scheduleLesson = localizedMockText('第 1-2 节', '第 1-2 節', 'Sections 1-2', '1-2限', '1-2교시', normalizedLocale)
  list[2].scheduleName = localizedMockText('数据库原理', '資料庫原理', 'Database Principles', 'データベース原理', '데이터베이스 원리', normalizedLocale)
  list[2].scheduleTeacher = localizedMockText('李老师', '李老師', 'Prof. Li', '李先生', '이 교수', normalizedLocale)
  list[2].scheduleLocation = localizedMockText('教学楼 B305', '教學樓 B305', 'Teaching Building B305', '講義棟 B305', '강의동 B305', normalizedLocale)

  list[3].scheduleLesson = localizedMockText('第 5-6 节', '第 5-6 節', 'Sections 5-6', '5-6限', '5-6교시', normalizedLocale)
  list[3].scheduleName = localizedMockText('编译原理', '編譯原理', 'Compiler Principles', 'コンパイラ原理', '컴파일러 원리', normalizedLocale)
  list[3].scheduleTeacher = localizedMockText('王老师', '王老師', 'Prof. Wang', '王先生', '왕 교수', normalizedLocale)
  list[3].scheduleLocation = localizedMockText('教学楼 B402', '教學樓 B402', 'Teaching Building B402', '講義棟 B402', '강의동 B402', normalizedLocale)

  list[4].scheduleLesson = localizedMockText('第 1-2 节', '第 1-2 節', 'Sections 1-2', '1-2限', '1-2교시', normalizedLocale)
  list[4].scheduleName = localizedMockText('计算机网络', '計算機網路', 'Computer Networks', 'コンピュータネットワーク', '컴퓨터 네트워크', normalizedLocale)
  list[4].scheduleTeacher = localizedMockText('周老师', '周老師', 'Prof. Zhou', '周先生', '주 교수', normalizedLocale)
  list[4].scheduleLocation = localizedMockText('教学楼 D202', '教學樓 D202', 'Teaching Building D202', '講義棟 D202', '강의동 D202', normalizedLocale)

  list[5].scheduleLesson = localizedMockText('第 7-8 节', '第 7-8 節', 'Sections 7-8', '7-8限', '7-8교시', normalizedLocale)
  list[5].scheduleName = localizedMockText('就业指导', '就業指導', 'Career Guidance', '就職指導', '진로 지도', normalizedLocale)
  list[5].scheduleTeacher = localizedMockText('辅导员', '輔導員', 'Advisor', '指導員', '지도교수', normalizedLocale)
  list[5].scheduleLocation = localizedMockText('教学楼 A101', '教學樓 A101', 'Teaching Building A101', '講義棟 A101', '강의동 A101', normalizedLocale)

  return list
}

function getCardTransactions(locale) {
  var normalizedLocale = i18n.normalizeLocale(locale || i18n.getCurrentLocale())
  var list = cloneMockValue(CARD_TRANSACTIONS)
  list[0].merchantName = localizedMockText('第一食堂', '第一食堂', 'Canteen 1', '第一食堂', '제1식당', normalizedLocale)
  list[1].merchantName = localizedMockText('第三食堂', '第三食堂', 'Canteen 3', '第三食堂', '제3식당', normalizedLocale)
  list[2].merchantName = localizedMockText('校园卡服务中心', '校園卡服務中心', 'Campus Card Service Center', '学生証サービスセンター', '캠퍼스 카드 서비스 센터', normalizedLocale)
  list[3].merchantName = localizedMockText('超市', '超市', 'Campus Store', '売店', '매점', normalizedLocale)
  list[0].tradeName = localizedMockText('消费', '消費', 'Purchase', '支出', '결제', normalizedLocale)
  list[1].tradeName = localizedMockText('消费', '消費', 'Purchase', '支出', '결제', normalizedLocale)
  list[2].tradeName = localizedMockText('充值', '充值', 'Top-up', 'チャージ', '충전', normalizedLocale)
  list[3].tradeName = localizedMockText('消费', '消費', 'Purchase', '支出', '결제', normalizedLocale)
  return list
}

function getCollectionItems(locale) {
  var normalizedLocale = i18n.normalizeLocale(locale || i18n.getCurrentLocale())
  var list = cloneMockValue(COLLECTION_ITEMS)
  list[0].bookname = localizedMockText('SwiftUI 界面开发实践', 'SwiftUI 介面開發實踐', 'SwiftUI Interface Development in Practice', 'SwiftUI UI開発実践', 'SwiftUI UI 개발 실전', normalizedLocale)
  list[0].author = localizedMockText('李明', '李明', 'Li Ming', '李明', '리밍', normalizedLocale)
  list[0].publishingHouse = localizedMockText('人民邮电出版社', '人民郵電出版社', 'Posts & Telecom Press', '人民郵電出版社', '인민우전출판사', normalizedLocale)
  list[1].bookname = localizedMockText('操作系统概念', '作業系統概念', 'Operating System Concepts', 'オペレーティングシステム概念', '운영체제 개념', normalizedLocale)
  list[1].publishingHouse = localizedMockText('机械工业出版社', '機械工業出版社', 'China Machine Press', '機械工業出版社', '기계공업출판사', normalizedLocale)
  list[2].bookname = localizedMockText('大学英语六级真题精讲', '大學英語六級真題精講', 'CET-6 Past Papers Explained', '大学英語六級過去問解説', '영어 6급 기출 해설', normalizedLocale)
  list[2].author = localizedMockText('刘洋', '劉洋', 'Liu Yang', '劉洋', '류양', normalizedLocale)
  list[2].publishingHouse = localizedMockText('外语教学出版社', '外語教學出版社', 'Foreign Language Teaching Press', '外国語教学出版社', '외국어교육출판사', normalizedLocale)
  list[3].bookname = localizedMockText('研究生入学考试数学复习全书', '研究生入學考試數學複習全書', 'Graduate Exam Math Review Guide', '大学院入試数学総復習', '대학원 입시 수학 종합서', normalizedLocale)
  list[3].author = localizedMockText('张宇', '張宇', 'Zhang Yu', '張宇', '장위', normalizedLocale)
  list[3].publishingHouse = localizedMockText('高等教育出版社', '高等教育出版社', 'Higher Education Press', '高等教育出版社', '고등교육출판사', normalizedLocale)
  return list
}

function getCollectionDetails(locale) {
  var normalizedLocale = i18n.normalizeLocale(locale || i18n.getCurrentLocale())
  var details = cloneMockValue(COLLECTION_DETAILS)

  details.detail_swiftui.bookname = localizedMockText('SwiftUI 界面开发实践', 'SwiftUI 介面開發實踐', 'SwiftUI Interface Development in Practice', 'SwiftUI UI開発実践', 'SwiftUI UI 개발 실전', normalizedLocale)
  details.detail_swiftui.author = localizedMockText('李明', '李明', 'Li Ming', '李明', '리밍', normalizedLocale)
  details.detail_swiftui.principal = localizedMockText('SwiftUI 界面开发实践 李明', 'SwiftUI 介面開發實踐 李明', 'SwiftUI Interface Development in Practice Li Ming', 'SwiftUI UI開発実践 李明', 'SwiftUI UI 개발 실전 리밍', normalizedLocale)
  details.detail_swiftui.publishingHouse = localizedMockText('人民邮电出版社 2025', '人民郵電出版社 2025', 'Posts & Telecom Press 2025', '人民郵電出版社 2025', '인민우전출판사 2025', normalizedLocale)
  details.detail_swiftui.physicalDescriptionArea = localizedMockText('16 开，附录含实验案例与索引', '16 開，附錄含實驗案例與索引', '16mo, appendix includes lab cases and index', '付録に実験例と索引付き', '부록에 실습 예제와 색인 포함', normalizedLocale)
  details.detail_swiftui.personalPrincipal = localizedMockText('李明', '李明', 'Li Ming', '李明', '리밍', normalizedLocale)
  details.detail_swiftui.subjectTheme = localizedMockText('移动开发 / 界面设计', '移動開發 / 介面設計', 'Mobile Development / UI Design', 'モバイル開発 / UI設計', '모바일 개발 / UI 설계', normalizedLocale)
  details.detail_swiftui.collectionDistributionList[0].location = localizedMockText('北校区图书馆 3 楼 A 区', '北校區圖書館 3 樓 A 區', 'North Campus Library 3F Zone A', '北キャンパス図書館3階Aゾーン', '북캠퍼스 도서관 3층 A구역', normalizedLocale)
  details.detail_swiftui.collectionDistributionList[0].state = localizedMockText('在馆', '在館', 'In Library', '在架', '소장 중', normalizedLocale)
  details.detail_swiftui.collectionDistributionList[1].location = localizedMockText('南校区图书馆 2 楼借阅区', '南校區圖書館 2 樓借閱區', 'South Campus Library 2F Lending Area', '南キャンパス図書館2階貸出エリア', '남캠퍼스 도서관 2층 대출 구역', normalizedLocale)
  details.detail_swiftui.collectionDistributionList[1].state = localizedMockText('可借', '可借', 'Available', '貸出可', '대출 가능', normalizedLocale)

  details.detail_os.bookname = localizedMockText('操作系统概念', '作業系統概念', 'Operating System Concepts', 'オペレーティングシステム概念', '운영체제 개념', normalizedLocale)
  details.detail_os.principal = localizedMockText('操作系统概念 Abraham Silberschatz', '作業系統概念 Abraham Silberschatz', 'Operating System Concepts Abraham Silberschatz', 'オペレーティングシステム概念 Abraham Silberschatz', '운영체제 개념 Abraham Silberschatz', normalizedLocale)
  details.detail_os.publishingHouse = localizedMockText('机械工业出版社 2024', '機械工業出版社 2024', 'China Machine Press 2024', '機械工業出版社 2024', '기계공업출판사 2024', normalizedLocale)
  details.detail_os.physicalDescriptionArea = localizedMockText('精装，配套习题集', '精裝，配套習題集', 'Hardcover with exercise set', '上製本、演習付き', '양장본, 연습문제 포함', normalizedLocale)
  details.detail_os.subjectTheme = localizedMockText('操作系统', '作業系統', 'Operating Systems', 'オペレーティングシステム', '운영체제', normalizedLocale)
  details.detail_os.collectionDistributionList[0].location = localizedMockText('图书馆 4 楼计算机专区', '圖書館 4 樓計算機專區', 'Library 4F Computer Section', '図書館4階コンピュータ棚', '도서관 4층 컴퓨터 자료실', normalizedLocale)
  details.detail_os.collectionDistributionList[0].state = localizedMockText('在馆', '在館', 'In Library', '在架', '소장 중', normalizedLocale)

  details.detail_cet.bookname = localizedMockText('大学英语六级真题精讲', '大學英語六級真題精講', 'CET-6 Past Papers Explained', '大学英語六級過去問解説', '영어 6급 기출 해설', normalizedLocale)
  details.detail_cet.author = localizedMockText('刘洋', '劉洋', 'Liu Yang', '劉洋', '류양', normalizedLocale)
  details.detail_cet.principal = localizedMockText('大学英语六级真题精讲 刘洋', '大學英語六級真題精講 劉洋', 'CET-6 Past Papers Explained Liu Yang', '大学英語六級過去問解説 劉洋', '영어 6급 기출 해설 류양', normalizedLocale)
  details.detail_cet.publishingHouse = localizedMockText('外语教学出版社 2026', '外語教學出版社 2026', 'Foreign Language Teaching Press 2026', '外国語教学出版社 2026', '외국어교육출판사 2026', normalizedLocale)
  details.detail_cet.physicalDescriptionArea = localizedMockText('附赠音频资料', '附贈音頻資料', 'Includes audio materials', '音声資料付き', '음원 자료 포함', normalizedLocale)
  details.detail_cet.personalPrincipal = localizedMockText('刘洋', '劉洋', 'Liu Yang', '劉洋', '류양', normalizedLocale)
  details.detail_cet.subjectTheme = localizedMockText('英语六级', '英語六級', 'CET-6', '英語六級', '영어 6급', normalizedLocale)
  details.detail_cet.collectionDistributionList[0].location = localizedMockText('图书馆 2 楼外语专区', '圖書館 2 樓外語專區', 'Library 2F Language Section', '図書館2階語学コーナー', '도서관 2층 외국어 코너', normalizedLocale)
  details.detail_cet.collectionDistributionList[0].state = localizedMockText('可借', '可借', 'Available', '貸出可', '대출 가능', normalizedLocale)

  details.detail_kaoyan.bookname = localizedMockText('研究生入学考试数学复习全书', '研究生入學考試數學複習全書', 'Graduate Exam Math Review Guide', '大学院入試数学総復習', '대학원 입시 수학 종합서', normalizedLocale)
  details.detail_kaoyan.author = localizedMockText('张宇', '張宇', 'Zhang Yu', '張宇', '장위', normalizedLocale)
  details.detail_kaoyan.principal = localizedMockText('研究生入学考试数学复习全书 张宇', '研究生入學考試數學複習全書 張宇', 'Graduate Exam Math Review Guide Zhang Yu', '大学院入試数学総復習 張宇', '대학원 입시 수학 종합서 장위', normalizedLocale)
  details.detail_kaoyan.publishingHouse = localizedMockText('高等教育出版社 2026', '高等教育出版社 2026', 'Higher Education Press 2026', '高等教育出版社 2026', '고등교육출판사 2026', normalizedLocale)
  details.detail_kaoyan.physicalDescriptionArea = localizedMockText('附章节练习与答案', '附章節練習與答案', 'Includes chapter exercises and answers', '章末練習と解答付き', '장별 연습문제와 해설 포함', normalizedLocale)
  details.detail_kaoyan.personalPrincipal = localizedMockText('张宇', '張宇', 'Zhang Yu', '張宇', '장위', normalizedLocale)
  details.detail_kaoyan.subjectTheme = localizedMockText('考研数学', '考研數學', 'Exam Math', '大学院入試数学', '대학원 입시 수학', normalizedLocale)
  details.detail_kaoyan.collectionDistributionList[0].location = localizedMockText('图书馆 1 楼考试专区', '圖書館 1 樓考試專區', 'Library 1F Exam Section', '図書館1階試験コーナー', '도서관 1층 시험 자료실', normalizedLocale)
  details.detail_kaoyan.collectionDistributionList[0].state = localizedMockText('在馆', '在館', 'In Library', '在架', '소장 중', normalizedLocale)

  return details
}

function getDefaultBorrowedBooks(locale) {
  var normalizedLocale = i18n.normalizeLocale(locale || i18n.getCurrentLocale())
  var list = cloneMockValue(DEFAULT_BORROWED_BOOKS)
  list[0].name = localizedMockText('iOS 架构设计实践', 'iOS 架構設計實踐', 'iOS Architecture Design in Practice', 'iOS アーキテクチャ設計実践', 'iOS 아키텍처 설계 실전', normalizedLocale)
  list[0].author = localizedMockText('王磊', '王磊', 'Wang Lei', '王磊', '왕레이', normalizedLocale)
  list[1].name = localizedMockText('数据库系统概论', '資料庫系統概論', 'Introduction to Database Systems', 'データベースシステム概論', '데이터베이스 시스템 개론', normalizedLocale)
  list[1].author = localizedMockText('陈小华', '陳小華', 'Chen Xiaohua', '陳小華', '천샤오화', normalizedLocale)
  return list
}

function getNewsByType(locale) {
  var normalizedLocale = i18n.normalizeLocale(locale || i18n.getCurrentLocale())
  var list = cloneMockValue(NEWS_BY_TYPE)
  list[1][0].title = localizedMockText('下周《移动应用开发》实验课教室调整', '下週《移動應用開發》實驗課教室調整', 'Next week\'s Mobile App Development lab room changed', '来週のモバイルアプリ開発実験教室変更', '다음 주 모바일 앱 개발 실습 강의실 변경', normalizedLocale)
  list[1][0].content = localizedMockText('实验课将调整到教学楼 B402，请同学们提前查看课表通知。', '實驗課將調整到教學樓 B402，請同學們提前查看課表通知。', 'The lab will be moved to Teaching Building B402. Please check your schedule notice in advance.', '実験授業は講義棟 B402 に変更されます。事前に時間割のお知らせを確認してください。', '실습 수업이 강의동 B402로 변경됩니다. 미리 시간표 공지를 확인해 주세요.', normalizedLocale)
  list[1][1].title = localizedMockText('春季学期专业选修课补退选开放通知', '春季學期專業選修課補退選開放通知', 'Spring semester add/drop for electives opens', '春学期専門選択科目の追加・取消受付', '봄 학기 전공 선택과목 정정 기간 안내', normalizedLocale)
  list[1][1].content = localizedMockText('补退选时间为 3 月 10 日 9:00 至 3 月 12 日 17:00。', '補退選時間為 3 月 10 日 9:00 至 3 月 12 日 17:00。', 'The add/drop period runs from March 10 at 09:00 to March 12 at 17:00.', '追加・取消期間は 3 月 10 日 9:00 から 3 月 12 日 17:00 までです。', '정정 기간은 3월 10일 09:00부터 3월 12일 17:00까지입니다.', normalizedLocale)
  list[2][0].title = localizedMockText('大学英语六级模拟考试安排发布', '大學英語六級模擬考試安排發布', 'Mock CET-6 exam schedule released', '英語六級模試スケジュール公開', '영어 6급 모의고사 일정 공지', normalizedLocale)
  list[2][0].content = localizedMockText('模拟考试将于本周六上午 9 点进行，地点见准考证。', '模擬考試將於本週六上午 9 點進行，地點見准考證。', 'The mock exam will take place this Saturday at 09:00. Please check the admission ticket for the venue.', '模擬試験は今週土曜日 9 時から実施されます。会場は受験票で確認してください。', '모의고사는 이번 주 토요일 오전 9시에 진행됩니다. 장소는 수험표를 확인해 주세요.', normalizedLocale)
  list[2][1].title = localizedMockText('计算机等级考试报名信息说明', '計算機等級考試報名信息說明', 'Computer proficiency exam registration guide', 'コンピュータ等級試験申込案内', '컴퓨터 등급시험 접수 안내', normalizedLocale)
  list[2][1].content = localizedMockText('报名通道已开启，请在规定时间内完成缴费。', '報名通道已開啟，請在規定時間內完成繳費。', 'Registration is now open. Please complete payment within the required time.', '申込受付が始まりました。所定の期間内に支払いを完了してください。', '접수가 시작되었습니다. 정해진 기간 안에 결제를 완료해 주세요.', normalizedLocale)
  list[3][0].title = localizedMockText('教务系统维护公告', '教務系統維護公告', 'Academic system maintenance notice', '教務システムメンテナンスのお知らせ', '학사 시스템 점검 안내', normalizedLocale)
  list[3][0].content = localizedMockText('教务系统将于周末凌晨维护，请提前保存选课和成绩查询信息。', '教務系統將於週末凌晨維護，請提前保存選課和成績查詢信息。', 'The academic system will undergo maintenance early this weekend. Please save course selection and grade query information in advance.', '教務システムは週末未明にメンテナンスを行います。履修登録や成績照会の内容は事前に保存してください。', '학사 시스템이 주말 새벽에 점검됩니다. 수강신청 및 성적 조회 내용은 미리 저장해 주세요.', normalizedLocale)
  list[3][1].title = localizedMockText('课程成绩复核流程更新', '課程成績複核流程更新', 'Grade review process updated', '成績確認手続き更新', '성적 이의신청 절차 업데이트', normalizedLocale)
  list[3][1].content = localizedMockText('如需申请成绩复核，请按学院要求提交纸质材料。', '如需申請成績複核，請按學院要求提交紙質材料。', 'If you need to request a grade review, please submit the required paper materials according to your school\'s instructions.', '成績確認を申請する場合は、学部の案内に従って紙の書類を提出してください。', '성적 이의신청이 필요하면 단과대 안내에 따라 서류를 제출해 주세요.', normalizedLocale)
  list[4][0].title = localizedMockText('宿舍区热水系统例行检修', '宿舍區熱水系統例行檢修', 'Dorm hot water system maintenance', '寮の給湯設備定期点検', '기숙사 온수 시스템 점검', normalizedLocale)
  list[4][0].content = localizedMockText('北区宿舍热水系统将于明晚分时段检修，请提前安排洗漱时间。', '北區宿舍熱水系統將於明晚分時段檢修，請提前安排洗漱時間。', 'The North dorm hot water system will be maintained tomorrow night in time slots. Please plan ahead for washing up.', '北区寮の給湯設備は明日の夜に時間帯ごとで点検されます。洗面時間を事前に調整してください。', '북구 기숙사 온수 시스템이 내일 밤 시간대별로 점검됩니다. 세면 시간을 미리 조정해 주세요.', normalizedLocale)
  list[4][1].title = localizedMockText('图书馆临时闭馆维护通知', '圖書館臨時閉館維護通知', 'Temporary library closure notice', '図書館臨時休館のお知らせ', '도서관 임시 휴관 안내', normalizedLocale)
  list[4][1].content = localizedMockText('因设备维护，图书馆将于周日 8:00-12:00 暂停开放。', '因設備維護，圖書館將於週日 8:00-12:00 暫停開放。', 'Due to equipment maintenance, the library will be closed on Sunday from 8:00 to 12:00.', '設備メンテナンスのため、図書館は日曜日 8:00-12:00 の間一時休館します。', '설비 점검으로 인해 도서관은 일요일 8:00-12:00 동안 임시 휴관합니다.', normalizedLocale)
  list[5][0].title = localizedMockText('春季校园招聘双选会报名开启', '春季校園招聘雙選會報名開啟', 'Spring campus job fair registration opens', '春の学内就職フェア申込開始', '봄 학내 채용 박람회 접수 시작', normalizedLocale)
  list[5][0].content = localizedMockText('双选会将于体育馆举行，报名截止至周四中午。', '雙選會將於體育館舉行，報名截止至週四中午。', 'The fair will be held in the gym. Registration closes at noon on Thursday.', '合同説明会は体育館で開催され、申込締切は木曜正午です。', '박람회는 체육관에서 열리며 접수 마감은 목요일 정오입니다.', normalizedLocale)
  list[5][1].title = localizedMockText('体育馆临时借用安排更新', '體育館臨時借用安排更新', 'Gym temporary booking arrangement updated', '体育館の臨時利用案内更新', '체육관 임시 대관 안내 업데이트', normalizedLocale)
  list[5][1].content = localizedMockText('本周末体育馆将优先保障校级活动，部分场地借用时间已调整。', '本週末體育館將優先保障校級活動，部分場地借用時間已調整。', 'This weekend the gym will prioritize school-level events, and some venue booking times have been adjusted.', '今週末は体育館が学内イベントを優先するため、一部会場の利用時間が変更されています。', '이번 주말 체육관은 교내 행사를 우선 지원하므로 일부 공간 대관 시간이 조정되었습니다.', normalizedLocale)
  return list
}

function getAnnouncementList(locale) {
  var normalizedLocale = i18n.normalizeLocale(locale || i18n.getCurrentLocale())
  var list = cloneMockValue(ANNOUNCEMENT_LIST)
  list[0].title = localizedMockText('系统维护通知', '系統維護通知', 'System maintenance notice', 'システムメンテナンスのお知らせ', '시스템 점검 안내', normalizedLocale)
  list[0].publishTime = localizedMockText('1小时前', '1小時前', '1 hr ago', '1時間前', '1시간 전', normalizedLocale)
  list[0].content = localizedMockText('为配合学期中服务器扩容，本周三 18:00 至 20:00 将进行例行维护。维护期间消息中心、校园社区和部分查询服务可能出现短暂不可用，建议提前保存正在编辑的内容。', '為配合學期中伺服器擴容，本週三 18:00 至 20:00 將進行例行維護。維護期間消息中心、校園社區和部分查詢服務可能出現短暫不可用，建議提前保存正在編輯的內容。', 'Routine maintenance will run this Wednesday from 18:00 to 20:00. During that time, the message center, campus community, and some query services may be briefly unavailable. Please save any content you are editing in advance.', '今週水曜日 18:00 から 20:00 まで定期メンテナンスを実施します。期間中はメッセージセンター、学内コミュニティ、一部照会機能が一時的に利用できない場合があります。編集中の内容は事前に保存してください。', '이번 주 수요일 18:00부터 20:00까지 정기 점검이 진행됩니다. 이 시간 동안 메시지 센터, 캠퍼스 커뮤니티, 일부 조회 서비스가 잠시 이용 불가할 수 있으니 작성 중인 내용은 미리 저장해 주세요.', normalizedLocale)
  list[1].title = localizedMockText('春季双选会入场安排', '春季雙選會入場安排', 'Spring job fair entry arrangement', '春の合同説明会の入場案内', '봄 채용 박람회 입장 안내', normalizedLocale)
  list[1].publishTime = localizedMockText('今天 09:10', '今天 09:10', 'Today 09:10', '今日 09:10', '오늘 09:10', normalizedLocale)
  list[1].content = localizedMockText('春季校园双选会将于本周五 14:30 在体育馆举行。请已报名同学提前准备校园卡，按学院分批入场，现场会同步开放企业岗位二维码与志愿者咨询台。', '春季校園雙選會將於本週五 14:30 在體育館舉行。請已報名同學提前準備校園卡，按學院分批入場，現場會同步開放企業崗位二維碼與志願者諮詢台。', 'The spring campus job fair will be held this Friday at 14:30 in the gym. Registered students should prepare their campus cards in advance and enter by college group. Employer QR codes and volunteer help desks will also be available on site.', '春の学内合同説明会は今週金曜日 14:30 から体育館で開催されます。参加申込済みの学生は学生証を準備し、学部ごとの案内に従って入場してください。会場では企業求人のQRコードとボランティア相談ブースも利用できます。', '봄 학내 채용 박람회가 이번 주 금요일 14:30에 체육관에서 열립니다. 신청한 학생은 학생증을 미리 준비하고 단과대별로 순서대로 입장해 주세요. 현장에서는 기업 채용 QR코드와 봉사자 안내 데스크도 운영됩니다.', normalizedLocale)
  list[2].title = localizedMockText('图书馆夜间开放时段调整', '圖書館夜間開放時段調整', 'Library evening hours updated', '図書館の夜間開館時間調整', '도서관 야간 운영 시간 조정', normalizedLocale)
  list[2].publishTime = localizedMockText('昨天', '昨天', 'Yesterday', '昨日', '어제', normalizedLocale)
  list[2].content = localizedMockText('从下周起，图书馆一楼自习区开放时间延长至 23:00，二楼研讨室仍需预约。若遇到插座、座位预约或入馆设备异常，可直接在资讯页提交反馈。', '從下週起，圖書館一樓自習區開放時間延長至 23:00，二樓研討室仍需預約。若遇到插座、座位預約或入館設備異常，可直接在資訊頁提交反饋。', 'Starting next week, the first-floor study area in the library will stay open until 23:00. Seminar rooms on the second floor still require reservations. If you run into outlet, seat reservation, or entry device issues, you can submit feedback directly from the info page.', '来週から、図書館1階の自習エリアは 23:00 まで開放されます。2階の討論室は引き続き予約が必要です。コンセント、座席予約、入館設備に不具合があれば、情報ページから直接フィードバックできます。', '다음 주부터 도서관 1층 자습 구역 운영 시간이 23:00까지 연장됩니다. 2층 세미나실은 계속 예약이 필요합니다. 콘센트, 좌석 예약, 출입 장비에 문제가 있으면 정보 페이지에서 바로 제보할 수 있습니다.', normalizedLocale)
  list[3].title = localizedMockText('校医院门诊排班更新', '校醫院門診排班更新', 'Campus clinic schedule update', '学内診療所の外来スケジュール更新', '교내 병원 외래 일정 업데이트', normalizedLocale)
  list[3].publishTime = localizedMockText('昨天 18:40', '昨天 18:40', 'Yesterday 18:40', '昨日 18:40', '어제 18:40', normalizedLocale)
  list[3].content = localizedMockText('校医院本周起调整晚间门诊排班，工作日 18:30 后优先接待急诊与发热相关问诊，普通门诊请尽量在白天时段前往。', '校醫院本週起調整晚間門診排班，工作日 18:30 後優先接待急診與發熱相關問診，普通門診請盡量在白天時段前往。', 'The campus clinic has adjusted its evening outpatient schedule starting this week. After 18:30 on weekdays, emergency cases and fever-related visits will be prioritized. For regular appointments, please try to visit during daytime hours.', '今週から学内診療所の夜間外来体制が調整されます。平日 18:30 以降は救急と発熱関連の受診が優先され、一般外来はできるだけ日中に来院してください。', '교내 병원이 이번 주부터 야간 외래 일정을 조정합니다. 평일 18:30 이후에는 응급 및 발열 관련 진료를 우선하며, 일반 진료는 가능한 주간에 방문해 주세요.', normalizedLocale)
  list[4].title = localizedMockText('宿舍门禁系统升级提醒', '宿舍門禁系統升級提醒', 'Dorm access system upgrade reminder', '寮の入退館システム更新のお知らせ', '기숙사 출입 시스템 업그레이드 안내', normalizedLocale)
  list[4].publishTime = localizedMockText('前天', '前天', '2 days ago', '一昨日', '그저께', normalizedLocale)
  list[4].content = localizedMockText('北区与中区宿舍门禁将于本周末夜间分批升级，升级期间刷卡开门可能存在短暂延迟，请提前留意楼栋群通知。', '北區與中區宿舍門禁將於本週末夜間分批升級，升級期間刷卡開門可能存在短暫延遲，請提前留意樓棟群通知。', 'Dorm access systems in the North and Central areas will be upgraded in batches this weekend at night. During the upgrade, there may be short delays when unlocking with campus cards. Please watch for notices from your dorm building group.', '北区と中区の寮の入退館システムは今週末の夜に順次アップグレードされます。期間中はカード開錠に少し遅れが出る可能性があるため、各寮グループの案内を確認してください。', '북구와 중구 기숙사 출입 시스템이 이번 주말 밤에 순차적으로 업그레이드됩니다. 업그레이드 중에는 카드 출입에 잠시 지연이 있을 수 있으니 각 동 공지를 미리 확인해 주세요.', normalizedLocale)
  list[5].title = localizedMockText('就业指导中心咨询时段开放', '就業指導中心諮詢時段開放', 'Career center consultation slots open', '就職支援センター相談枠の受付開始', '취업지원센터 상담 시간 오픈', normalizedLocale)
  list[5].content = localizedMockText('就业指导中心新增春招一对一简历咨询时段，已开放线上预约。需要模拟面试或简历修改的同学可在工作日预约。', '就業指導中心新增春招一對一簡歷諮詢時段，已開放線上預約。需要模擬面試或簡歷修改的同學可在工作日預約。', 'The career center has added one-on-one resume consultation slots for spring recruitment, and online booking is now open. Students who want mock interviews or resume reviews can make appointments on weekdays.', '就職支援センターでは春採用向けの1対1履歴書相談枠を追加し、オンライン予約を開始しました。模擬面接や履歴書添削が必要な学生は平日に予約できます。', '취업지원센터에서 봄 채용 대비 1:1 이력서 상담 시간을 새로 열었고 온라인 예약도 가능합니다. 모의 면접이나 이력서 첨삭이 필요한 학생은 평일에 예약할 수 있습니다.', normalizedLocale)
  return list
}

function getInteractionMessages(locale) {
  var normalizedLocale = i18n.normalizeLocale(locale || i18n.getCurrentLocale())
  var list = cloneMockValue(INTERACTION_MESSAGES)
  list[0].title = localizedMockText('卖室友互动', '賣室友互動', 'Dating interaction', 'ルームメイト通知', '룸메이트 알림', normalizedLocale)
  list[0].content = localizedMockText('你发出的卖室友申请已被对方查看，去看看最新状态。', '你發出的賣室友申請已被對方查看，去看看最新狀態。', 'The pick you sent has been viewed. Check the latest status.', '送信したピックは相手に確認されました。最新状態を確認しましょう。', '보낸 찔러보기가 상대에게 확인됐어요. 최신 상태를 확인해 보세요.', normalizedLocale)
  list[0].createdAt = localizedMockText('刚刚', '剛剛', 'Just now', 'たった今', '방금 전', normalizedLocale)
  list[1].title = localizedMockText('全民快递提醒', '全民快遞提醒', 'Errand reminder', '配送リマインダー', '심부름 알림', normalizedLocale)
  list[1].content = localizedMockText('你发布的订单已被接单，建议尽快和接单同学确认送达时间。', '你發布的訂單已被接單，建議盡快和接單同學確認送達時間。', 'Your order has been accepted. Confirm the delivery time with the student who picked it up.', '投稿した注文は受注されました。受注した学生と受け渡し時間を確認してください。', '게시한 주문이 접수됐어요. 맡은 학생과 전달 시간을 확인해 주세요.', normalizedLocale)
  list[1].createdAt = localizedMockText('6分钟前', '6分鐘前', '6 min ago', '6分前', '6분 전', normalizedLocale)
  list[2].title = localizedMockText('全民快递提醒', '全民快遞提醒', 'Errand reminder', '配送リマインダー', '심부름 알림', normalizedLocale)
  list[2].content = localizedMockText('你接的订单已完成，系统已同步为已完成状态。', '你接的訂單已完成，系統已同步為已完成狀態。', 'The order you accepted has been completed, and the system has synced it as completed.', '受注した注文は完了し、システム上でも完了状態に更新されました。', '수락한 주문이 완료되어 시스템에도 완료 상태로 반영됐습니다.', normalizedLocale)
  list[2].createdAt = localizedMockText('12分钟前', '12分鐘前', '12 min ago', '12分前', '12분 전', normalizedLocale)
  list[3].title = localizedMockText('树洞互动', '樹洞互動', 'Secret interaction', 'ツリーホール通知', '트리홀 알림', normalizedLocale)
  list[3].content = localizedMockText('有人回复了你的树洞，打开详情即可查看最新评论。', '有人回覆了你的樹洞，打開詳情即可查看最新評論。', 'Someone replied to your secret. Open the detail page to read the latest comment.', 'あなたのツリーホールに返信がありました。詳細を開くと最新コメントを確認できます。', '당신의 트리홀에 답글이 달렸어요. 상세 화면에서 최신 댓글을 확인할 수 있습니다.', normalizedLocale)
  list[3].createdAt = localizedMockText('10分钟前', '10分鐘前', '10 min ago', '10分前', '10분 전', normalizedLocale)
  list[4].title = localizedMockText('表白墙互动', '表白牆互動', 'Confession wall interaction', '告白ウォール通知', '고백 게시판 알림', normalizedLocale)
  list[4].content = localizedMockText('有人给你的表白留了言，打开详情即可查看最新评论。', '有人給你的表白留了言，打開詳情即可查看最新評論。', 'Someone left a comment on your confession. Open the detail page to read the latest comment.', 'あなたの告白にコメントが付きました。詳細を開くと最新コメントを確認できます。', '당신의 고백 글에 댓글이 달렸어요. 상세 화면에서 최신 댓글을 확인할 수 있습니다.', normalizedLocale)
  list[4].createdAt = localizedMockText('14分钟前', '14分鐘前', '14 min ago', '14分前', '14분 전', normalizedLocale)
  list[5].title = localizedMockText('表白墙互动', '表白牆互動', 'Confession wall interaction', '告白ウォール通知', '고백 게시판 알림', normalizedLocale)
  list[5].content = localizedMockText('有人参与了你的猜名字互动，去看看最新猜测次数。', '有人參與了你的猜名字互動，去看看最新猜測次數。', 'Someone joined your name-guessing interaction. Check the latest guess count.', '誰かが名前当てに参加しました。最新の推測回数を確認してみましょう。', '누군가 이름 맞히기 상호작용에 참여했어요. 최신 추측 횟수를 확인해 보세요.', normalizedLocale)
  list[5].createdAt = localizedMockText('18分钟前', '18分鐘前', '18 min ago', '18分前', '18분 전', normalizedLocale)
  list[6].title = localizedMockText('话题互动', '話題互動', 'Topic interaction', 'トピック通知', '토픽 알림', normalizedLocale)
  list[6].content = localizedMockText('你的话题收到了新的点赞。', '你的話題收到了新的點讚。', 'Your topic received a new like.', 'あなたのトピックに新しいいいねが付きました。', '당신의 토픽에 새로운 좋아요가 달렸어요.', normalizedLocale)
  list[6].createdAt = localizedMockText('25分钟前', '25分鐘前', '25 min ago', '25分前', '25분 전', normalizedLocale)
  list[7].title = localizedMockText('拍好校园互动', '拍好校園互動', 'Photo interaction', '写真通知', '사진 알림', normalizedLocale)
  list[7].content = localizedMockText('有人评论了你的作品，打开详情即可查看最新评论。', '有人評論了你的作品，打開詳情即可查看最新評論。', 'Someone commented on your work. Open the detail page to read the latest comment.', 'あなたの作品にコメントが付きました。詳細を開くと最新コメントを確認できます。', '당신의 작품에 댓글이 달렸어요. 상세 화면에서 최신 댓글을 확인할 수 있습니다.', normalizedLocale)
  list[7].createdAt = localizedMockText('40分钟前', '40分鐘前', '40 min ago', '40分前', '40분 전', normalizedLocale)
  return list
}

function getYellowPageResult(locale) {
  var normalizedLocale = i18n.normalizeLocale(locale || i18n.getCurrentLocale())
  var result = cloneMockValue(YELLOW_PAGE_RESULT)
  result.type[0].typeName = localizedMockText('教务服务', '教務服務', 'Academic Services', '教務サービス', '학사 서비스', normalizedLocale)
  result.type[1].typeName = localizedMockText('后勤服务', '後勤服務', 'Logistics Services', '後方支援サービス', '생활 지원 서비스', normalizedLocale)
  result.type[2].typeName = localizedMockText('学生服务', '學生服務', 'Student Services', '学生サービス', '학생 서비스', normalizedLocale)
  result.type[3].typeName = localizedMockText('图书与网络', '圖書與網路', 'Library & Network', '図書とネットワーク', '도서관 및 네트워크', normalizedLocale)
  result.data[0].section = localizedMockText('教务处值班室', '教務處值班室', 'Academic Affairs Duty Office', '教務課当直室', '교무처 당직실', normalizedLocale)
  result.data[0].address = localizedMockText('示例楼栋 302', '示例樓棟 302', 'Example Building 302', 'サンプル棟302', '예시 건물 302호', normalizedLocale)
  result.data[1].section = localizedMockText('考务办公室', '考務辦公室', 'Exam Office', '試験事務室', '시험 사무실', normalizedLocale)
  result.data[1].address = localizedMockText('示例楼栋 306', '示例樓棟 306', 'Example Building 306', 'サンプル棟306', '예시 건물 306호', normalizedLocale)
  result.data[2].section = localizedMockText('宿舍报修', '宿舍報修', 'Dorm Repair', '寮修理受付', '기숙사 수리 접수', normalizedLocale)
  result.data[2].address = localizedMockText('示例后勤楼 1 层', '示例後勤樓 1 層', 'Example Logistics Building 1F', 'サンプル後勤棟1階', '예시 후생동 1층', normalizedLocale)
  result.data[3].section = localizedMockText('校园保卫处', '校園保衛處', 'Campus Security Office', '学内保安室', '캠퍼스 보안실', normalizedLocale)
  result.data[3].address = localizedMockText('示例值班室', '示例值班室', 'Example Duty Room', 'サンプル当直室', '예시 당직실', normalizedLocale)
  result.data[4].section = localizedMockText('学生工作部', '學生工作部', 'Student Affairs Office', '学生支援部', '학생처', normalizedLocale)
  result.data[4].address = localizedMockText('示例楼栋 201', '示例樓棟 201', 'Example Building 201', 'サンプル棟201', '예시 건물 201호', normalizedLocale)
  result.data[5].section = localizedMockText('就业指导中心', '就業指導中心', 'Career Center', '就職支援センター', '취업지원센터', normalizedLocale)
  result.data[5].address = localizedMockText('示例服务楼', '示例服務樓', 'Example Service Building', 'サンプルサービス棟', '예시 서비스관', normalizedLocale)
  result.data[6].section = localizedMockText('图书馆总服务台', '圖書館總服務台', 'Library Service Desk', '図書館総合カウンター', '도서관 안내 데스크', normalizedLocale)
  result.data[6].address = localizedMockText('示例图书馆 1 层', '示例圖書館 1 層', 'Example Library 1F', 'サンプル図書館1階', '예시 도서관 1층', normalizedLocale)
  result.data[7].section = localizedMockText('网络信息中心', '網路信息中心', 'Network Information Center', 'ネットワーク情報センター', '네트워크 정보센터', normalizedLocale)
  result.data[7].address = localizedMockText('示例信息楼 402', '示例信息樓 402', 'Example Information Building 402', 'サンプル情報棟402', '예시 정보관 402호', normalizedLocale)
  return result
}

function getSpareRooms(locale) {
  var normalizedLocale = i18n.normalizeLocale(locale || i18n.getCurrentLocale())
  var list = cloneMockValue(SPARE_ROOMS)
  list[0].name = localizedMockText('教学楼 A201', '教學樓 A201', 'Teaching Building A201', '講義棟 A201', '강의동 A201', normalizedLocale)
  list[0].type = localizedMockText('多媒体课室', '多媒體課室', 'Multimedia Room', 'マルチメディア教室', '멀티미디어 강의실', normalizedLocale)
  list[0].zone = localizedMockText('海珠校区', '海珠校區', 'Haizhu Campus', '海珠キャンパス', '하이주 캠퍼스', normalizedLocale)
  list[0].section = localizedMockText('第 1-2 节', '第 1-2 節', 'Sections 1-2', '1-2限', '1-2교시', normalizedLocale)
  list[1].name = localizedMockText('教学楼 B305', '教學樓 B305', 'Teaching Building B305', '講義棟 B305', '강의동 B305', normalizedLocale)
  list[1].type = localizedMockText('普通课室', '普通課室', 'Standard Classroom', '普通教室', '일반 강의실', normalizedLocale)
  list[1].zone = localizedMockText('海珠校区', '海珠校區', 'Haizhu Campus', '海珠キャンパス', '하이주 캠퍼스', normalizedLocale)
  list[1].section = localizedMockText('第 1-2 节', '第 1-2 節', 'Sections 1-2', '1-2限', '1-2교시', normalizedLocale)
  list[2].name = localizedMockText('实验楼 E402', '實驗樓 E402', 'Lab Building E402', '実験棟 E402', '실험동 E402', normalizedLocale)
  list[2].type = localizedMockText('机房', '機房', 'Computer Lab', 'PCルーム', '전산실', normalizedLocale)
  list[2].zone = localizedMockText('海珠校区', '海珠校區', 'Haizhu Campus', '海珠キャンパス', '하이주 캠퍼스', normalizedLocale)
  list[2].section = localizedMockText('第 1-2 节', '第 1-2 節', 'Sections 1-2', '1-2限', '1-2교시', normalizedLocale)
  return list
}

function normalizeCardLostState(value) {
  var rawValue = String(value || '').trim()
  if (rawValue === 'lost' || rawValue === '已挂失' || rawValue === '已掛失') return 'lost'
  return 'normal'
}

function getCardLostStateLabel(stateKey, locale) {
  return normalizeCardLostState(stateKey) === 'lost'
    ? localizedMockText('已挂失', '已掛失', 'Reported Lost', '紛失届出済み', '분실 신고됨', locale)
    : localizedMockText('正常', '正常', 'Normal', '正常', '정상', locale)
}

function getCardFreezeStateLabel(locale) {
  return localizedMockText('正常', '正常', 'Normal', '正常', '정상', locale)
}

module.exports = {
  MOCK_ACCOUNT_DATA: MOCK_ACCOUNT_DATA,
  get BASE_PROFILE() { return buildBaseProfile() },
  buildBaseProfile: buildBaseProfile,
  localizedProfileText: localizedProfileText,
  localizedMockText: localizedMockText,
  GRADE_REPORTS: GRADE_REPORTS,
  getGradeReports: getGradeReports,
  SCHEDULE_TEMPLATE: SCHEDULE_TEMPLATE,
  getScheduleTemplate: getScheduleTemplate,
  CARD_TRANSACTIONS: CARD_TRANSACTIONS,
  getCardTransactions: getCardTransactions,
  COLLECTION_ITEMS: COLLECTION_ITEMS,
  getCollectionItems: getCollectionItems,
  COLLECTION_DETAILS: COLLECTION_DETAILS,
  getCollectionDetails: getCollectionDetails,
  DEFAULT_BORROWED_BOOKS: DEFAULT_BORROWED_BOOKS,
  getDefaultBorrowedBooks: getDefaultBorrowedBooks,
  NEWS_BY_TYPE: NEWS_BY_TYPE,
  getNewsByType: getNewsByType,
  ANNOUNCEMENT_LIST: ANNOUNCEMENT_LIST,
  getAnnouncementList: getAnnouncementList,
  INTERACTION_MESSAGES: INTERACTION_MESSAGES,
  getInteractionMessages: getInteractionMessages,
  YELLOW_PAGE_RESULT: YELLOW_PAGE_RESULT,
  getYellowPageResult: getYellowPageResult,
  SPARE_ROOMS: SPARE_ROOMS,
  getSpareRooms: getSpareRooms,
  normalizeCardLostState: normalizeCardLostState,
  getCardLostStateLabel: getCardLostStateLabel,
  getCardFreezeStateLabel: getCardFreezeStateLabel
}
