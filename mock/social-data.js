const { generateRequestId } = require('../services/request-id.js')

const SELF_PUBLIC_ID = '11111111-1111-4111-8111-111111111111'
const PEER_A_ID = '22222222-2222-4222-8222-222222222222'
const PEER_B_ID = '33333333-3333-4333-8333-333333333333'
const PEER_C_ID = '44444444-4444-4444-8444-444444444444'
const PEER_D_ID = '55555555-5555-4555-8555-555555555555'
const CLOSED_ID = '66666666-6666-4666-8666-666666666666'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function buildUsers() {
  return [
    {
      id: SELF_PUBLIC_ID,
      nickname: '林知远',
      avatarUrl: '/api/social/users/' + SELF_PUBLIC_ID + '/avatar',
      hasAvatar: true,
      introduction: '喜欢做实用的小工具。',
      status: 'ACTIVE',
      dmPolicy: 'MUTUAL'
    },
    {
      id: PEER_A_ID,
      nickname: '阿晴',
      avatarUrl: '/api/social/users/' + PEER_A_ID + '/avatar',
      hasAvatar: true,
      introduction: '图书馆常驻选手。',
      status: 'ACTIVE',
      dmPolicy: 'MUTUAL'
    },
    {
      id: PEER_B_ID,
      nickname: '周予安',
      avatarUrl: '/api/social/users/' + PEER_B_ID + '/avatar',
      hasAvatar: true,
      introduction: '摄影社招新中。',
      status: 'ACTIVE',
      dmPolicy: 'FOLLOWING'
    },
    {
      id: PEER_C_ID,
      nickname: '陈可',
      avatarUrl: '/api/social/users/' + PEER_C_ID + '/avatar',
      hasAvatar: true,
      introduction: '二手交易常客。',
      status: 'ACTIVE',
      dmPolicy: 'ALL'
    },
    {
      id: PEER_D_ID,
      nickname: '宁宁',
      avatarUrl: null,
      hasAvatar: false,
      introduction: '暂不接收私信。',
      status: 'ACTIVE',
      dmPolicy: 'NONE'
    },
    {
      id: CLOSED_ID,
      nickname: '已注销用户',
      avatarUrl: null,
      hasAvatar: false,
      introduction: null,
      status: 'CLOSED',
      dmPolicy: 'NONE'
    }
  ]
}

function buildFollows() {
  return [
    { followerId: SELF_PUBLIC_ID, followeeId: PEER_A_ID, createdAt: '2026-09-01T10:00:00+08:00' },
    { followerId: PEER_A_ID, followeeId: SELF_PUBLIC_ID, createdAt: '2026-09-01T11:00:00+08:00' },
    { followerId: SELF_PUBLIC_ID, followeeId: PEER_B_ID, createdAt: '2026-09-02T09:00:00+08:00' },
    { followerId: PEER_C_ID, followeeId: SELF_PUBLIC_ID, createdAt: '2026-09-03T08:00:00+08:00' }
  ]
}

function buildBlocks() {
  return []
}

function buildConversations() {
  const conversationId = '9001'
  return [
    {
      id: conversationId,
      userLowId: SELF_PUBLIC_ID < PEER_A_ID ? SELF_PUBLIC_ID : PEER_A_ID,
      userHighId: SELF_PUBLIC_ID < PEER_A_ID ? PEER_A_ID : SELF_PUBLIC_ID,
      lastSeq: '2',
      lastMessageAt: '2026-10-05T12:30:00+08:00',
      createdAt: '2026-09-10T18:00:00+08:00',
      members: [
        { userId: SELF_PUBLIC_ID, lastReadSeq: '1', createdAt: '2026-09-10T18:00:00+08:00' },
        { userId: PEER_A_ID, lastReadSeq: '2', createdAt: '2026-09-10T18:00:00+08:00' }
      ]
    }
  ]
}

function buildMessages() {
  return [
    {
      id: '10001',
      conversationId: '9001',
      seq: '1',
      senderId: SELF_PUBLIC_ID,
      clientMessageId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      type: 'TEXT',
      content: '周末图书馆见？',
      createdAt: '2026-10-05T12:00:00+08:00'
    },
    {
      id: '10002',
      conversationId: '9001',
      seq: '2',
      senderId: PEER_A_ID,
      clientMessageId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      type: 'TEXT',
      content: '可以，下午两点一楼见。',
      createdAt: '2026-10-05T12:30:00+08:00'
    }
  ]
}

function createDefaultSocialState() {
  return {
    users: buildUsers(),
    follows: buildFollows(),
    blocks: buildBlocks(),
    conversations: buildConversations(),
    messages: buildMessages(),
    imageMessagingEnabled: true,
    nextConversationId: 9002,
    nextMessageId: 10003
  }
}

function nextId(counterName, state) {
  const value = String(state[counterName])
  state[counterName] = Number(state[counterName]) + 1
  return value
}

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, '+08:00')
}

function createClientMessageId() {
  return generateRequestId()
}

function normalizeSeq(value) {
  var raw = String(value == null ? '' : value).trim()
  if (!/^\d+$/.test(raw)) {
    return '0'
  }
  return raw.replace(/^0+(?=\d)/, '') || '0'
}

function compareSeq(left, right) {
  var a = normalizeSeq(left)
  var b = normalizeSeq(right)
  if (a === b) {
    return 0
  }
  if (a.length !== b.length) {
    return a.length < b.length ? -1 : 1
  }
  return a < b ? -1 : 1
}

function incrementSeq(value) {
  var digits = normalizeSeq(value).split('')
  var carry = 1
  for (var i = digits.length - 1; i >= 0; i -= 1) {
    var next = Number(digits[i]) + carry
    if (next >= 10) {
      digits[i] = '0'
      carry = 1
    } else {
      digits[i] = String(next)
      carry = 0
      break
    }
  }
  if (carry) {
    digits.unshift('1')
  }
  return digits.join('').replace(/^0+(?=\d)/, '') || '0'
}

module.exports = {
  SELF_PUBLIC_ID: SELF_PUBLIC_ID,
  PEER_A_ID: PEER_A_ID,
  PEER_B_ID: PEER_B_ID,
  PEER_C_ID: PEER_C_ID,
  PEER_D_ID: PEER_D_ID,
  CLOSED_ID: CLOSED_ID,
  clone: clone,
  createDefaultSocialState: createDefaultSocialState,
  nextId: nextId,
  nowIso: nowIso,
  createClientMessageId: createClientMessageId,
  normalizeSeq: normalizeSeq,
  compareSeq: compareSeq,
  incrementSeq: incrementSeq
}
