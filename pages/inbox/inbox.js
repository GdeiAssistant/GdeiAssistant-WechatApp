const storageKeys = require('../../constants/storage.js')
const messagesApi = require('../../services/apis/messages.js')
const pageUtils = require('../../utils/page.js')
var themeUtil = require('../../utils/theme')

const PAGE_SIZE = 10
const INBOX_TABS = [
  { key: 'announcement', label: '系统公告' },
  { key: 'interaction', label: '互动消息' }
]

function normalizeAnnouncementItem(item) {
  return {
    id: item.id,
    title: item.title || '系统公告',
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
      return '二手交易'
    case 'lostandfound':
      return '失物招领'
    case 'secret':
      return '校园树洞'
    case 'express':
      return '表白墙'
    case 'topic':
      return '校园话题'
    case 'delivery':
      return '全民快递'
    case 'dating':
      return '卖室友'
    case 'photograph':
      return '拍好校园'
    default:
      return '互动消息'
  }
}

function buildInteractionActionLabel(item) {
  const normalizedType = String(item.targetType || item.type || '').trim().toLowerCase()

  switch (normalizedType) {
    case 'comment':
      return '评论'
    case 'like':
      return '点赞'
    case 'guess':
      return '猜名字'
    case 'published':
      return '我发布的'
    case 'accepted':
      return '我接的'
    case 'sent':
      return '我发出的'
    case 'received':
      return '我收到的'
    case 'posts':
      return '我的发布'
    default:
      return '新动态'
  }
}

function normalizeInteractionItem(item) {
  const moduleId = normalizeInteractionModule(item.module)

  return {
    id: item.id,
    moduleId: moduleId,
    title: item.title || buildInteractionModuleLabel(moduleId),
    content: item.content || item.message || '你有一条新的互动消息',
    createdAt: item.createdAt || '',
    targetType: item.targetType || '',
    targetId: item.targetId || '',
    targetSubId: item.targetSubId || '',
    isRead: !!item.isRead,
    moduleLabel: buildInteractionModuleLabel(moduleId),
    actionLabel: buildInteractionActionLabel(item),
    readLabel: item.isRead ? '已读' : '未读'
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
    inboxTabs: INBOX_TABS,
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
      navigationTitle: '系统公告'
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
          readLabel: nextReadState ? '已读' : '未读'
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
      pageUtils.showTopTips(this, '该互动消息暂不支持跳转')
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
          readLabel: '已读'
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
    this.refreshInteraction()
  },

  onShow: function() {
    themeUtil.applyTheme(this)
    if (this.data.activeTab === 'interaction') {
      this.loadInteractionMeta()
    }
  },

  onPullDownRefresh: function() {
    const refreshTask = this.data.activeTab === 'announcement'
      ? this.loadAnnouncementList(1, true)
      : this.refreshInteraction()

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

    if (!this.data.interactionFinished && !this.data.interactionLoading) {
      this.loadInteractionList(this.data.interactionCurrentPage + 1, false)
    }
  },

  onShareAppMessage: function() {
    return {
      title: '收件通知',
      path: '/pages/inbox/inbox'
    }
  }
})
