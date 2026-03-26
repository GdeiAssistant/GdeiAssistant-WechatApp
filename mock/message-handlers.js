var data = require('./mock-data.js')

function handleAnnouncementList(token, path, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var matched = /^\/api\/information\/announcement\/start\/(\d+)\/size\/(\d+)$/.exec(path)
  var start = matched ? Number(matched[1]) : 0
  var size = matched ? Number(matched[2]) : 10
  var announcements = data.getAnnouncementList(utils.currentLocale && utils.currentLocale())
  return utils.resolveWithDelay(utils.buildSuccess(announcements.slice(start, start + size)))
}

function handleAnnouncementDetail(token, path, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var matched = /^\/api\/information\/announcement\/id\/(.+)$/.exec(path)
  var targetId = matched ? matched[1] : ''
  var detail = data.getAnnouncementList(utils.currentLocale && utils.currentLocale()).filter(function(item) {
    return item.id === targetId
  })[0]

  if (!detail) {
    return utils.rejectWithMessage(data.localizedMockText('系统通知不存在', '系統通知不存在', 'System notification not found', 'システム通知が見つかりません', '시스템 알림을 찾을 수 없습니다', utils.currentLocale && utils.currentLocale()))
  }

  return utils.resolveWithDelay(utils.buildSuccess(detail))
}

function handleInteractionList(token, path, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var matched = /^\/api\/information\/message\/interaction\/start\/(\d+)\/size\/(\d+)$/.exec(path)
  var start = matched ? Number(matched[1]) : 0
  var size = matched ? Number(matched[2]) : 20
  var state = utils.readState()
  return utils.resolveWithDelay(utils.buildSuccess(state.interactionMessages.slice(start, start + size)))
}

function handleUnreadCount(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var state = utils.readState()
  var unreadCount = state.interactionMessages.filter(function(item) {
    return !item.isRead
  }).length
  return utils.resolveWithDelay(utils.buildSuccess(unreadCount))
}

function handleMessageRead(token, path, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var messageId = /^\/api\/information\/message\/id\/(.+)\/read$/.exec(path)
  if (!messageId) {
    return utils.rejectWithMessage(data.localizedMockText('消息不存在', '消息不存在', 'Message not found', 'メッセージが見つかりません', '메시지를 찾을 수 없습니다', utils.currentLocale && utils.currentLocale()))
  }

  var nextState = utils.readState()
  nextState.interactionMessages = nextState.interactionMessages.map(function(item) {
    if (item.id === messageId[1]) {
      return Object.assign({}, item, { isRead: true })
    }
    return item
  })
  utils.writeState(nextState)
  return utils.resolveWithDelay(utils.buildSuccess(null))
}

function handleMessageReadAll(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var nextState = utils.readState()
  nextState.interactionMessages = nextState.interactionMessages.map(function(item) {
    return Object.assign({}, item, { isRead: true })
  })
  utils.writeState(nextState)
  return utils.resolveWithDelay(utils.buildSuccess(null))
}

module.exports = {
  handleAnnouncementList: handleAnnouncementList,
  handleAnnouncementDetail: handleAnnouncementDetail,
  handleInteractionList: handleInteractionList,
  handleUnreadCount: handleUnreadCount,
  handleMessageRead: handleMessageRead,
  handleMessageReadAll: handleMessageReadAll
}
