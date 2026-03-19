var data = require('./mock-data.js')

function handleNews(path, utils) {
  var matched = /^\/api\/news\/type\/(\d+)\/start\/(\d+)\/size\/(\d+)$/.exec(path)
  if (!matched) {
    return utils.rejectWithMessage('未匹配到新闻接口')
  }

  var type = Number(matched[1])
  var start = Number(matched[2])
  var size = Number(matched[3])
  var list = data.NEWS_BY_TYPE[type] || []
  return utils.resolveWithDelay(utils.buildSuccess(list.slice(start, start + size)))
}

function handleElectricFees(payload, utils) {
  var name = String(payload.name || '').trim()
  var number = String(payload.number || '').trim()
  var year = Number(payload.year)

  if (!name || !number) {
    return utils.rejectWithMessage('请完整填写姓名和学号')
  }

  return utils.resolveWithDelay(utils.buildSuccess({
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

function handleYellowPage(utils) {
  return utils.resolveWithDelay(utils.buildSuccess(utils.cloneValue(data.YELLOW_PAGE_RESULT)))
}

function handleGraduateExam(payload, utils) {
  if (!String(payload.name || '').trim() || !String(payload.examNumber || '').trim() || !String(payload.idNumber || '').trim()) {
    return utils.rejectWithMessage('请完整填写考研查询信息')
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
  handleElectricFees: handleElectricFees,
  handleYellowPage: handleYellowPage,
  handleGraduateExam: handleGraduateExam,
  handleModuleStateDetail: handleModuleStateDetail
}
