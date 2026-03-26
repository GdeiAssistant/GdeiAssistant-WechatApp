const { getCommunityModule, getCommunityPageTitle } = require('../../constants/community.js')
const communityApi = require('../../services/apis/community.js')
const { getModuleHandler } = require('../../services/community/registry.js')
const userApi = require('../../services/apis/user.js')
const pageUtils = require('../../utils/page.js')
const i18n = require('../../utils/i18n.js')
var themeUtil = require('../../utils/theme')

function buildTabs(moduleId) {
  var handler = getModuleHandler(moduleId)
  if (handler && handler.buildCenterTabs) {
    return handler.buildCenterTabs()
  }

  return []
}

function normalizeStandardItem(item, options) {
  const config = options || {}
  return {
    id: config.id,
    title: config.title || i18n.t('community.list.unnamedContent'),
    subtitle: config.subtitle || '',
    summary: config.summary || '',
    cover: config.cover || '',
    priceText: config.priceText || '',
    actions: config.actions || [],
    canOpenDetail: config.canOpenDetail !== false
  }
}

function formatSecretPublishText(publishTime, timer) {
  const baseText = String(publishTime || '').trim()
  if (Number(timer) === 1) {
    var autoDeleteText = i18n.t('community.list.autoDelete24h')
    return baseText ? baseText + ' \u00b7 ' + autoDeleteText : autoDeleteText
  }
  return baseText
}

Page({
  data: {
    themeClass: '',
    moduleId: '',
    moduleConfig: null,
    tabs: [],
    activeTabKey: '',
    itemsByTab: {},
    activeItems: [],
    summaryProfile: null,
    hasShownOnce: false,
    loading: true,
    loadingMore: false,
    hasMore: true,
    pageStart: 0,
    pageSize: 20,
    errorMessage: null,
    t: {}
  },

  setActiveTab: function(tabKey) {
    const itemsByTab = this.data.itemsByTab || {}
    this.setData({
      activeTabKey: tabKey,
      activeItems: itemsByTab[tabKey] || []
    })
  },

  normalizeCenterData: function(moduleId, payload) {
    var handler = getModuleHandler(moduleId)
    if (handler && handler.normalizeCenterData) {
      return handler.normalizeCenterData(payload, normalizeStandardItem)
    }

    return {
      default: []
    }
  },

  loadSummaryProfile: function() {
    var handler = getModuleHandler(this.data.moduleId)
    var shouldShowProfile = handler ? !!handler.showSummaryProfile : (['ershou', 'lostandfound'].indexOf(this.data.moduleId) !== -1)

    if (!shouldShowProfile) {
      this.setData({
        summaryProfile: null
      })
      return Promise.resolve()
    }

    return userApi.getProfile().then((result) => {
      if (!result.success) {
        return
      }

      const profile = result.data || {}
      this.setData({
        summaryProfile: {
          avatar: profile.avatar || '/image/default.png',
          nickname: profile.nickname || profile.username || i18n.t('community.center.me'),
          introduction: profile.introduction || ''
        }
      })
    }).catch(() => {})
  },

  loadCenter: function() {
    var self = this
    self.setData({ pageStart: 0, hasMore: true })

    return pageUtils.runWithNavigationLoading(this, () => {
      return Promise.all([
        communityApi.getCenter(this.data.moduleId, { start: 0, size: this.data.pageSize }),
        this.loadSummaryProfile()
      ])
    }).then((resultList) => {
      const result = resultList[0]
      if (!result.success) {
        pageUtils.showTopTips(self, result.message || i18n.t('common.loadFailed'))
        return
      }

      var items = result.data || []
      const itemsByTab = self.normalizeCenterData(self.data.moduleId, items)
      const defaultTab = self.data.tabs.length ? self.data.tabs[0].key : 'default'
      self.setData({
        itemsByTab: itemsByTab,
        loading: false,
        pageStart: items.length,
        hasMore: items.length >= self.data.pageSize
      })
      self.setActiveTab(self.data.activeTabKey || defaultTab)
    }).catch((error) => {
      self.setData({
        loading: false
      })
      pageUtils.showTopTips(self, error.message)
    })
  },

  loadMoreCenter: function() {
    var self = this
    if (self.data.loadingMore || !self.data.hasMore) return

    self.setData({ loadingMore: true })

    communityApi.getCenter(self.data.moduleId, { start: self.data.pageStart, size: self.data.pageSize })
      .then(function(result) {
        if (!result.success) {
          pageUtils.showTopTips(self, result.message || i18n.t('common.loadFailed'))
          self.setData({ loadingMore: false })
          return
        }

        var newItems = result.data || []
        var normalized = self.normalizeCenterData(self.data.moduleId, newItems)
        var currentItems = self.data.itemsByTab || {}
        var mergedItems = {}

        Object.keys(normalized).forEach(function(tabKey) {
          mergedItems[tabKey] = (currentItems[tabKey] || []).concat(normalized[tabKey] || [])
        })
        Object.keys(currentItems).forEach(function(tabKey) {
          if (!mergedItems[tabKey]) {
            mergedItems[tabKey] = currentItems[tabKey]
          }
        })

        self.setData({
          itemsByTab: mergedItems,
          loadingMore: false,
          pageStart: self.data.pageStart + newItems.length,
          hasMore: newItems.length >= self.data.pageSize
        })
        self.setActiveTab(self.data.activeTabKey)
      })
      .catch(function(error) {
        self.setData({ loadingMore: false })
        pageUtils.showTopTips(self, error.message)
      })
  },

  switchTab: function(event) {
    const nextTabKey = event.currentTarget.dataset.key
    this.setActiveTab(nextTabKey)
  },

  openDetail: function(event) {
    const itemId = event.currentTarget.dataset.id
    const itemIndex = Number(event.currentTarget.dataset.index)
    const item = this.data.activeItems[itemIndex]
    if (!itemId) {
      return
    }

    if (item && item.canOpenDetail === false) {
      return
    }

    wx.navigateTo({
      url: '/pages/communityDetail/communityDetail?module=' + this.data.moduleId + '&id=' + itemId
    })
  },

  handleAction: function(event) {
    const action = event.currentTarget.dataset.action
    const itemId = event.currentTarget.dataset.id

    if (!action || !itemId) {
      return
    }

    if (action === 'edit') {
      wx.navigateTo({
        url: '/pages/communityPublish/communityPublish?module=' + this.data.moduleId + '&mode=edit&id=' + itemId
      })
      return
    }

    if (action.indexOf('state:') === 0) {
      const state = Number(action.split(':')[1])
      communityApi.updateSecondhandState(itemId, state).then((result) => {
        if (!result.success) {
          pageUtils.showTopTips(this, result.message || i18n.t('community.common.operationFailed'))
          return
        }
        this.loadCenter()
      }).catch((error) => {
        pageUtils.showTopTips(this, error.message)
      })
      return
    }

    if (action === 'didfound') {
      communityApi.markLostAndFoundDone(itemId).then((result) => {
        if (!result.success) {
          pageUtils.showTopTips(this, result.message || i18n.t('community.common.operationFailed'))
          return
        }
        this.loadCenter()
      }).catch((error) => {
        pageUtils.showTopTips(this, error.message)
      })
      return
    }

    if (action === 'acceptPick' || action === 'rejectPick') {
      communityApi.updateDatingPickState(itemId, action === 'acceptPick' ? 1 : -1).then((result) => {
        if (!result.success) {
          pageUtils.showTopTips(this, result.message || i18n.t('community.common.operationFailed'))
          return
        }
        this.loadCenter()
      }).catch((error) => {
        pageUtils.showTopTips(this, error.message)
      })
      return
    }

    if (action === 'hideProfile') {
      communityApi.updateDatingProfileState(itemId, 0).then((result) => {
        if (!result.success) {
          pageUtils.showTopTips(this, result.message || i18n.t('community.common.operationFailed'))
          return
        }
        this.loadCenter()
      }).catch((error) => {
        pageUtils.showTopTips(this, error.message)
      })
    }
  },

  openPublish: function() {
    wx.navigateTo({
      url: '/pages/communityPublish/communityPublish?module=' + this.data.moduleId
    })
  },

  refreshI18n: function() {
    var moduleConfig = this.data.moduleId ? getCommunityModule(this.data.moduleId) : this.data.moduleConfig
    var tabs = this.data.moduleId ? buildTabs(this.data.moduleId) : this.data.tabs

    var tData = {
      loading: i18n.t('community.list.loading'),
      loadMore: i18n.t('community.list.loadMore'),
      loadingMore: i18n.t('community.list.loading'),
      noMore: i18n.t('community.list.noMore'),
      emptyTitle: i18n.t('community.list.emptyTitle'),
      emptySummaryCenter: i18n.t('community.center.emptySummary'),
      continuePublish: i18n.t('community.center.continuePublish'),
      contactQQ: i18n.t('community.center.contactQQ'),
      contactWechat: i18n.t('community.center.contactWechat'),
      contactPending: i18n.t('community.center.contactPending')
    }

    this.setData({
      moduleConfig: moduleConfig,
      tabs: tabs,
      t: tData
    })

    if (moduleConfig) {
      wx.setNavigationBarTitle({
        title: getCommunityPageTitle(this.data.moduleId, 'center', moduleConfig.title)
      })
    }
  },

  onLoad: function(options) {
    const moduleId = options && options.module ? options.module : ''
    const moduleConfig = getCommunityModule(moduleId)
    if (!moduleConfig) {
      wx.showModal({
        title: i18n.t('community.common.notice'),
        content: i18n.t('community.common.unknownModule'),
        showCancel: false
      })
      return
    }

    const tabs = buildTabs(moduleId)
    const requestedTabKey = options && options.tab ? String(options.tab) : ''
    const initialTabKey = tabs.filter(function(tab) {
      return tab.key === requestedTabKey
    })[0] ? requestedTabKey : (tabs.length ? tabs[0].key : 'default')

    wx.setNavigationBarTitle({
      title: getCommunityPageTitle(moduleId, 'center', moduleConfig.title)
    })

    this.setData({
      moduleId: moduleId,
      moduleConfig: moduleConfig,
      tabs: tabs,
      activeTabKey: initialTabKey
    })
    this.refreshI18n()
    this.loadCenter()
  },

  onShow: function() {
    themeUtil.applyTheme(this)
    this.refreshI18n()
    if (!this.data.hasShownOnce) {
      this.setData({
        hasShownOnce: true
      })
      return
    }

    if (this.data.moduleId) {
      this.loadCenter()
    }
  },

  onShareAppMessage: function() {
    return {
      title: this.data.moduleConfig ? this.data.moduleConfig.title : i18n.t('community.common.campusCommunity'),
      path: '/pages/communityCenter/communityCenter?module=' + this.data.moduleId
    }
  }
})
