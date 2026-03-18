var data = require('./mock-data.js')

function handleAnnouncementList(token, path, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var matched = /^\/api\/announcement\/start\/(\d+)\/size\/(\d+)$/.exec(path)
  var start = matched ? Number(matched[1]) : 0
  var size = matched ? Number(matched[2]) : 10
  return utils.resolveWithDelay(utils.buildSuccess(data.ANNOUNCEMENT_LIST.slice(start, start + size)))
}

function handleInteractionList(token, path, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  var matched = /^\/api\/message\/interaction\/start\/(\d+)\/size\/(\d+)$/.exec(path)
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

  var messageId = /^\/api\/message\/id\/(.+)\/read$/.exec(path)
  if (!messageId) {
    return utils.rejectWithMessage('消息不存在')
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
  handleInteractionList: handleInteractionList,
  handleUnreadCount: handleUnreadCount,
  handleMessageRead: handleMessageRead,
  handleMessageReadAll: handleMessageReadAll
}
