const storageKeys = require('../../constants/storage.js')
const messagesApi = require('../../services/apis/messages.js')
const pageUtils = require('../../utils/page.js')
var themeUtil = require('../../utils/theme')
const i18n = require('../../utils/i18n.js')

const PAGE_SIZE = 10
function getInboxTabs() {
  return [
    { key: 'announcement', label: i18n.t('inboxPage.tabAnnouncement') },
    { key: 'interaction', label: i18n.t('inboxPage.tabInteraction') }
  ]
}

function normalizeAnnouncementItem(item) {
  return {
    id: item.id,
    title: item.title || i18n.t('inboxPage.tabAnnouncement'),
    publishDate: item.publishDate || item.publishTime || item.createdAt || '',
    content: item.content || item.message || ''
  }
}

function normalizeInteractionModule(moduleId) {
  const normalizedModule = String(moduleId || '').trim().toLowerCase()

  switch (normalizedModule) {
    case 'secondhand':
    case 'marketplace':
      return 'ershou'
    case 'lost_found':
    case 'lostfound':
      return 'lostandfound'
    case 'roommate':
      return 'dating'
    default:
      return normalizedModule
  }
}

function buildInteractionModuleLabel(moduleId) {
  switch (moduleId) {
    case 'ershou':
      return i18n.t('inboxPage.moduleMarketplace')
    case 'lostandfound':
      return i18n.t('inboxPage.moduleLostFound')
    case 'secret':
      return i18n.t('inboxPage.moduleSecret')
    case 'express':
      return i18n.t('inboxPage.moduleExpress')
    case 'topic':
      return i18n.t('inboxPage.moduleTopic')
    case 'delivery':
      return i18n.t('inboxPage.moduleDelivery')
    case 'dating':
      return i18n.t('inboxPage.moduleDating')
    case 'photograph':
      return i18n.t('inboxPage.modulePhotograph')
    default:
      return i18n.t('inboxPage.tabInteraction')
  }
}

function buildInteractionActionLabel(item) {
  const normalizedType = String(item.targetType || item.type || '').trim().toLowerCase()

  switch (normalizedType) {
    case 'comment':
      return i18n.t('inboxPage.actionComment')
    case 'like':
      return i18n.t('inboxPage.actionLike')
    case 'guess':
      return i18n.t('inboxPage.actionGuess')
    case 'published':
      return i18n.t('inboxPage.actionPublished')
    case 'accepted':
      return i18n.t('inboxPage.actionAccepted')
    case 'sent':
      return i18n.t('inboxPage.actionSent')
    case 'received':
      return i18n.t('inboxPage.actionReceived')
    case 'posts':
      return i18n.t('inboxPage.actionPosts')
    default:
      return i18n.t('inboxPage.actionNew')
  }
}

function normalizeInteractionItem(item) {
  const moduleId = normalizeInteractionModule(item.module)

  return {
    id: item.id,
    moduleId: moduleId,
    title: item.title || buildInteractionModuleLabel(moduleId),
    content: item.content || item.message || i18n.t('inboxPage.newInteractionMessage'),
    createdAt: item.createdAt || '',
    targetType: item.targetType || '',
    targetId: item.targetId || '',
    targetSubId: item.targetSubId || '',
    isRead: !!item.isRead,
    moduleLabel: buildInteractionModuleLabel(moduleId),
    actionLabel: buildInteractionActionLabel(item),
    readLabel: item.isRead ? i18n.t('inboxPage.read') : i18n.t('inboxPage.unread')
  }
}

function buildInteractionUrl(item) {
  const targetId = String(item.targetId || '').trim()

  switch (item.moduleId) {
    case 'ershou':
    case 'lostandfound':
    case 'secret':
    case 'express':
    case 'topic':
    case 'photograph':
      return targetId
        ? `/pages/communityDetail/communityDetail?module=${item.moduleId}&id=${targetId}`
        : `/pages/communityList/communityList?module=${item.moduleId}`
    case 'delivery':
      return targetId
        ? `/pages/communityDetail/communityDetail?module=delivery&id=${targetId}`
        : '/pages/communityList/communityList?module=delivery'
    case 'dating': {
      const normalizedTargetType = String(item.targetType || '').trim().toLowerCase()
      const tabKey = normalizedTargetType === 'sent'
        ? 'sent'
        : (normalizedTargetType === 'posts' || normalizedTargetType === 'published' ? 'posts' : 'received')
      return `/pages/communityCenter/communityCenter?module=dating&tab=${tabKey}`
    }
    default:
      return ''
  }
}

Page({
  data: {
    themeClass: '',
    t: {},
    inboxTabs: getInboxTabs(),
    activeTab: 'announcement',
    announcementList: [],
    announcementLoading: false,
    announcementCurrentPage: 1,
    announcementFinished: false,
    interactionList: [],
    interactionLoading: false,
    interactionCurrentPage: 1,
    interactionFinished: false,
    interactionUnreadCount: 0,
    interactionLoaded: false,
    errorMessage: null
  },

  loadAnnouncementList: function(pageNumber, reset) {
    if (this.data.announcementLoading) {
      return Promise.resolve()
    }

    return pageUtils.runWithNavigationLoading(this, function() {
      return messagesApi.getAnnouncementList((pageNumber - 1) * PAGE_SIZE, PAGE_SIZE)
    }, {
      loadingKey: 'announcementLoading'
    }).then((result) => {
      if (!result.success) {
        throw new Error(result.message)
      }

      const announcementList = (Array.isArray(result.data) ? result.data : []).map(normalizeAnnouncementItem)
      this.setData({
        announcementList: reset ? announcementList : this.data.announcementList.concat(announcementList),
        announcementCurrentPage: pageNumber,
        announcementFinished: announcementList.length < PAGE_SIZE
      })
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  loadInteractionMeta: function() {
    return messagesApi.getUnreadCount().then((result) => {
      if (!result.success) {
        throw new Error(result.message)
      }

      this.setData({
        interactionUnreadCount: Number(result.data || 0)
      })
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  loadInteractionList: function(pageNumber, reset) {
    if (this.data.interactionLoading) {
      return Promise.resolve()
    }

    return pageUtils.runWithNavigationLoading(this, function() {
      return messagesApi.getInteractionList((pageNumber - 1) * PAGE_SIZE, PAGE_SIZE)
    }, {
      loadingKey: 'interactionLoading'
    }).then((result) => {
      if (!result.success) {
        throw new Error(result.message)
      }

      const interactionList = (Array.isArray(result.data) ? result.data : []).map(normalizeInteractionItem)
      this.setData({
        interactionList: reset ? interactionList : this.data.interactionList.concat(interactionList),
        interactionCurrentPage: pageNumber,
        interactionFinished: interactionList.length < PAGE_SIZE
      })
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  switchTab: function(event) {
    const nextTab = event.currentTarget.dataset.key
    if (!nextTab || nextTab === this.data.activeTab) {
      return
    }

    this.setData({
      activeTab: nextTab
    })

    if (nextTab === 'interaction' && !this.data.interactionLoaded) {
      this.loadInteractionList(1, true).then(() => {
        this.setData({ interactionLoaded: true })
      })
    }
  },

  openAnnouncementDetail: function(event) {
    const index = Number(event.currentTarget.dataset.index)
    const item = this.data.announcementList[index]

    if (!item) {
      return
    }

    wx.setStorageSync(storageKeys.newsDetailItem, {
      id: item.id,
      title: item.title,
      publishDate: item.publishDate || '',
      content: item.content || '',
      navigationTitle: this.data.t.tabAnnouncement
    })
    wx.navigateTo({
      url: `/pages/newsDetail/newsDetail?mode=announcement&id=${encodeURIComponent(item.id)}`
    })
  },

  updateInteractionReadState: function(messageId, nextReadState) {
    let unreadDelta = 0
    const interactionList = (this.data.interactionList || []).map(function(item) {
      if (item.id === messageId) {
        if (!item.isRead && nextReadState) {
          unreadDelta = 1
        }
        return Object.assign({}, item, {
          isRead: nextReadState,
          readLabel: nextReadState ? i18n.t('inboxPage.read') : i18n.t('inboxPage.unread')
        })
      }
      return item
    })

    this.setData({
      interactionList: interactionList,
      interactionUnreadCount: Math.max(0, Number(this.data.interactionUnreadCount || 0) - unreadDelta)
    })
  },

  openInteractionItem: function(event) {
    const index = Number(event.currentTarget.dataset.index)
    const item = this.data.interactionList[index]

    if (!item) {
      return
    }

    const targetUrl = buildInteractionUrl(item)
    if (!targetUrl) {
      pageUtils.showTopTips(this, this.data.t.navigationUnsupported)
      return
    }

    if (!item.isRead) {
      this.updateInteractionReadState(item.id, true)
      messagesApi.markMessageRead(item.id).catch(() => {
        this.refreshInteraction()
      })
    }

    wx.navigateTo({
      url: targetUrl
    })
  },

  markAllInteractionRead: function() {
    if (Number(this.data.interactionUnreadCount || 0) <= 0) {
      return
    }

    this.setData({
      interactionUnreadCount: 0,
      interactionList: (this.data.interactionList || []).map(function(item) {
        return Object.assign({}, item, {
          isRead: true,
          readLabel: i18n.t('inboxPage.read')
        })
      })
    })

    messagesApi.markAllMessagesRead().then((result) => {
      if (!result.success) {
        throw new Error(result.message)
      }
    }).catch(() => {
      this.refreshInteraction()
    })
  },

  refreshInteraction: function() {
    return Promise.all([
      this.loadInteractionMeta(),
      this.loadInteractionList(1, true)
    ])
  },

  onLoad: function() {
    this.loadAnnouncementList(1, true)
    this.loadInteractionMeta()
  },

  onShow: function() {
    themeUtil.applyTheme(this)
    this.refreshI18n()
    if (this.data.activeTab === 'interaction') {
      this.loadInteractionMeta()
    }
  },

  onPullDownRefresh: function() {
    var self = this
    var refreshTask
    if (this.data.activeTab === 'announcement') {
      refreshTask = this.loadAnnouncementList(1, true)
    } else {
      refreshTask = this.refreshInteraction().then(function() {
        self.setData({ interactionLoaded: true })
      })
    }

    refreshTask.finally(function() {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom: function() {
    if (this.data.activeTab === 'announcement') {
      if (!this.data.announcementFinished && !this.data.announcementLoading) {
        this.loadAnnouncementList(this.data.announcementCurrentPage + 1, false)
      }
      return
    }

    if (this.data.interactionLoaded && !this.data.interactionFinished && !this.data.interactionLoading) {
      this.loadInteractionList(this.data.interactionCurrentPage + 1, false)
    }
  },

  onShareAppMessage: function() {
    return {
      title: this.data.t.shareTitle,
      path: '/pages/inbox/inbox'
    }
  },

  refreshI18n: function() {
    this.setData({
      t: {
        navTitle: i18n.t('inboxPage.navTitle'),
        tabAnnouncement: i18n.t('inboxPage.tabAnnouncement'),
        tabInteraction: i18n.t('inboxPage.tabInteraction'),
        loadingAnnouncement: i18n.t('inboxPage.loadingAnnouncement'),
        noMoreAnnouncement: i18n.t('inboxPage.noMoreAnnouncement'),
        noAnnouncement: i18n.t('inboxPage.noAnnouncement'),
        unreadCount: i18n.t('inboxPage.unreadCount'),
        markAllRead: i18n.t('inboxPage.markAllRead'),
        loadingInteraction: i18n.t('inboxPage.loadingInteraction'),
        noMoreInteraction: i18n.t('inboxPage.noMoreInteraction'),
        noInteraction: i18n.t('inboxPage.noInteraction'),
        navigationUnsupported: i18n.t('inboxPage.navigationUnsupported'),
        shareTitle: i18n.t('inboxPage.shareTitle')
      },
      inboxTabs: getInboxTabs()
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  }
})
