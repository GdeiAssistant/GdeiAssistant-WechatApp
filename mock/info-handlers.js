var data = require('./mock-data.js')

function handleNews(path, utils) {
  var matched = /^\/api\/information\/news\/type\/(\d+)\/start\/(\d+)\/size\/(\d+)$/.exec(path)
  if (!matched) {
    return utils.rejectWithMessage(data.localizedMockText('未匹配到新闻接口', '未匹配到新聞接口', 'News endpoint did not match', 'ニュースAPIに一致しませんでした', '뉴스 엔드포인트가 일치하지 않습니다', utils.currentLocale && utils.currentLocale()))
  }

  var type = Number(matched[1])
  var start = Number(matched[2])
  var size = Number(matched[3])
  var newsByType = data.getNewsByType(utils.currentLocale && utils.currentLocale())
  var list = newsByType[type] || []
  return utils.resolveWithDelay(utils.buildSuccess(list.slice(start, start + size)))
}

function handleNewsDetail(path, utils) {
  var matched = /^\/api\/information\/news\/id\/(.+)$/.exec(path)
  if (!matched) {
    return utils.rejectWithMessage(data.localizedMockText('未匹配到新闻详情接口', '未匹配到新聞詳情接口', 'News detail endpoint did not match', 'ニュース詳細APIに一致しませんでした', '뉴스 상세 엔드포인트가 일치하지 않습니다', utils.currentLocale && utils.currentLocale()))
  }

  var targetId = matched[1]
  var found = null
  var newsByType = data.getNewsByType(utils.currentLocale && utils.currentLocale())

  Object.keys(newsByType).some(function(type) {
    found = (newsByType[type] || []).filter(function(item) {
      return item.id === targetId
    })[0] || null
    return !!found
  })

  if (!found) {
    return utils.rejectWithMessage(data.localizedMockText('新闻通知不存在', '新聞通知不存在', 'News item not found', 'ニュースが見つかりません', '뉴스 항목을 찾을 수 없습니다', utils.currentLocale && utils.currentLocale()))
  }

  return utils.resolveWithDelay(utils.buildSuccess(found))
}

function handleElectricFees(payload, utils) {
  var name = String(payload.name || '').trim()
  var number = String(payload.number || '').trim()
  var year = Number(payload.year)

  if (!name || !number) {
    return utils.rejectWithMessage(data.localizedMockText('请完整填写姓名和学号', '請完整填寫姓名和學號', 'Please fill in both name and student number', '氏名と学籍番号を入力してください', '이름과 학번을 모두 입력해 주세요', utils.currentLocale && utils.currentLocale()))
  }

  var locale = utils.currentLocale && utils.currentLocale()
  return utils.resolveWithDelay(utils.buildSuccess({
    year: year || 2026,
    buildingNumber: data.localizedMockText('11 栋', '11 棟', 'Building 11', '11棟', '11동', locale),
    roomNumber: 503,
    peopleNumber: 4,
    department: data.localizedMockText('信息工程学院', '信息工程學院', 'School of Information Engineering', '情報工学部', '정보공학대학', locale),
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

function handleYellowPage(utils) {
  return utils.resolveWithDelay(utils.buildSuccess(utils.cloneValue(data.getYellowPageResult(utils.currentLocale && utils.currentLocale()))))
}

function handleGraduateExam(payload, utils) {
  if (!String(payload.name || '').trim() || !String(payload.examNumber || '').trim() || !String(payload.idNumber || '').trim()) {
    return utils.rejectWithMessage(data.localizedMockText('请完整填写考研查询信息', '請完整填寫考研查詢信息', 'Please complete all graduate exam query fields', '大学院試験照会情報をすべて入力してください', '대학원 시험 조회 정보를 모두 입력해 주세요', utils.currentLocale && utils.currentLocale()))
  }

  return utils.resolveWithDelay(utils.buildSuccess({
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

function handleModuleStateDetail(utils) {
  return utils.resolveWithDelay(utils.buildSuccess({
    extension: {
      EMAIL: true,
      ENCRYPTION: true,
      ALIYUN_API: true,
      ALIYUN_SMS: true,
      JWT: true,
      NEWS: true,
      REPLAY_ATTACKS_VALIDATE: true
    },
    core: {
      MYSQL: true,
      MONGODB: true,
      REDIS: true
    }
  }))
}

module.exports = {
  handleNews: handleNews,
  handleNewsDetail: handleNewsDetail,
  handleElectricFees: handleElectricFees,
  handleYellowPage: handleYellowPage,
  handleGraduateExam: handleGraduateExam,
  handleModuleStateDetail: handleModuleStateDetail
}
