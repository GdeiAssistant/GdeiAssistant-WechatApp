var data = require('./mock-data.js')

function buildBorrowedBooks(state) {
  return data.getDefaultBorrowedBooks().map(function(item) {
    var renewedTimes = state.renewedBookCodes.indexOf(item.code) !== -1 ? item.renewTime + 1 : item.renewTime
    return Object.assign({}, item, {
      renewTime: renewedTimes,
      returnDate: state.renewedBookCodes.indexOf(item.code) !== -1 ? '2026-04-05' : item.returnDate
    })
  })
}

function queryCollectionList(keyword) {
  var items = data.getCollectionItems()
  var normalizedKeyword = String(keyword || '').trim().toLowerCase()
  if (!normalizedKeyword) {
    return items
  }

  return items.filter(function(item) {
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
  var gradeReports = data.getGradeReports(utils.currentLocale && utils.currentLocale())
  var report = gradeReports.filter(function(item) {
    return item.year === requestedYear
  })[0] || gradeReports[0]

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
    scheduleList: utils.cloneValue(data.getScheduleTemplate(utils.currentLocale && utils.currentLocale()))
  }))
}

function handleCardInfo(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var state = utils.readState()
  var locale = utils.currentLocale && utils.currentLocale()
  var profile = data.buildBaseProfile(locale)
  return utils.resolveWithDelay(utils.buildSuccess({
    name: profile.nickname,
    number: '20231234567',
    cardBalance: '128.50',
    cardInterimBalance: '0.00',
    cardNumber: '6217000012345678',
    cardLostState: data.getCardLostStateLabel(state.cardLostState, locale),
    cardFreezeState: data.getCardFreezeStateLabel(locale)
  }))
}

function handleCardQuery(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  return utils.resolveWithDelay(utils.buildSuccess({
    cardList: utils.cloneValue(data.getCardTransactions(utils.currentLocale && utils.currentLocale()))
  }))
}

function handleCardLost(token, query, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var cardPassword = String(query.cardPassword || '').trim()
  if (!/^\d{6}$/.test(cardPassword)) {
    return utils.rejectWithMessage(data.localizedMockText('请输入正确的校园卡查询密码', '請輸入正確的校園卡查詢密碼', 'Please enter the correct campus card query password', '正しいキャンパスカード照会パスワードを入力してください', '올바른 캠퍼스카드 조회 비밀번호를 입력해 주세요', utils.currentLocale && utils.currentLocale()))
  }

  if (cardPassword !== '246810') {
    return utils.rejectWithMessage(data.localizedMockText('模拟挂失失败：校园卡查询密码不正确', '模擬掛失失敗：校園卡查詢密碼不正確', 'Mock loss report failed: incorrect campus card query password', '模擬紛失届の送信に失敗しました: キャンパスカード照会パスワードが正しくありません', '모의 분실신고 실패: 캠퍼스카드 조회 비밀번호가 올바르지 않습니다', utils.currentLocale && utils.currentLocale()))
  }

  var state = utils.readState()
  state.cardLostState = 'lost'
  utils.writeState(state)
  return utils.resolveWithDelay(utils.buildSuccess(null))
}

function handleBookBorrow(token, query, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var password = String(query.password || '').trim()
  if (!password) {
    return utils.rejectWithMessage(data.localizedMockText('请输入图书馆密码后再查询借阅', '請輸入圖書館密碼後再查詢借閱', 'Please enter the library password before checking borrowing records', '貸出状況を確認する前に図書館パスワードを入力してください', '대출 현황을 조회하기 전에 도서관 비밀번호를 입력해 주세요', utils.currentLocale && utils.currentLocale()))
  }

  if (password !== 'library123' && password !== '123456') {
    return utils.rejectWithMessage(data.localizedMockText('图书馆密码不正确', '圖書館密碼不正確', 'Incorrect library password', '図書館パスワードが正しくありません', '도서관 비밀번호가 올바르지 않습니다', utils.currentLocale && utils.currentLocale()))
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
    return utils.rejectWithMessage(data.localizedMockText('请输入图书馆密码', '請輸入圖書館密碼', 'Please enter the library password', '図書館パスワードを入力してください', '도서관 비밀번호를 입력해 주세요', utils.currentLocale && utils.currentLocale()))
  }

  if (password !== 'library123' && password !== '123456') {
    return utils.rejectWithMessage(data.localizedMockText('模拟续借失败：图书馆密码不正确', '模擬續借失敗：圖書館密碼不正確', 'Mock renewal failed: incorrect library password', '模擬延長貸出に失敗しました: 図書館パスワードが正しくありません', '모의 연장 실패: 도서관 비밀번호가 올바르지 않습니다', utils.currentLocale && utils.currentLocale()))
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
  var details = data.getCollectionDetails(utils.currentLocale && utils.currentLocale())
  var detail = details[detailUrl] || details.detail_swiftui
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
    return utils.rejectWithMessage(data.localizedMockText('准考证号必须为15位数字', '準考證號必須為15位數字', 'Admission ticket number must be 15 digits', '受験票番号は15桁で入力してください', '수험표 번호는 15자리 숫자여야 합니다', utils.currentLocale && utils.currentLocale()))
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
    return utils.rejectWithMessage(data.localizedMockText('模拟查询失败：验证码错误', '模擬查詢失敗：驗證碼錯誤', 'Mock query failed: incorrect captcha', '模擬照会に失敗しました: 認証コードが正しくありません', '모의 조회 실패: 인증 코드가 올바르지 않습니다', utils.currentLocale && utils.currentLocale()))
  }

  var locale = utils.currentLocale && utils.currentLocale()
  return utils.resolveWithDelay(utils.buildSuccess({
    name: String(query.name || '').trim() || data.buildBaseProfile(locale).nickname,
    school: data.localizedMockText('广东第二师范学院', '廣東第二師範學院', 'Guangdong University of Education', '広東第二師範学院', '광둥교육대학교', locale),
    type: data.localizedMockText('英语六级', '英語六級', 'CET-6', '英語六級', '영어 6급', locale),
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

  return utils.resolveWithDelay(utils.buildSuccess(utils.cloneValue(data.getSpareRooms(utils.currentLocale && utils.currentLocale()))))
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
