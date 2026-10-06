const socialApi = require('../../services/apis/social.js')
const socialRealtime = require('../../services/social-realtime.js')
const socialAvatar = require('../../services/social-avatar.js')
const socialChatImage = require('../../services/social-chat-image.js')
const auth = require('../../services/auth.js')
const pageUtils = require('../../utils/page.js')
const socialUtils = require('../../utils/social.js')
const themeUtil = require('../../utils/theme')
const i18n = require('../../utils/i18n.js')

const POLL_MS = 10000

function imageSessionMatches(token) {
  socialChatImage.syncSession()
  return !!token && token === auth.getSessionToken()
}

function statusLabel(status) {
  if (status === 'pending') {
    return i18n.t('social.chat.pending')
  }
  if (status === 'failed') {
    return i18n.t('social.chat.failedRetry')
  }
  return i18n.t('social.chat.sent')
}

function formatTimeText(value) {
  const raw = String(value || '')
  if (!raw) {
    return ''
  }
  const matched = raw.match(/(\d{2}:\d{2})/)
  return matched ? matched[1] : raw
}

Page({
  data: {
    themeClass: '',
    t: {},
    conversationId: '',
    peerId: '',
    selfId: '',
    conversation: null,
    peerDisplayAvatar: '/image/default.png',
    messages: [],
    draft: '',
    canSend: true,
    imageMessagingEnabled: false,
    sendHint: '',
    hasMoreEarlier: false,
    earlierCursor: null,
    sending: false,
    scrollIntoView: '',
    errorMessage: null,
    imageDraftPath: ''
  },

  _pageVisible: false,
  _pageEpoch: 0,

  refreshI18n: function () {
    this.setData({
      t: {
        navTitle: i18n.t('social.chat.navTitle'),
        loadEarlier: i18n.t('social.chat.loadEarlier'),
        inputPlaceholder: i18n.t('social.chat.inputPlaceholder'),
        send: i18n.t('social.chat.send'),
        image: i18n.t('social.chat.image'),
        cancel: i18n.t('common.cancel'),
        imageLoading: i18n.t('social.chat.imageLoading'),
        imageTooLarge: i18n.t('social.chat.imageTooLarge') + ' · ≤ 4096 px · ≤ 16 MP',
        imageTypeInvalid: i18n.t('social.chat.imageTypeInvalid'),
        imageDisabled: i18n.t('social.chat.imageDisabled')
      }
    })
    if (this.data.conversation && this.data.conversation.peer) {
      wx.setNavigationBarTitle({ title: this.data.conversation.peer.nickname })
    } else {
      wx.setNavigationBarTitle({ title: this.data.t.navTitle })
    }
  },

  decorateMessage: function (item, selfId) {
    const mine = item.senderId === selfId || !!item.mine
    const status = item.status || 'sent'
    const type = String(item.type || 'TEXT').toUpperCase() === 'IMAGE' ? 'IMAGE' : 'TEXT'
    const localKey = item.id
      ? String(item.id)
      : String(item.conversationId || this.data.conversationId || '') +
        ':' +
        String(item.senderId || '') +
        ':' +
        String(item.clientMessageId || '')
    return Object.assign({}, item, {
      conversationId: item.conversationId || this.data.conversationId,
      type: type,
      isImage: type === 'IMAGE',
      mine: mine,
      status: status,
      statusLabel: mine ? statusLabel(status) : '',
      timeText: formatTimeText(item.createdAt),
      displayPath: item.displayPath || '',
      localKey: localKey
    })
  },

  applyMessages: function (list, options) {
    if (this._unloaded) {
      return Promise.resolve()
    }
    const config = options || {}
    const previousFirstKey =
      this.data.messages && this.data.messages[0] ? this.data.messages[0].localKey : ''
    const epoch = this._pageEpoch
    const token = auth.getSessionToken()
    const hasImages = (list || []).some(socialUtils.isImageMessage)
    return socialChatImage.attachDisplayPaths(list).then((resolved) => {
      if (
        this._unloaded ||
        (hasImages && !imageSessionMatches(token)) ||
        epoch !== this._pageEpoch ||
        (config.requireVisible && !this._pageVisible)
      ) {
        return
      }
      const messages = resolved.map((item) => this.decorateMessage(item, this.data.selfId))
      let scrollIntoView = ''
      if (config.preserveFirstVisible && previousFirstKey) {
        scrollIntoView = 'msg-' + previousFirstKey
      } else if (messages.length && !config.skipScroll) {
        scrollIntoView = 'msg-' + messages[messages.length - 1].localKey
      } else {
        scrollIntoView = this.data.scrollIntoView
      }
      this.setData({
        messages: messages,
        scrollIntoView: scrollIntoView
      })
    })
  },

  setMessages: function (list) {
    const merged = socialUtils.mergeMessagesById([], list)
    return this.applyMessages(merged)
  },

  appendOrReplaceMessages: function (incoming, options) {
    const merged = socialUtils.mergeMessagesById(this.data.messages, incoming)
    return this.applyMessages(merged, options)
  },

  ensureConversation: function () {
    if (this.data.conversationId) {
      return socialApi.getConversation(this.data.conversationId)
    }
    return socialApi.createConversation(this.data.peerId)
  },

  bindConversation: function (conversation) {
    const peer = conversation.peer || {}
    this.setData({
      conversationId: conversation.id,
      peerId: peer.id,
      conversation: conversation,
      canSend: !!conversation.canSend,
      imageMessagingEnabled: !!conversation.imageMessagingEnabled,
      sendHint: socialUtils.permissionMessage(conversation.sendPermissionReason)
    })
    this.refreshI18n()
    return socialAvatar.attachDisplayAvatar(peer).then((resolved) => {
      if (!this._pageVisible) {
        return
      }
      this.setData({
        peerDisplayAvatar: resolved.displayAvatar || '/image/default.png',
        conversation: Object.assign({}, conversation, { peer: resolved })
      })
    })
  },

  loadBootstrap: function () {
    return socialApi
      .getMe()
      .then((meResult) => {
        if (!meResult.success) {
          throw new Error(meResult.message)
        }
        this.setData({ selfId: meResult.data.id })
        return this.ensureConversation()
      })
      .then((result) => {
        if (!result.success) {
          throw new Error(result.message)
        }
        return this.bindConversation(result.data).then(() => {
          return socialApi.getMessages(result.data.id, { limit: 20 })
        })
      })
      .then((result) => {
        if (!result.success) {
          throw new Error(result.message)
        }
        const page = socialUtils.normalizePage(result.data)
        return this.setMessages(page.items).then(() => {
          this.setData({
            hasMoreEarlier: page.hasMore,
            earlierCursor: page.nextCursor
          })
          return this.markReadLatest()
        })
      })
      .catch((error) => {
        pageUtils.showTopTips(this, error.message || socialUtils.permissionMessage(error.errorCode))
      })
  },

  markReadLatest: function () {
    if (!this._pageVisible) {
      return Promise.resolve()
    }
    const messages = this.data.messages || []
    let latestPeerSeq = null
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const item = messages[i]
      if (!item || item.mine || !item.id || !item.seq) {
        continue
      }
      if (socialUtils.normalizeSeq(item.seq) === '0') {
        continue
      }
      latestPeerSeq = item.seq
      break
    }
    if (!latestPeerSeq || !this.data.conversationId) {
      return Promise.resolve()
    }
    return socialApi
      .markConversationRead(this.data.conversationId, latestPeerSeq)
      .catch(function () {
        // Ignore read failures; next foreground sync will retry.
      })
  },

  loadEarlier: function () {
    if (!this.data.hasMoreEarlier || !this.data.conversationId) {
      return
    }
    const epoch = this._pageEpoch
    const token = auth.getSessionToken()
    const isCurrent = () =>
      !this._unloaded && epoch === this._pageEpoch && token === auth.getSessionToken()
    socialApi
      .getMessages(this.data.conversationId, {
        beforeSeq: this.data.earlierCursor || (this.data.messages[0] && this.data.messages[0].seq),
        limit: 20
      })
      .then((result) => {
        if (!isCurrent()) return
        if (!result.success) {
          throw new Error(result.message)
        }
        const page = socialUtils.normalizePage(result.data)
        return this.appendOrReplaceMessages(page.items, { preserveFirstVisible: true }).then(() => {
          if (!isCurrent()) return
          this.setData({
            hasMoreEarlier: page.hasMore,
            earlierCursor: page.nextCursor
          })
        })
      })
      .catch((error) => {
        if (!isCurrent()) return
        pageUtils.showTopTips(this, error.message)
      })
  },

  pullNewer: function () {
    if (!this.data.conversationId || !this._pageVisible) {
      return Promise.resolve()
    }
    const lastSeq = (this.data.messages || []).reduce(function (max, item) {
      if (!item || !item.id || !item.seq) {
        return max
      }
      if (item.status === 'pending' || item.status === 'failed') {
        return max
      }
      if (socialUtils.normalizeSeq(item.seq) === '0') {
        return max
      }
      return socialUtils.maxSeq(max, item.seq)
    }, '0')

    return Promise.all([
      socialApi.getConversation(this.data.conversationId),
      socialApi.getMessages(this.data.conversationId, {
        afterSeq: lastSeq !== '0' ? lastSeq : undefined,
        limit: 50
      })
    ])
      .then((results) => {
        if (!this._pageVisible) {
          return
        }
        const conversationResult = results[0]
        const messagesResult = results[1]
        const chain = conversationResult.success
          ? this.bindConversation(conversationResult.data)
          : Promise.resolve()
        return chain.then(() => {
          if (!messagesResult.success) {
            return
          }
          const page = socialUtils.normalizePage(messagesResult.data)
          if (page.items.length) {
            return this.appendOrReplaceMessages(page.items).then(() => this.markReadLatest())
          }
          if (lastSeq === '0') {
            return this.setMessages(page.items)
          }
        })
      })
      .catch(function () {
        // Ignore background sync failures.
      })
  },

  onDraftInput: function (event) {
    this.setData({ draft: event.detail.value })
  },

  sendWithClientId: function (clientMessageId, content) {
    const conversationId = this.data.conversationId
    const selfId = this.data.selfId
    const local = this.decorateMessage(
      {
        conversationId: conversationId,
        clientMessageId: clientMessageId,
        type: 'TEXT',
        content: content,
        senderId: selfId,
        mine: true,
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      selfId
    )
    this.appendOrReplaceMessages([local])
    this.setData({ sending: true })

    return socialApi
      .sendMessage(conversationId, clientMessageId, content)
      .then((result) => {
        if (!result.success) {
          throw Object.assign(new Error(result.message), { errorCode: result.errorCode })
        }
        return this.appendOrReplaceMessages([
          Object.assign({}, result.data, {
            conversationId: conversationId,
            status: 'sent',
            mine: true
          })
        ]).then(() => {
          this.setData({ draft: '', sending: false })
        })
      })
      .catch((error) => {
        const committed = (this.data.messages || []).some(function (item) {
          return (
            !!item &&
            !!item.id &&
            String(item.conversationId || '') === String(conversationId || '') &&
            String(item.senderId || '') === String(selfId || '') &&
            String(item.clientMessageId || '') === String(clientMessageId || '')
          )
        })
        if (committed) {
          this.setData({ sending: false })
          return
        }
        const failed = this.decorateMessage(
          {
            conversationId: conversationId,
            clientMessageId: clientMessageId,
            type: 'TEXT',
            content: content,
            senderId: selfId,
            mine: true,
            status: 'failed'
          },
          selfId
        )
        this.appendOrReplaceMessages([failed])
        this.setData({ sending: false })
        if (error.errorCode === 'PRIVACY_RESTRICTED' || error.errorCode === 'CONTACT_UNAVAILABLE') {
          this.setData({
            canSend: false,
            sendHint: socialUtils.permissionMessage(error.errorCode)
          })
          this.pullNewer()
        }
        pageUtils.showTopTips(this, error.message || socialUtils.permissionMessage(error.errorCode))
      })
  },

  sendImageWithClientId: function (clientMessageId, filePath) {
    const epoch = this._pageEpoch
    const token = auth.getSessionToken()
    const isCurrent = () =>
      !this._unloaded &&
      this._pageVisible &&
      epoch === this._pageEpoch &&
      imageSessionMatches(token)
    if (!isCurrent() || !socialChatImage.canUseLocalFile(filePath)) return Promise.resolve()
    const conversationId = this.data.conversationId
    const selfId = this.data.selfId
    const local = this.decorateMessage(
      {
        conversationId: conversationId,
        clientMessageId: clientMessageId,
        type: 'IMAGE',
        content: '',
        localPath: filePath,
        displayPath: filePath,
        senderId: selfId,
        mine: true,
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      selfId
    )
    this.appendOrReplaceMessages([local])
    this._imageSending = true
    this.setData({ sending: true, imageDraftPath: '' })

    return socialApi
      .sendImageMessage(conversationId, clientMessageId, filePath)
      .then((result) => {
        if (!isCurrent()) return
        if (!result.success) {
          throw Object.assign(new Error(result.message), { errorCode: result.errorCode })
        }
        return this.appendOrReplaceMessages([
          Object.assign({}, result.data, {
            conversationId: conversationId,
            localPath: filePath,
            status: 'sent',
            mine: true
          })
        ]).then(() => {
          if (!isCurrent()) return
          this._imageSending = false
          this.setData({ sending: false })
        })
      })
      .catch((error) => {
        if (!isCurrent()) return
        this._imageSending = false
        const committed = (this.data.messages || []).some(function (item) {
          return (
            !!item &&
            !!item.id &&
            String(item.conversationId || '') === String(conversationId || '') &&
            String(item.senderId || '') === String(selfId || '') &&
            String(item.clientMessageId || '') === String(clientMessageId || '')
          )
        })
        if (committed) {
          this.setData({ sending: false })
          return
        }
        const failed = this.decorateMessage(
          {
            conversationId: conversationId,
            clientMessageId: clientMessageId,
            type: 'IMAGE',
            content: '',
            localPath: filePath,
            displayPath: filePath,
            senderId: selfId,
            mine: true,
            status: 'failed'
          },
          selfId
        )
        this.appendOrReplaceMessages([failed])
        this.setData({ sending: false })
        if (error.errorCode === 'PRIVACY_RESTRICTED' || error.errorCode === 'CONTACT_UNAVAILABLE') {
          this.setData({
            canSend: false,
            sendHint: socialUtils.permissionMessage(error.errorCode)
          })
          this.pullNewer()
        }
        pageUtils.showTopTips(this, error.message || socialUtils.permissionMessage(error.errorCode))
      })
  },

  send: function () {
    if (!this.data.canSend || this.data.sending) {
      return
    }
    const content = String(this.data.draft || '').trim()
    if (!content) {
      return
    }
    const clientMessageId = socialUtils.createClientMessageId()
    this.sendWithClientId(clientMessageId, content)
  },

  chooseImage: function () {
    if (!this.data.canSend || this.data.sending) {
      return
    }
    if (!this.data.imageMessagingEnabled) {
      pageUtils.showTopTips(this, this.data.t.imageDisabled)
      return
    }
    const self = this
    const token = auth.getSessionToken()
    const selectionEpoch = (this._imageSelectionEpoch || 0) + 1
    this._imageSelectionEpoch = selectionEpoch
    const isCurrent = () =>
      !self._unloaded && selectionEpoch === self._imageSelectionEpoch && imageSessionMatches(token)
    // The native picker may hide the page. Its callback follows the selection lifetime,
    // not the foreground epoch used by message requests.
    return new Promise(function (resolve) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: function (result) {
          if (!isCurrent()) return resolve()
          const file = result && result.tempFiles && result.tempFiles[0]
          if (!file || !file.tempFilePath) return resolve()
          socialChatImage
            .prepareImage(String(file.tempFilePath), token)
            .then(function (path) {
              if (!isCurrent()) {
                socialChatImage.releaseFile(path)
                resolve()
                return
              }
              socialChatImage.releaseFile(self.data.imageDraftPath)
              self.setData({ imageDraftPath: path })
              resolve()
            })
            .catch(function (error) {
              if (isCurrent() && error.imageError !== 'sessionChanged') {
                pageUtils.showTopTips(
                  self,
                  self.data.t[error.imageError] || i18n.t('upload.readLocalFileFailed')
                )
              }
              resolve()
            })
        },
        fail: function () {
          resolve()
        }
      })
    })
  },

  cancelImageDraft: function () {
    this._imageSelectionEpoch = (this._imageSelectionEpoch || 0) + 1
    socialChatImage.releaseFile(this.data.imageDraftPath)
    this.setData({ imageDraftPath: '' })
  },

  confirmImageDraft: function () {
    if (!this.data.canSend || this.data.sending || !this.data.imageDraftPath) {
      return
    }
    const clientMessageId = socialUtils.createClientMessageId()
    this.sendImageWithClientId(clientMessageId, this.data.imageDraftPath)
  },

  retryMessage: function (event) {
    const clientMessageId = event.currentTarget.dataset.clientId
    const target = (this.data.messages || []).filter(function (item) {
      return item.clientMessageId === clientMessageId && item.status === 'failed'
    })[0]
    if (!target || !target.clientMessageId || this.data.sending) {
      return
    }
    if (socialUtils.isImageMessage(target)) {
      if (!target.localPath) {
        return
      }
      this.sendImageWithClientId(target.clientMessageId, target.localPath)
      return
    }
    if (!String(target.content || '').trim()) {
      return
    }
    this.sendWithClientId(target.clientMessageId, target.content)
  },

  onImageTap: function (event) {
    const dataset = (event && event.currentTarget && event.currentTarget.dataset) || {}
    const localKey = dataset.localKey
    const clientMessageId = dataset.clientId
    const messages = this.data.messages || []
    let target = null
    if (localKey) {
      for (let i = 0; i < messages.length; i++) {
        if (messages[i].localKey === localKey) {
          target = messages[i]
          break
        }
      }
    } else if (clientMessageId) {
      const matches = messages.filter(function (item) {
        return item.clientMessageId === clientMessageId
      })
      if (matches.length === 1) {
        target = matches[0]
      }
    }
    if (!target) {
      return
    }
    if (target.status === 'failed') {
      this.retryMessage(event)
      return
    }
    const token = auth.getSessionToken()
    const epoch = this._pageEpoch
    return socialChatImage.resolveMessageImage(target).then((path) => {
      if (
        !path ||
        this._unloaded ||
        !this._pageVisible ||
        epoch !== this._pageEpoch ||
        !imageSessionMatches(token)
      )
        return
      wx.previewImage({ current: path, urls: [path] })
    })
  },

  onRealtimeMessage: function (payload) {
    if (!this._pageVisible) {
      return
    }
    if (!payload || String(payload.conversationId) !== String(this.data.conversationId)) {
      return
    }
    this.pullNewer()
  },

  onRealtimeSocial: function () {
    if (!this._pageVisible) {
      return
    }
    this.pullNewer()
  },

  startPolling: function () {
    this.stopPolling()
    if (!this._pageVisible) {
      return
    }
    const self = this
    const tick = function () {
      self._pollTimer = setTimeout(function () {
        if (!self._pageVisible) {
          return
        }
        self.pullNewer()
        tick()
      }, POLL_MS)
    }
    tick()
  },

  stopPolling: function () {
    if (this._pollTimer) {
      clearTimeout(this._pollTimer)
      this._pollTimer = null
    }
  },

  onLoad: function (options) {
    this._unloaded = false
    this._imageSessionToken = auth.getSessionToken()
    this._pageEpoch += 1
    this.setData({
      conversationId: String((options && options.id) || ''),
      peerId: String((options && options.peerId) || '')
    })
    this.loadBootstrap()
  },

  onShow: function () {
    const token = auth.getSessionToken()
    if (this._imageSessionToken !== undefined && token !== this._imageSessionToken) {
      socialChatImage.clearCache()
      this._imageSelectionEpoch = (this._imageSelectionEpoch || 0) + 1
      this.setData({ imageDraftPath: '', messages: [], sending: false })
    }
    this._imageSessionToken = token
    this._pageVisible = true
    themeUtil.applyTheme(this)
    this.refreshI18n()
    socialRealtime.ensureConnected()
    this.startPolling()
    this._offMessage = socialRealtime.on('message.created', this.onRealtimeMessage.bind(this))
    this._offRead = socialRealtime.on('conversation.read', this.onRealtimeMessage.bind(this))
    this._offSocial = socialRealtime.on('social.changed', this.onRealtimeSocial.bind(this))
    if (this.data.conversationId) {
      this.pullNewer()
    }
  },

  onHide: function () {
    this._pageVisible = false
    this._pageEpoch += 1
    if (this._imageSending) {
      this._imageSending = false
      this.setData({
        sending: false,
        messages: (this.data.messages || []).map((item) =>
          item.type === 'IMAGE' && item.status === 'pending'
            ? this.decorateMessage(Object.assign({}, item, { status: 'failed' }), this.data.selfId)
            : item
        )
      })
    }
    this.stopPolling()
    if (this._offMessage) this._offMessage()
    if (this._offRead) this._offRead()
    if (this._offSocial) this._offSocial()
    this._offMessage = null
    this._offRead = null
    this._offSocial = null
  },

  onUnload: function () {
    this._unloaded = true
    this._imageSelectionEpoch = (this._imageSelectionEpoch || 0) + 1
    this.onHide()
    socialChatImage.clearCache()
  }
})
