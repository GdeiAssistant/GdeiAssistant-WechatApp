var socialData = require('./social-data.js')
var i18n = require('../utils/i18n.js')

var DM_POLICIES = {
  ALL: 'ALL',
  FOLLOWING: 'FOLLOWING',
  MUTUAL: 'MUTUAL',
  NONE: 'NONE'
}

function rejectBusiness(utils, message, errorCode, statusCode) {
  var error = new Error(message)
  error.message = message
  error.statusCode = statusCode || 400
  error.errorCode = errorCode || 'INVALID_REQUEST'
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      reject(error)
    }, 180)
  })
}

function ensureSocialState(utils) {
  var state = utils.readState()
  if (!state.social || typeof state.social !== 'object') {
    state.social = socialData.createDefaultSocialState()
    utils.writeState(state)
  }
  return state
}

function writeSocial(utils, state) {
  utils.writeState(state)
}

function findUser(state, id) {
  return (state.social.users || []).filter(function (item) {
    return item.id === id
  })[0]
}

function isBlockedEither(state, a, b) {
  return (state.social.blocks || []).some(function (item) {
    return (
      (item.blockerId === a && item.blockedId === b) ||
      (item.blockerId === b && item.blockedId === a)
    )
  })
}

function isFollowing(state, followerId, followeeId) {
  return (state.social.follows || []).some(function (item) {
    return item.followerId === followerId && item.followeeId === followeeId
  })
}

function countFollowing(state, userId) {
  return (state.social.follows || []).filter(function (item) {
    return (
      item.followerId === userId &&
      findUser(state, item.followeeId) &&
      findUser(state, item.followeeId).status === 'ACTIVE'
    )
  }).length
}

function countFollowers(state, userId) {
  return (state.social.follows || []).filter(function (item) {
    return (
      item.followeeId === userId &&
      findUser(state, item.followerId) &&
      findUser(state, item.followerId).status === 'ACTIVE'
    )
  }).length
}

function countFriends(state, userId) {
  var followingIds = {}
  ;(state.social.follows || []).forEach(function (item) {
    if (item.followerId === userId) {
      followingIds[item.followeeId] = true
    }
  })
  return (state.social.follows || []).filter(function (item) {
    return (
      item.followeeId === userId &&
      followingIds[item.followerId] &&
      findUser(state, item.followerId) &&
      findUser(state, item.followerId).status === 'ACTIVE'
    )
  }).length
}

function relationshipOf(state, viewerId, targetId) {
  if (viewerId === targetId) {
    return 'SELF'
  }
  var following = isFollowing(state, viewerId, targetId)
  var followedBy = isFollowing(state, targetId, viewerId)
  if (following && followedBy) {
    return 'MUTUAL'
  }
  if (following) {
    return 'FOLLOWING'
  }
  if (followedBy) {
    return 'FOLLOWED_BY'
  }
  return 'NONE'
}

function canMessage(state, senderId, receiverId) {
  var sender = findUser(state, senderId)
  var receiver = findUser(state, receiverId)
  if (!sender || !receiver || sender.status !== 'ACTIVE' || receiver.status !== 'ACTIVE') {
    return { allowed: false, reason: 'CONTACT_UNAVAILABLE' }
  }
  if (senderId === receiverId) {
    return { allowed: false, reason: 'INVALID_REQUEST' }
  }
  if (isBlockedEither(state, senderId, receiverId)) {
    return { allowed: false, reason: 'CONTACT_UNAVAILABLE' }
  }
  var policy = DM_POLICIES[receiver.dmPolicy] ? receiver.dmPolicy : DM_POLICIES.MUTUAL
  if (policy === DM_POLICIES.ALL) {
    return { allowed: true, reason: null }
  }
  if (policy === DM_POLICIES.NONE) {
    return { allowed: false, reason: 'PRIVACY_RESTRICTED' }
  }
  if (policy === DM_POLICIES.FOLLOWING) {
    // FOLLOWING: receiver follows sender
    return isFollowing(state, receiverId, senderId)
      ? { allowed: true, reason: null }
      : { allowed: false, reason: 'PRIVACY_RESTRICTED' }
  }
  // MUTUAL
  return isFollowing(state, senderId, receiverId) && isFollowing(state, receiverId, senderId)
    ? { allowed: true, reason: null }
    : { allowed: false, reason: 'PRIVACY_RESTRICTED' }
}

function toSocialUser(state, viewerId, target) {
  if (!target || target.status !== 'ACTIVE') {
    return null
  }
  var permission = canMessage(state, viewerId, target.id)
  var avatarUrl = null
  if (target.hasAvatar) {
    avatarUrl = '/api/social/users/' + target.id + '/avatar'
  }
  return {
    id: target.id,
    nickname: target.nickname,
    avatarUrl: avatarUrl,
    introduction: target.introduction,
    followingCount: countFollowing(state, target.id),
    followerCount: countFollowers(state, target.id),
    friendCount: countFriends(state, target.id),
    relationship: relationshipOf(state, viewerId, target.id),
    blockedByMe: (state.social.blocks || []).some(function (item) {
      return item.blockerId === viewerId && item.blockedId === target.id
    }),
    canMessage: permission.allowed,
    messagePermissionReason: permission.allowed ? null : permission.reason
  }
}

function pageByCursor(items, cursor, limit, idKey) {
  var safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50)
  var startIndex = 0
  if (cursor) {
    for (var i = 0; i < items.length; i += 1) {
      if (String(items[i][idKey || 'id']) === String(cursor)) {
        startIndex = i + 1
        break
      }
    }
  }
  var slice = items.slice(startIndex, startIndex + safeLimit)
  var hasMore = startIndex + safeLimit < items.length
  var nextCursor = hasMore && slice.length ? String(slice[slice.length - 1][idKey || 'id']) : null
  return {
    items: slice,
    nextCursor: nextCursor,
    hasMore: hasMore
  }
}

function findConversation(state, conversationId) {
  return (state.social.conversations || []).filter(function (item) {
    return String(item.id) === String(conversationId)
  })[0]
}

function findConversationForPair(state, a, b) {
  var low = a < b ? a : b
  var high = a < b ? b : a
  return (state.social.conversations || []).filter(function (item) {
    return item.userLowId === low && item.userHighId === high
  })[0]
}

function getPeerId(conversation, viewerId) {
  return conversation.userLowId === viewerId ? conversation.userHighId : conversation.userLowId
}

function getMember(conversation, userId) {
  return (conversation.members || []).filter(function (item) {
    return item.userId === userId
  })[0]
}

function conversationMessages(state, conversationId) {
  return (state.social.messages || [])
    .filter(function (item) {
      return String(item.conversationId) === String(conversationId)
    })
    .sort(function (a, b) {
      return socialData.compareSeq(a.seq, b.seq)
    })
}

function unreadCountFor(state, conversation, viewerId) {
  var member = getMember(conversation, viewerId)
  var lastReadSeq = member ? member.lastReadSeq || '0' : '0'
  return conversationMessages(state, conversation.id).filter(function (item) {
    return item.senderId !== viewerId && socialData.compareSeq(item.seq, lastReadSeq) > 0
  }).length
}

function lastMessageOf(state, conversationId) {
  var list = conversationMessages(state, conversationId)
  return list.length ? toChatMessage(list[list.length - 1]) : null
}

function toChatMessage(message) {
  if (!message) {
    return null
  }
  var type = String(message.type || 'TEXT').toUpperCase() === 'IMAGE' ? 'IMAGE' : 'TEXT'
  var dto = {
    id: String(message.id),
    conversationId: String(message.conversationId),
    seq: String(message.seq),
    senderId: message.senderId,
    clientMessageId: message.clientMessageId,
    type: type,
    content: type === 'IMAGE' ? '' : String(message.content || ''),
    createdAt: message.createdAt
  }
  if (type === 'IMAGE') {
    dto.imageContentType = message.imageContentType || 'image/png'
    dto.imageWidth = Number(message.imageWidth || 0) || null
    dto.imageHeight = Number(message.imageHeight || 0) || null
    dto.imageSize = Number(message.imageSize || 0) || null
    // Local demo asset for authenticated mock preview only; never expose storage keys.
    dto.mockAssetPath = message.mockAssetPath || '/image/logo.png'
  }
  return dto
}

function toConversation(state, viewerId, conversation) {
  var peer = findUser(state, getPeerId(conversation, viewerId))
  var peerDto = toSocialUser(state, viewerId, peer)
  if (!peerDto) {
    return null
  }
  var member = getMember(conversation, viewerId)
  var sendPermission = canMessage(state, viewerId, peer.id)
  return {
    id: String(conversation.id),
    peer: peerDto,
    lastMessage: lastMessageOf(state, conversation.id),
    updatedAt: conversation.lastMessageAt || conversation.createdAt,
    unreadCount: unreadCountFor(state, conversation, viewerId),
    lastReadSeq: member ? String(member.lastReadSeq || '0') : '0',
    canSend: sendPermission.allowed,
    sendPermissionReason: sendPermission.allowed ? null : sendPermission.reason,
    imageMessagingEnabled: state.social.imageMessagingEnabled === true
  }
}

function publishRealtime(type, payload) {
  try {
    var realtime = require('../services/social-realtime.js')
    realtime.publishMockEvent(type, payload || {})
  } catch (error) {
    // Ignore mock realtime publish failures.
  }
}

function syncSelfNickname(state, utils) {
  var selfUser = findUser(state, socialData.SELF_PUBLIC_ID)
  if (!selfUser) {
    return
  }
  if (state.profile && state.profile.nickname) {
    selfUser.nickname = state.profile.nickname
  }
  if (state.profile && state.profile.introduction !== undefined) {
    selfUser.introduction = state.profile.introduction
  }
  if (state.profile && state.profile.avatar) {
    selfUser.hasAvatar = true
  }
}

function handleMe(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  syncSelfNickname(state, utils)
  writeSocial(utils, state)
  var selfUser = findUser(state, socialData.SELF_PUBLIC_ID)
  return utils.resolveWithDelay(
    utils.buildSuccess(toSocialUser(state, socialData.SELF_PUBLIC_ID, selfUser))
  )
}

function handleSearchUsers(token, query, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  syncSelfNickname(state, utils)
  var keyword = String(query.query || '')
    .trim()
    .toLowerCase()
  var users = (state.social.users || [])
    .filter(function (item) {
      if (item.status !== 'ACTIVE') {
        return false
      }
      if (!keyword) {
        return true
      }
      return (
        String(item.nickname || '')
          .toLowerCase()
          .indexOf(keyword) !== -1 || String(item.id).toLowerCase() === keyword
      )
    })
    .map(function (item) {
      return toSocialUser(state, socialData.SELF_PUBLIC_ID, item)
    })
    .filter(Boolean)
  return utils.resolveWithDelay(
    utils.buildSuccess(pageByCursor(users, query.cursor, query.limit, 'id'))
  )
}

function handleGetUser(token, userId, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  syncSelfNickname(state, utils)
  var target = findUser(state, userId)
  if (!target || target.status !== 'ACTIVE') {
    return rejectBusiness(utils, i18n.t('social.errors.userNotFound'), 'USER_NOT_FOUND', 404)
  }
  return utils.resolveWithDelay(
    utils.buildSuccess(toSocialUser(state, socialData.SELF_PUBLIC_ID, target))
  )
}

function handleRelationships(token, userId, query, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  var target = findUser(state, userId)
  if (!target || target.status !== 'ACTIVE') {
    return rejectBusiness(utils, i18n.t('social.errors.userNotFound'), 'USER_NOT_FOUND', 404)
  }
  var kind = String(query.kind || 'following')
  var ids = []
  if (kind === 'followers') {
    ids = (state.social.follows || [])
      .filter(function (item) {
        return item.followeeId === userId
      })
      .map(function (item) {
        return item.followerId
      })
  } else if (kind === 'friends') {
    var following = {}
    ;(state.social.follows || []).forEach(function (item) {
      if (item.followerId === userId) {
        following[item.followeeId] = true
      }
    })
    ids = (state.social.follows || [])
      .filter(function (item) {
        return item.followeeId === userId && following[item.followerId]
      })
      .map(function (item) {
        return item.followerId
      })
  } else {
    ids = (state.social.follows || [])
      .filter(function (item) {
        return item.followerId === userId
      })
      .map(function (item) {
        return item.followeeId
      })
  }

  var users = ids
    .map(function (id) {
      return toSocialUser(state, socialData.SELF_PUBLIC_ID, findUser(state, id))
    })
    .filter(Boolean)
  return utils.resolveWithDelay(
    utils.buildSuccess(pageByCursor(users, query.cursor, query.limit, 'id'))
  )
}

function handleFollow(token, userId, method, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  var selfId = socialData.SELF_PUBLIC_ID
  var target = findUser(state, userId)
  if (!target || target.status !== 'ACTIVE') {
    return rejectBusiness(utils, i18n.t('social.errors.userNotFound'), 'USER_NOT_FOUND', 404)
  }
  if (userId === selfId) {
    return rejectBusiness(utils, i18n.t('social.errors.invalidRequest'), 'INVALID_REQUEST', 400)
  }
  if (isBlockedEither(state, selfId, userId)) {
    return rejectBusiness(
      utils,
      i18n.t('social.errors.contactUnavailable'),
      'CONTACT_UNAVAILABLE',
      403
    )
  }

  if (method === 'PUT') {
    if (!isFollowing(state, selfId, userId)) {
      state.social.follows.push({
        followerId: selfId,
        followeeId: userId,
        createdAt: socialData.nowIso()
      })
      writeSocial(utils, state)
      publishRealtime('social.changed', {})
    }
  } else {
    state.social.follows = (state.social.follows || []).filter(function (item) {
      return !(item.followerId === selfId && item.followeeId === userId)
    })
    writeSocial(utils, state)
    publishRealtime('social.changed', {})
  }

  return utils.resolveWithDelay(utils.buildSuccess(toSocialUser(state, selfId, target)))
}

function removeMutualFollows(state, a, b) {
  state.social.follows = (state.social.follows || []).filter(function (item) {
    return !(
      (item.followerId === a && item.followeeId === b) ||
      (item.followerId === b && item.followeeId === a)
    )
  })
}

function handleBlock(token, userId, method, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  var selfId = socialData.SELF_PUBLIC_ID
  var target = findUser(state, userId)
  if (!target || target.status !== 'ACTIVE') {
    return rejectBusiness(utils, i18n.t('social.errors.userNotFound'), 'USER_NOT_FOUND', 404)
  }
  if (userId === selfId) {
    return rejectBusiness(utils, i18n.t('social.errors.invalidRequest'), 'INVALID_REQUEST', 400)
  }

  if (method === 'PUT') {
    var alreadyBlocked = (state.social.blocks || []).some(function (item) {
      return item.blockerId === selfId && item.blockedId === userId
    })
    if (!alreadyBlocked) {
      state.social.blocks.push({
        blockerId: selfId,
        blockedId: userId,
        createdAt: socialData.nowIso()
      })
      removeMutualFollows(state, selfId, userId)
      writeSocial(utils, state)
      publishRealtime('social.changed', {})
    }
    return utils.resolveWithDelay(utils.buildSuccess({ blocked: true }))
  }

  state.social.blocks = (state.social.blocks || []).filter(function (item) {
    return !(item.blockerId === selfId && item.blockedId === userId)
  })
  writeSocial(utils, state)
  publishRealtime('social.changed', {})
  return utils.resolveWithDelay(utils.buildSuccess({ blocked: false }))
}

function handleBlocks(token, query, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  var selfId = socialData.SELF_PUBLIC_ID
  var users = (state.social.blocks || [])
    .filter(function (item) {
      return item.blockerId === selfId
    })
    .map(function (item) {
      return toSocialUser(state, selfId, findUser(state, item.blockedId))
    })
    .filter(Boolean)
  return utils.resolveWithDelay(
    utils.buildSuccess(pageByCursor(users, query.cursor, query.limit, 'id'))
  )
}

function handlePrivacy(token, method, payload, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  var selfUser = findUser(state, socialData.SELF_PUBLIC_ID)
  if (method === 'GET') {
    return utils.resolveWithDelay(
      utils.buildSuccess({
        dmPolicy: DM_POLICIES[selfUser.dmPolicy] ? selfUser.dmPolicy : DM_POLICIES.MUTUAL
      })
    )
  }
  var nextPolicy = String((payload && payload.dmPolicy) || '')
  if (!DM_POLICIES[nextPolicy]) {
    return rejectBusiness(utils, i18n.t('social.errors.invalidRequest'), 'INVALID_REQUEST', 400)
  }
  selfUser.dmPolicy = nextPolicy
  writeSocial(utils, state)
  publishRealtime('social.changed', {})
  return utils.resolveWithDelay(utils.buildSuccess({ dmPolicy: nextPolicy }))
}

function handleUnread(token, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  var selfId = socialData.SELF_PUBLIC_ID
  var total = (state.social.conversations || []).reduce(function (sum, conversation) {
    if (!getMember(conversation, selfId)) {
      return sum
    }
    return sum + unreadCountFor(state, conversation, selfId)
  }, 0)
  return utils.resolveWithDelay(utils.buildSuccess({ total: total }))
}

function handleCreateConversation(token, payload, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  var selfId = socialData.SELF_PUBLIC_ID
  var peerId = String((payload && payload.peerId) || '')
  var peer = findUser(state, peerId)
  if (!peer || peer.status !== 'ACTIVE') {
    return rejectBusiness(utils, i18n.t('social.errors.userNotFound'), 'USER_NOT_FOUND', 404)
  }
  var permission = canMessage(state, selfId, peerId)
  if (!permission.allowed) {
    return rejectBusiness(
      utils,
      i18n.t(
        'social.errors.' +
          (permission.reason === 'PRIVACY_RESTRICTED' ? 'privacyRestricted' : 'contactUnavailable')
      ),
      permission.reason,
      403
    )
  }
  var existing = findConversationForPair(state, selfId, peerId)
  if (!existing) {
    var low = selfId < peerId ? selfId : peerId
    var high = selfId < peerId ? peerId : selfId
    existing = {
      id: String(socialData.nextId('nextConversationId', state.social)),
      userLowId: low,
      userHighId: high,
      lastSeq: '0',
      lastMessageAt: socialData.nowIso(),
      createdAt: socialData.nowIso(),
      members: [
        { userId: selfId, lastReadSeq: '0', createdAt: socialData.nowIso() },
        { userId: peerId, lastReadSeq: '0', createdAt: socialData.nowIso() }
      ]
    }
    state.social.conversations.push(existing)
    writeSocial(utils, state)
  }
  return utils.resolveWithDelay(utils.buildSuccess(toConversation(state, selfId, existing)))
}

function handleConversationList(token, query, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  var selfId = socialData.SELF_PUBLIC_ID
  var list = (state.social.conversations || [])
    .filter(function (item) {
      return !!getMember(item, selfId)
    })
    .map(function (item) {
      return toConversation(state, selfId, item)
    })
    .filter(Boolean)
    .sort(function (a, b) {
      return String(b.updatedAt).localeCompare(String(a.updatedAt))
    })
  return utils.resolveWithDelay(
    utils.buildSuccess(pageByCursor(list, query.cursor, query.limit, 'id'))
  )
}

function handleConversationDetail(token, conversationId, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  var selfId = socialData.SELF_PUBLIC_ID
  var conversation = findConversation(state, conversationId)
  if (!conversation || !getMember(conversation, selfId)) {
    return rejectBusiness(
      utils,
      i18n.t('social.errors.conversationNotFound'),
      'CONVERSATION_NOT_FOUND',
      404
    )
  }
  return utils.resolveWithDelay(utils.buildSuccess(toConversation(state, selfId, conversation)))
}

function handleMessageList(token, conversationId, query, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  var selfId = socialData.SELF_PUBLIC_ID
  var conversation = findConversation(state, conversationId)
  if (!conversation || !getMember(conversation, selfId)) {
    return rejectBusiness(
      utils,
      i18n.t('social.errors.conversationNotFound'),
      'CONVERSATION_NOT_FOUND',
      404
    )
  }
  if (query.beforeSeq && query.afterSeq) {
    return rejectBusiness(utils, i18n.t('social.errors.invalidRequest'), 'INVALID_REQUEST', 400)
  }

  var all = conversationMessages(state, conversationId)
  var limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50)
  var items = []
  var hasMore = false
  var nextCursor = null

  if (query.beforeSeq) {
    var earlier = all.filter(function (item) {
      return socialData.compareSeq(item.seq, query.beforeSeq) < 0
    })
    items = earlier.slice(Math.max(0, earlier.length - limit))
    hasMore = earlier.length > items.length
    nextCursor = hasMore && items.length ? String(items[0].seq) : null
  } else if (query.afterSeq) {
    var later = all.filter(function (item) {
      return socialData.compareSeq(item.seq, query.afterSeq) > 0
    })
    items = later.slice(0, limit)
    hasMore = later.length > items.length
    nextCursor = hasMore && items.length ? String(items[items.length - 1].seq) : null
  } else {
    items = all.slice(Math.max(0, all.length - limit))
    hasMore = all.length > items.length
    nextCursor = hasMore && items.length ? String(items[0].seq) : null
  }

  return utils.resolveWithDelay(
    utils.buildSuccess({
      items: items.map(toChatMessage),
      nextCursor: nextCursor,
      hasMore: hasMore
    })
  )
}

function unicodeLength(text) {
  return Array.from(String(text || '')).length
}

function resolveImageFingerprint(payload) {
  var fingerprint = String((payload && payload.image && payload.image.fingerprint) || '')
  // SHA1 is read from the actual local bytes by wx.getFileInfo in mock mode.
  // It is not the server's canonical, re-encoded SHA256.
  return /^sha1:[a-f0-9]{40}$/.test(fingerprint) ? fingerprint : ''
}

function resolveMockAssetPath(filePath) {
  var path = String(filePath || '').trim()
  if (path.indexOf('/image/') === 0) {
    return path
  }
  return '/image/logo.png'
}

function handleSendMessage(token, conversationId, payload, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  var selfId = socialData.SELF_PUBLIC_ID
  var conversation = findConversation(state, conversationId)
  if (!conversation || !getMember(conversation, selfId)) {
    return rejectBusiness(
      utils,
      i18n.t('social.errors.conversationNotFound'),
      'CONVERSATION_NOT_FOUND',
      404
    )
  }

  var clientMessageId = String((payload && payload.clientMessageId) || '').trim()
  var content = String((payload && payload.content) || '').trim()
  if (!clientMessageId || unicodeLength(content) < 1 || unicodeLength(content) > 1000) {
    return rejectBusiness(utils, i18n.t('social.errors.invalidRequest'), 'INVALID_REQUEST', 400)
  }

  var existing = (state.social.messages || []).filter(function (item) {
    return (
      String(item.conversationId) === String(conversationId) &&
      item.senderId === selfId &&
      item.clientMessageId === clientMessageId
    )
  })[0]
  if (existing) {
    if (String(existing.type || 'TEXT').toUpperCase() === 'IMAGE' || existing.content !== content) {
      return rejectBusiness(
        utils,
        i18n.t('social.errors.clientMessageConflict'),
        'CLIENT_MESSAGE_CONFLICT',
        409
      )
    }
    return utils.resolveWithDelay(utils.buildSuccess(toChatMessage(existing)))
  }

  var peerId = getPeerId(conversation, selfId)
  var permission = canMessage(state, selfId, peerId)
  if (!permission.allowed) {
    return rejectBusiness(
      utils,
      i18n.t(
        'social.errors.' +
          (permission.reason === 'PRIVACY_RESTRICTED' ? 'privacyRestricted' : 'contactUnavailable')
      ),
      permission.reason,
      403
    )
  }

  var nextSeq = socialData.incrementSeq(conversation.lastSeq || '0')
  var message = {
    id: String(socialData.nextId('nextMessageId', state.social)),
    conversationId: String(conversationId),
    seq: nextSeq,
    senderId: selfId,
    clientMessageId: clientMessageId,
    type: 'TEXT',
    content: content,
    createdAt: socialData.nowIso()
  }
  state.social.messages.push(message)
  conversation.lastSeq = nextSeq
  conversation.lastMessageAt = message.createdAt
  var selfMember = getMember(conversation, selfId)
  if (selfMember) {
    selfMember.lastReadSeq = nextSeq
  }
  writeSocial(utils, state)
  publishRealtime('message.created', {
    conversationId: String(conversationId),
    messageId: message.id,
    seq: message.seq
  })
  return utils.resolveWithDelay(utils.buildSuccess(toChatMessage(message)))
}

function handleSendImageMessage(token, conversationId, payload, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  var selfId = socialData.SELF_PUBLIC_ID
  var conversation = findConversation(state, conversationId)
  if (!conversation || !getMember(conversation, selfId)) {
    return rejectBusiness(
      utils,
      i18n.t('social.errors.conversationNotFound'),
      'CONVERSATION_NOT_FOUND',
      404
    )
  }

  var clientMessageId = String((payload && payload.clientMessageId) || '').trim()
  var fingerprint = resolveImageFingerprint(payload)
  if (!clientMessageId || !fingerprint) {
    return rejectBusiness(utils, i18n.t('social.errors.invalidRequest'), 'INVALID_REQUEST', 400)
  }
  var image = payload.image
  if (
    ['image/jpeg', 'image/png'].indexOf(image.contentType) === -1 ||
    !(image.size > 0) ||
    image.size > 5 * 1024 * 1024 ||
    !(image.width > 0 && image.height > 0) ||
    image.width > 4096 ||
    image.height > 4096 ||
    image.width * image.height > 16000000
  ) {
    return rejectBusiness(utils, i18n.t('social.errors.invalidImage'), 'INVALID_REQUEST', 400)
  }

  var existing = (state.social.messages || []).filter(function (item) {
    return (
      String(item.conversationId) === String(conversationId) &&
      item.senderId === selfId &&
      item.clientMessageId === clientMessageId
    )
  })[0]
  if (existing) {
    if (String(existing.type || 'TEXT').toUpperCase() !== 'IMAGE') {
      return rejectBusiness(
        utils,
        i18n.t('social.errors.clientMessageConflict'),
        'CLIENT_MESSAGE_CONFLICT',
        409
      )
    }
    if (String(existing.imageFingerprint || '') !== fingerprint) {
      return rejectBusiness(
        utils,
        i18n.t('social.errors.clientMessageConflict'),
        'CLIENT_MESSAGE_CONFLICT',
        409
      )
    }
    // Already committed: confirm without re-upload even if privacy tightened.
    return utils.resolveWithDelay(utils.buildSuccess(toChatMessage(existing)))
  }

  if (state.social.imageMessagingEnabled === false) {
    return rejectBusiness(
      utils,
      i18n.t('social.errors.imageMessagingDisabled'),
      'INVALID_REQUEST',
      400
    )
  }

  var peerId = getPeerId(conversation, selfId)
  var permission = canMessage(state, selfId, peerId)
  if (!permission.allowed) {
    return rejectBusiness(
      utils,
      i18n.t(
        'social.errors.' +
          (permission.reason === 'PRIVACY_RESTRICTED' ? 'privacyRestricted' : 'contactUnavailable')
      ),
      permission.reason,
      403
    )
  }

  var nextSeq = socialData.incrementSeq(conversation.lastSeq || '0')
  var mockAssetPath = resolveMockAssetPath(image.path)
  var message = {
    id: String(socialData.nextId('nextMessageId', state.social)),
    conversationId: String(conversationId),
    seq: nextSeq,
    senderId: selfId,
    clientMessageId: clientMessageId,
    type: 'IMAGE',
    content: '',
    imageContentType: image.contentType,
    imageWidth: image.width,
    imageHeight: image.height,
    imageSize: image.size,
    imageFingerprint: fingerprint,
    mockAssetPath: mockAssetPath,
    createdAt: socialData.nowIso()
  }
  state.social.messages.push(message)
  conversation.lastSeq = nextSeq
  conversation.lastMessageAt = message.createdAt
  var selfMember = getMember(conversation, selfId)
  if (selfMember) {
    selfMember.lastReadSeq = nextSeq
  }
  writeSocial(utils, state)
  publishRealtime('message.created', {
    conversationId: String(conversationId),
    messageId: message.id,
    seq: message.seq
  })
  return utils.resolveWithDelay(utils.buildSuccess(toChatMessage(message)))
}

function handleGetMessageImage(token, conversationId, messageId, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  var selfId = socialData.SELF_PUBLIC_ID
  var conversation = findConversation(state, conversationId)
  if (!conversation || !getMember(conversation, selfId)) {
    return rejectBusiness(
      utils,
      i18n.t('social.errors.conversationNotFound'),
      'CONVERSATION_NOT_FOUND',
      404
    )
  }
  var message = (state.social.messages || []).filter(function (item) {
    return (
      String(item.id) === String(messageId) &&
      String(item.conversationId) === String(conversationId)
    )
  })[0]
  if (!message || String(message.type || 'TEXT').toUpperCase() !== 'IMAGE') {
    return rejectBusiness(utils, i18n.t('social.errors.invalidRequest'), 'INVALID_REQUEST', 404)
  }
  // Mock returns a local demo asset path for authenticated preview; never token query.
  return utils.resolveWithDelay(
    utils.buildSuccess({
      mockAssetPath: message.mockAssetPath || '/image/logo.png',
      contentType: message.imageContentType || 'image/png'
    })
  )
}

function handleMarkRead(token, conversationId, payload, utils) {
  var authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }
  var state = ensureSocialState(utils)
  var selfId = socialData.SELF_PUBLIC_ID
  var conversation = findConversation(state, conversationId)
  if (!conversation || !getMember(conversation, selfId)) {
    return rejectBusiness(
      utils,
      i18n.t('social.errors.conversationNotFound'),
      'CONVERSATION_NOT_FOUND',
      404
    )
  }
  var requestedRaw = payload && payload.lastReadSeq
  if (
    requestedRaw === undefined ||
    requestedRaw === null ||
    !/^\d+$/.test(String(requestedRaw).trim())
  ) {
    return rejectBusiness(utils, i18n.t('social.errors.invalidRequest'), 'INVALID_REQUEST', 400)
  }
  var member = getMember(conversation, selfId)
  var current = member.lastReadSeq || '0'
  var lastSeq = conversation.lastSeq || '0'
  var requested = socialData.normalizeSeq(requestedRaw)
  var next = requested
  if (socialData.compareSeq(next, current) < 0) {
    next = socialData.normalizeSeq(current)
  }
  if (socialData.compareSeq(next, lastSeq) > 0) {
    next = socialData.normalizeSeq(lastSeq)
  }
  member.lastReadSeq = next
  writeSocial(utils, state)
  publishRealtime('conversation.read', {
    conversationId: String(conversationId),
    readerId: selfId,
    lastReadSeq: next
  })
  return utils.resolveWithDelay(
    utils.buildSuccess({
      lastReadSeq: next,
      unreadCount: unreadCountFor(state, conversation, selfId)
    })
  )
}

function handleRequest(path, method, query, payload, token, utils) {
  if (path === '/api/social/me' && method === 'GET') {
    return handleMe(token, utils)
  }
  if (path === '/api/social/users' && method === 'GET') {
    return handleSearchUsers(token, query, utils)
  }
  var userMatch = /^\/api\/social\/users\/([^/]+)$/.exec(path)
  if (userMatch && method === 'GET') {
    return handleGetUser(token, decodeURIComponent(userMatch[1]), utils)
  }
  var relationshipMatch = /^\/api\/social\/users\/([^/]+)\/relationships$/.exec(path)
  if (relationshipMatch && method === 'GET') {
    return handleRelationships(token, decodeURIComponent(relationshipMatch[1]), query, utils)
  }
  var followMatch = /^\/api\/social\/users\/([^/]+)\/follow$/.exec(path)
  if (followMatch && (method === 'PUT' || method === 'DELETE')) {
    return handleFollow(token, decodeURIComponent(followMatch[1]), method, utils)
  }
  var blockMatch = /^\/api\/social\/users\/([^/]+)\/block$/.exec(path)
  if (blockMatch && (method === 'PUT' || method === 'DELETE')) {
    return handleBlock(token, decodeURIComponent(blockMatch[1]), method, utils)
  }
  if (path === '/api/social/blocks' && method === 'GET') {
    return handleBlocks(token, query, utils)
  }
  if (path === '/api/social/privacy' && (method === 'GET' || method === 'PUT')) {
    return handlePrivacy(token, method, payload, utils)
  }
  if (path === '/api/social/unread' && method === 'GET') {
    return handleUnread(token, utils)
  }
  if (path === '/api/social/conversations' && method === 'POST') {
    return handleCreateConversation(token, payload, utils)
  }
  if (path === '/api/social/conversations' && method === 'GET') {
    return handleConversationList(token, query, utils)
  }
  var conversationMatch = /^\/api\/social\/conversations\/([^/]+)$/.exec(path)
  if (conversationMatch && method === 'GET') {
    return handleConversationDetail(token, decodeURIComponent(conversationMatch[1]), utils)
  }
  var messageImageMatch = /^\/api\/social\/conversations\/([^/]+)\/messages\/image$/.exec(path)
  if (messageImageMatch && method === 'POST') {
    return handleSendImageMessage(token, decodeURIComponent(messageImageMatch[1]), payload, utils)
  }
  var messageImageContentMatch =
    /^\/api\/social\/conversations\/([^/]+)\/messages\/([^/]+)\/image$/.exec(path)
  if (messageImageContentMatch && method === 'GET') {
    return handleGetMessageImage(
      token,
      decodeURIComponent(messageImageContentMatch[1]),
      decodeURIComponent(messageImageContentMatch[2]),
      utils
    )
  }
  var messagesMatch = /^\/api\/social\/conversations\/([^/]+)\/messages$/.exec(path)
  if (messagesMatch && method === 'GET') {
    return handleMessageList(token, decodeURIComponent(messagesMatch[1]), query, utils)
  }
  if (messagesMatch && method === 'POST') {
    return handleSendMessage(token, decodeURIComponent(messagesMatch[1]), payload, utils)
  }
  var readMatch = /^\/api\/social\/conversations\/([^/]+)\/read$/.exec(path)
  if (readMatch && method === 'PUT') {
    return handleMarkRead(token, decodeURIComponent(readMatch[1]), payload, utils)
  }
  return null
}

module.exports = {
  handleRequest: handleRequest,
  SELF_PUBLIC_ID: socialData.SELF_PUBLIC_ID
}
