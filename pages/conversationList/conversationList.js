const socialApi = require('../../services/apis/social.js')
const messagesApi = require('../../services/apis/messages.js')
const socialRealtime = require('../../services/social-realtime.js')
const socialAvatar = require('../../services/social-avatar.js')
const pageUtils = require('../../utils/page.js')
const socialUtils = require('../../utils/social.js')
const themeUtil = require('../../utils/theme')
const tabBarUtil = require('../../utils/tab-bar')
const i18n = require('../../utils/i18n.js')

const POLL_MS = 30000

Page({
  data: {
    themeClass: '',
    t: {},
    conversations: [],
    nextCursor: null,
    hasMore: false,
    loading: false,
    listLoaded: false,
    interactionBadgeText: '',
    serviceBadgeText: '',
    announcementBadgeText: '',
    errorMessage: null
  },

  _pageVisible: false,

  refreshI18n: function () {
    this.setData({
      t: {
        navTitle: i18n.t('tabBar.messages'),
        empty: i18n.t('social.conversations.empty'),
        loading: i18n.t('common.loading'),
        noMessage: i18n.t('social.conversations.noMessage'),
        searchUsers: i18n.t('social.conversations.searchUsers'),
        noticesEntry: i18n.t('inboxPage.tabAnnouncement'),
        interactionEntry: i18n.t('inboxPage.tabInteraction'),
        serviceEntry: i18n.t('inboxPage.tabService'),
        directSection: i18n.t('social.entry.directMessages')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },

  openInbox: function (event) {
    var tab = (event && event.currentTarget && event.currentTarget.dataset.tab) || 'announcement'
    wx.navigateTo({ url: '/pages/inbox/inbox?tab=' + tab })
  },

  loadInteractionMeta: function () {
    const badge = count => count > 99 ? '99+' : count > 0 ? String(count) : ''
    return Promise.allSettled([messagesApi.getCategoriesUnread(), messagesApi.getAnnouncementUnread()]).then(results => {
      const categories = results[0].status === 'fulfilled' ? results[0].value : null
      const announcement = results[1].status === 'fulfilled' ? results[1].value : null
      if (categories && categories.success) this.setData({ interactionBadgeText: badge(categories.data.interaction), serviceBadgeText: badge(categories.data.service) })
      if (announcement && announcement.success) this.setData({ announcementBadgeText: badge(announcement.data) })
      if (!categories || !categories.success || !announcement || !announcement.success) pageUtils.showTopTips(this, i18n.t('common.networkError'))
    })
  },

  openUserSearch: function () {
    wx.navigateTo({ url: '/pages/userSearch/userSearch' })
  },

  normalizeConversation: function (item) {
    return Object.assign({}, item, {
      previewText: socialUtils.messagePreviewText(item.lastMessage),
      updatedAtText: item.updatedAt || '',
      peer: Object.assign({}, item.peer || {}, {
        displayAvatar: (item.peer && item.peer.displayAvatar) || socialUtils.PLACEHOLDER_AVATAR
      })
    })
  },

  loadList: function (reset) {
    if (this.data.loading) {
      return Promise.resolve()
    }
    this.setData({ loading: true })
    return socialApi
      .getConversations({
        cursor: reset ? null : this.data.nextCursor,
        limit: 20
      })
      .then((result) => {
        if (!result.success) {
          throw new Error(result.message)
        }
        const page = socialUtils.normalizePage(result.data)
        return socialAvatar
          .attachDisplayAvatars(
            page.items.map(function (item) {
              return item.peer
            })
          )
          .then((peers) => {
            const conversations = page.items.map((item, index) => {
              return this.normalizeConversation(
                Object.assign({}, item, {
                  peer: peers[index] || item.peer
                })
              )
            })
            if (!this._pageVisible && !reset) {
              this.setData({ loading: false })
              return
            }
            this.setData({
              conversations: reset ? conversations : this.data.conversations.concat(conversations),
              nextCursor: page.nextCursor,
              hasMore: page.hasMore,
              loading: false,
              listLoaded: true
            })
          })
      })
      .catch((error) => {
        this.setData({ loading: false })
        pageUtils.showTopTips(this, error.message)
      })
  },

  openChat: function (event) {
    socialUtils.openChat(event.currentTarget.dataset.id, event.currentTarget.dataset.peer)
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
        self.loadList(true)
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

  onRealtimeEvent: function () {
    if (!this._pageVisible) {
      return
    }
    this.loadList(true)
    this.loadInteractionMeta()
    tabBarUtil.refreshUnreadBadge(this)
  },

  onShow: function () {
    this._pageVisible = true
    themeUtil.applyTheme(this)
    tabBarUtil.syncTabBar(this, 1)
    tabBarUtil.refreshUnreadBadge(this)
    this.refreshI18n()
    socialRealtime.ensureConnected()
    this.loadInteractionMeta()
    this.loadList(true)
    this.startPolling()
    this._offMessage = socialRealtime.on('message.created', this.onRealtimeEvent.bind(this))
    this._offRead = socialRealtime.on('conversation.read', this.onRealtimeEvent.bind(this))
    this._offSocial = socialRealtime.on('social.changed', this.onRealtimeEvent.bind(this))
  },

  onHide: function () {
    this._pageVisible = false
    this.stopPolling()
    if (this._offMessage) this._offMessage()
    if (this._offRead) this._offRead()
    if (this._offSocial) this._offSocial()
    this._offMessage = null
    this._offRead = null
    this._offSocial = null
  },

  onUnload: function () {
    this.onHide()
  },

  onPullDownRefresh: function () {
    this.loadList(true).finally(function () {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadList(false)
    }
  }
})
