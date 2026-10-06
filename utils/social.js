const { generateRequestId } = require('../services/request-id.js')
const i18n = require('./i18n.js')

const DM_POLICY_OPTIONS = ['ALL', 'FOLLOWING', 'MUTUAL', 'NONE']
const PLACEHOLDER_AVATAR = '/image/default.png'

function createClientMessageId() {
  return generateRequestId()
}

function normalizePage(payload) {
  const data = payload || {}
  return {
    items: Array.isArray(data.items) ? data.items : [],
    nextCursor: data.nextCursor || null,
    hasMore: !!data.hasMore
  }
}

function normalizeSeq(value) {
  const raw = String(value == null ? '' : value).trim()
  if (!/^\d+$/.test(raw)) {
    return '0'
  }
  return raw.replace(/^0+(?=\d)/, '') || '0'
}

function compareSeq(left, right) {
  const a = normalizeSeq(left)
  const b = normalizeSeq(right)
  if (a === b) {
    return 0
  }
  if (a.length !== b.length) {
    return a.length < b.length ? -1 : 1
  }
  return a < b ? -1 : 1
}

function maxSeq(left, right) {
  return compareSeq(left, right) >= 0 ? normalizeSeq(left) : normalizeSeq(right)
}

function localMessageKey(item) {
  return (
    'local:' +
    String((item && item.conversationId) || '') +
    ':' +
    String((item && item.senderId) || '') +
    ':' +
    String((item && item.clientMessageId) || '')
  )
}

function mergeMessagesById(existing, incoming) {
  const map = {}
  ;(existing || []).forEach(function (item) {
    if (!item) {
      return
    }
    if (item.id) {
      map[String(item.id)] = item
      return
    }
    if (item.clientMessageId) {
      map[localMessageKey(item)] = item
    }
  })
  ;(incoming || []).forEach(function (item) {
    if (!item) {
      return
    }
    if (item.id) {
      const localKey = item.clientMessageId ? localMessageKey(item) : ''
      const previousLocal = localKey ? map[localKey] : null
      const mergedItem =
        previousLocal && previousLocal.localPath && !item.localPath
          ? Object.assign({}, item, { localPath: previousLocal.localPath })
          : item
      map[String(item.id)] = mergedItem
      if (item.clientMessageId) {
        delete map[localKey]
      }
      return
    }
    if (item.clientMessageId) {
      const localKey = localMessageKey(item)
      const alreadyCommitted = Object.keys(map).some(function (key) {
        const current = map[key]
        return !!(current && current.id && localMessageKey(current) === localKey)
      })
      if (alreadyCommitted) {
        // Do not downgrade a server-committed message to a local pending/failed copy.
        return
      }
      map[localKey] = item
    }
  })
  return Object.keys(map)
    .map(function (key) {
      return map[key]
    })
    .sort(function (a, b) {
      const seqCompare = compareSeq(a.seq, b.seq)
      if (seqCompare !== 0 && normalizeSeq(a.seq) !== '0' && normalizeSeq(b.seq) !== '0') {
        return seqCompare
      }
      if (seqCompare !== 0 && (a.seq || b.seq)) {
        return seqCompare
      }
      return String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
    })
}

function relationshipLabel(relationship) {
  switch (relationship) {
    case 'SELF':
      return i18n.t('social.relationship.self')
    case 'FOLLOWING':
      return i18n.t('social.relationship.following')
    case 'FOLLOWED_BY':
      return i18n.t('social.relationship.followedBy')
    case 'MUTUAL':
      return i18n.t('social.relationship.mutual')
    default:
      return i18n.t('social.relationship.none')
  }
}

function dmPolicyLabel(policy) {
  switch (policy) {
    case 'ALL':
      return i18n.t('social.privacy.all')
    case 'FOLLOWING':
      return i18n.t('social.privacy.following')
    case 'MUTUAL':
      return i18n.t('social.privacy.mutual')
    case 'NONE':
      return i18n.t('social.privacy.none')
    default:
      return i18n.t('social.privacy.mutual')
  }
}

function permissionMessage(errorCode) {
  if (errorCode === 'PRIVACY_RESTRICTED') {
    return i18n.t('social.errors.privacyRestricted')
  }
  if (errorCode === 'CONTACT_UNAVAILABLE') {
    return i18n.t('social.errors.contactUnavailable')
  }
  if (errorCode === 'CLIENT_MESSAGE_CONFLICT') {
    return i18n.t('social.errors.clientMessageConflict')
  }
  if (errorCode === 'CONVERSATION_NOT_FOUND') {
    return i18n.t('social.errors.conversationNotFound')
  }
  if (errorCode === 'USER_NOT_FOUND') {
    return i18n.t('social.errors.userNotFound')
  }
  return i18n.t('social.errors.invalidRequest')
}

function openUserProfile(userId) {
  if (!userId) {
    return
  }
  wx.navigateTo({
    url: '/pages/userProfile/userProfile?id=' + encodeURIComponent(userId)
  })
}

function openChat(conversationId, peerId) {
  var query = []
  if (conversationId) {
    query.push('id=' + encodeURIComponent(conversationId))
  }
  if (peerId) {
    query.push('peerId=' + encodeURIComponent(peerId))
  }
  wx.navigateTo({
    url: '/pages/chat/chat?' + query.join('&')
  })
}

function isImageMessage(message) {
  return String((message && message.type) || 'TEXT').toUpperCase() === 'IMAGE'
}

function messagePreviewText(message) {
  if (!message) {
    return i18n.t('social.conversations.noMessage')
  }
  if (isImageMessage(message)) {
    return i18n.t('social.conversations.imageMessage')
  }
  const content = String(message.content || '').trim()
  return content || i18n.t('social.conversations.noMessage')
}

module.exports = {
  DM_POLICY_OPTIONS: DM_POLICY_OPTIONS,
  PLACEHOLDER_AVATAR: PLACEHOLDER_AVATAR,
  createClientMessageId: createClientMessageId,
  normalizePage: normalizePage,
  normalizeSeq: normalizeSeq,
  compareSeq: compareSeq,
  maxSeq: maxSeq,
  mergeMessagesById: mergeMessagesById,
  relationshipLabel: relationshipLabel,
  dmPolicyLabel: dmPolicyLabel,
  permissionMessage: permissionMessage,
  openUserProfile: openUserProfile,
  openChat: openChat,
  isImageMessage: isImageMessage,
  messagePreviewText: messagePreviewText
}
