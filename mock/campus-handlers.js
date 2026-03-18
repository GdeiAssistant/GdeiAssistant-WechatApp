var data = require('./mock-data.js')

function buildBorrowedBooks(state) {
  return data.DEFAULT_BORROWED_BOOKS.map(function(item) {
    var renewedTimes = state.renewedBookCodes.indexOf(item.code) !== -1 ? item.renewTime + 1 : item.renewTime
    return Object.assign({}, item, {
      renewTime: renewedTimes,
      returnDate: state.renewedBookCodes.indexOf(item.code) !== -1 ? '2026-04-05' : item.returnDate
    })
  })
}

function queryCollectionList(keyword) {
  var normalizedKeyword = String(keyword || '').trim().toLowerCase()
  if (!normalizedKeyword) {
    return data.COLLECTION_ITEMS
  }

  return data.COLLECTION_ITEMS.filter(function(item) {
    return item.bookname.toLowerCase().indexOf(normalizedKeyword) !== -1 ||
      item.author.toLowerCase().indexOf(normalizedKeyword) !== -1
  })
}

function handleGrade(token, query, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var requestedYear = query && query.year !== undefined ? Number(query.year) : NaN
  var report = data.GRADE_REPORTS.filter(function(item) {
    return item.year === requestedYear
  })[0] || data.GRADE_REPORTS[0]

  return utils.resolveWithDelay(utils.buildSuccess(report))
}

function handleSchedule(token, query, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var week = query && query.week ? Number(query.week) : 5
  return utils.resolveWithDelay(utils.buildSuccess({
    week: week,
    scheduleList: utils.cloneValue(data.SCHEDULE_TEMPLATE)
  }))
}

function handleCardInfo(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var state = utils.readState()
  return utils.resolveWithDelay(utils.buildSuccess({
    name: '林知远',
    number: '20231234567',
    cardBalance: '128.50',
    cardInterimBalance: '0.00',
    cardNumber: '6217000012345678',
    cardLostState: state.cardLostState,
    cardFreezeState: '正常'
  }))
}

function handleCardQuery(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  return utils.resolveWithDelay(utils.buildSuccess({
    cardList: utils.cloneValue(data.CARD_TRANSACTIONS)
  }))
}

function handleCardLost(token, query, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var cardPassword = String(query.cardPassword || '').trim()
  if (!/^\d{6}$/.test(cardPassword)) {
    return utils.rejectWithMessage('请输入正确的校园卡查询密码')
  }

  if (cardPassword !== '246810') {
    return utils.rejectWithMessage('模拟挂失失败：校园卡查询密码不正确')
  }

  var state = utils.readState()
  state.cardLostState = '已挂失'
  utils.writeState(state)
  return utils.resolveWithDelay(utils.buildSuccess(null))
}

function handleBookBorrow(token, query, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var password = String(query.password || '').trim()
  if (password && password !== 'library123' && password !== '123456') {
    return utils.rejectWithMessage('图书馆密码不正确')
  }

  return utils.resolveWithDelay(utils.buildSuccess(buildBorrowedBooks(utils.readState())))
}

function handleBookRenew(token, payload, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var password = String(payload.password || '').trim()
  if (!password) {
    return utils.rejectWithMessage('请输入图书馆密码')
  }

  if (password !== 'library123') {
    return utils.rejectWithMessage('模拟续借失败：图书馆密码不正确')
  }

  var state = utils.readState()
  if (payload.code) {
    state.renewedBookCodes = state.renewedBookCodes.concat([payload.code]).filter(function(item, index, list) {
      return list.indexOf(item) === index
    })
    utils.writeState(state)
  }
  return utils.resolveWithDelay(utils.buildSuccess(null))
}

function handleCollectionBorrow(token, query, utils) {
  return handleBookBorrow(token, query, utils)
}

function handleCollectionRenew(token, query, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var state = utils.readState()
  if (query.code) {
    state.renewedBookCodes = state.renewedBookCodes.concat([query.code]).filter(function(item, index, list) {
      return list.indexOf(item) === index
    })
    utils.writeState(state)
  }
  return utils.resolveWithDelay(utils.buildSuccess(null))
}

function handleCollectionSearch(query, utils) {
  var resultList = queryCollectionList(query.keyword)
  return utils.resolveWithDelay(utils.buildSuccess({
    collectionList: resultList,
    sumPage: resultList.length > 0 ? 1 : 0
  }))
}

function handleCollectionDetail(query, utils) {
  var detailUrl = String(query.detailURL || '').trim()
  var detail = data.COLLECTION_DETAILS[detailUrl] || data.COLLECTION_DETAILS.detail_swiftui
  return utils.resolveWithDelay(utils.buildSuccess(detail))
}

function handleCetNumberGet(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var state = utils.readState()
  return utils.resolveWithDelay(utils.buildSuccess({
    number: state.savedCetNumber,
    name: state.savedCetName
  }))
}

function handleCetNumberSave(token, payload, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var number = String(payload.number || '').trim()
  var name = String(payload.name || '').trim()

  if (!/^\d{15}$/.test(number)) {
    return utils.rejectWithMessage('准考证号必须为15位数字')
  }

  var state = utils.readState()
  state.savedCetNumber = number
  state.savedCetName = name
  utils.writeState(state)
  return utils.resolveWithDelay(utils.buildSuccess(null))
}

function handleCetQuery(token, query, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var checkcode = String(query.checkcode || '').trim().toLowerCase()
  if (checkcode !== 'gd26' && checkcode !== '1234') {
    return utils.rejectWithMessage('模拟查询失败：验证码错误')
  }

  return utils.resolveWithDelay(utils.buildSuccess({
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

function handleEvaluateSubmit(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  return utils.resolveWithDelay(utils.buildSuccess(null))
}

function handleSpareRoom(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  return utils.resolveWithDelay(utils.buildSuccess(utils.cloneValue(data.SPARE_ROOMS)))
}

module.exports = {
  handleGrade: handleGrade,
  handleSchedule: handleSchedule,
  handleCardInfo: handleCardInfo,
  handleCardQuery: handleCardQuery,
  handleCardLost: handleCardLost,
  handleBookBorrow: handleBookBorrow,
  handleBookRenew: handleBookRenew,
  handleCollectionBorrow: handleCollectionBorrow,
  handleCollectionRenew: handleCollectionRenew,
  handleCollectionSearch: handleCollectionSearch,
  handleCollectionDetail: handleCollectionDetail,
  handleCetNumberGet: handleCetNumberGet,
  handleCetNumberSave: handleCetNumberSave,
  handleCetQuery: handleCetQuery,
  handleEvaluateSubmit: handleEvaluateSubmit,
  handleSpareRoom: handleSpareRoom
}
