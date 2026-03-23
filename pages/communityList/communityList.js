const {
  getCommunityModule,
  getSecondhandCategoryOptions,
  getLostFoundModeDictionaryOptions,
  getLostFoundItemDictionaryOptions,
  getDeliveryStatusOptions,
  getDatingAreaOptions,
  getDatingGradeOptions
} = require('../../constants/community.js')
const { fetchProfileOptions } = require('../../constants/profile.js')
const communityApi = require('../../services/apis/community.js')
const { getModuleHandler } = require('../../services/community/registry.js')
const pageUtils = require('../../utils/page.js')
const i18n = require('../../utils/i18n.js')
var themeUtil = require('../../utils/theme')

function findLabel(options, value, fallback) {
  const item = (options || []).filter(function(optionItem) {
    return Number(optionItem.value) === Number(value) || Number(optionItem.feedValue) === Number(value)
  })[0]
  return item ? item.label : (fallback || '')
}

function formatPrice(value) {
  const price = Number(value || 0)
  return price ? price.toFixed(2) : '0.00'
}

function formatSecretPublishText(publishTime, timer) {
  const baseText = String(publishTime || '').trim()
  if (Number(timer) === 1) {
    var autoDeleteText = i18n.t('community.list.autoDelete24h')
    return baseText ? baseText + ' \u00b7 ' + autoDeleteText : autoDeleteText
  }
  return baseText
}

function normalizeItem(moduleId, item) {
  var handler = getModuleHandler(moduleId)
  if (handler && handler.normalizeItem) {
    return handler.normalizeItem(item)
  }

  const rawItem = item || {}

  switch (moduleId) {
    case 'delivery':
      return {
        id: rawItem.orderId,
        title: rawItem.company || i18n.t('community.list.campusErrand'),
        summary: rawItem.address || '',
        priceText: formatPrice(rawItem.price),
        badgeText: findLabel(getDeliveryStatusOptions(), rawItem.state, i18n.t('community.list.task')),
        metaText: rawItem.remarks || '',
        timeText: rawItem.orderTime || '',
        raw: rawItem
      }
    case 'dating':
      return {
        id: rawItem.profileId,
        title: rawItem.nickname || i18n.t('community.list.anonStudent'),
        summary: rawItem.content || '',
        cover: rawItem.pictureURL || '/image/dating.png',
        badgeText: findLabel(getDatingGradeOptions(), rawItem.grade, i18n.t('community.list.unknownGrade')),
        metaText: rawItem.faculty || '',
        timeText: rawItem.hometown || '',
        raw: rawItem
      }
    default:
      return {
        id: rawItem.id,
        title: rawItem.title || i18n.t('community.list.unnamedContent'),
        summary: rawItem.content || '',
        raw: rawItem
      }
  }
}

Page({
  data: {
    themeClass: '',
    moduleId: '',
    moduleConfig: null,
    searchKeyword: '',
    inputKeyword: '',
    tabs: [],
    activeTabIndex: 0,
    items: [],
    currentPage: 1,
    pageSize: 10,
    finished: false,
    loading: false,
    errorMessage: null,
    stats: null,
    t: {}
  },

  buildTabs: function(moduleId) {
    var handler = getModuleHandler(moduleId)
    if (handler && handler.buildListTabs) {
      return handler.buildListTabs()
    }

    switch (moduleId) {
      case 'delivery':
        return getDeliveryStatusOptions()
      case 'dating':
        return getDatingAreaOptions()
      default:
        return []
    }
  },

  getActiveTab: function() {
    return (this.data.tabs || [])[this.data.activeTabIndex] || null
  },

  buildFeedOptions: function(pageNumber) {
    const moduleId = this.data.moduleId
    const activeTab = this.getActiveTab()
    const options = {
      start: (pageNumber - 1) * this.data.pageSize,
      size: this.data.pageSize,
      keyword: this.data.searchKeyword
    }

    var handler = getModuleHandler(moduleId)
    if (handler && handler.buildFeedOptions) {
      return handler.buildFeedOptions(options, activeTab)
    }

    if (moduleId === 'dating') {
      options.area = activeTab ? Number(activeTab.value) : 0
    }

    return options
  },

  loadStatsIfNeeded: function() {
    if (this.data.moduleId !== 'photograph') {
      return
    }

    communityApi.getPhotographStats().then((result) => {
      if (result.success) {
        this.setData({
          stats: result.data || null
        })
      }
    }).catch(() => {})
  },

  loadFeed: function(pageNumber, reset) {
    if (this.data.loading) {
      return Promise.resolve()
    }

    const moduleId = this.data.moduleId
    const options = this.buildFeedOptions(pageNumber)

    return pageUtils.runWithNavigationLoading(this, () => {
      return communityApi.getFeed(moduleId, options)
    }).then((result) => {
      wx.stopPullDownRefresh()
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || i18n.t('common.loadFailed'))
        return
      }

      let list = Array.isArray(result.data) ? result.data : []
      if (moduleId === 'delivery') {
        const activeTab = this.getActiveTab()
        const statusValue = activeTab ? Number(activeTab.value) : -1
        if (statusValue >= 0) {
          list = list.filter(function(item) {
            return Number(item.state) === statusValue
          })
        }
      }

      const normalizedList = list.map(function(item) {
        return normalizeItem(moduleId, item)
      })
      this.setData({
        items: reset ? normalizedList : this.data.items.concat(normalizedList),
        currentPage: pageNumber,
        finished: list.length < this.data.pageSize,
        errorMessage: null
      })
    }).catch((error) => {
      wx.stopPullDownRefresh()
      pageUtils.showTopTips(this, error.message)
    })
  },

  switchTab: function(event) {
    const nextIndex = Number(event.currentTarget.dataset.index)
    if (nextIndex === this.data.activeTabIndex) {
      return
    }

    this.setData({
      activeTabIndex: nextIndex,
      items: [],
      currentPage: 1,
      finished: false
    })
    this.loadFeed(1, true)
  },

  handleSearchInput: function(event) {
    this.setData({
      inputKeyword: event.detail.value
    })
  },

  submitSearch: function() {
    this.setData({
      searchKeyword: String(this.data.inputKeyword || '').trim(),
      items: [],
      currentPage: 1,
      finished: false
    })
    this.loadFeed(1, true)
  },

  clearSearch: function() {
    this.setData({
      inputKeyword: '',
      searchKeyword: '',
      items: [],
      currentPage: 1,
      finished: false
    })
    this.loadFeed(1, true)
  },

  openDetail: function(event) {
    const index = Number(event.currentTarget.dataset.index)
    const item = this.data.items[index]
    if (!item) {
      return
    }

    wx.navigateTo({
      url: '/pages/communityDetail/communityDetail?module=' + this.data.moduleId + '&id=' + item.id
    })
  },

  openPublish: function() {
    wx.navigateTo({
      url: '/pages/communityPublish/communityPublish?module=' + this.data.moduleId
    })
  },

  openCenter: function() {
    wx.navigateTo({
      url: '/pages/communityCenter/communityCenter?module=' + this.data.moduleId
    })
  },

  refreshI18n: function() {
    var moduleConfig = this.data.moduleId ? getCommunityModule(this.data.moduleId) : this.data.moduleConfig
    var tabs = this.data.moduleId ? this.buildTabs(this.data.moduleId) : this.data.tabs

    var tData = {
      search: i18n.t('community.list.search'),
      clear: i18n.t('community.list.clear'),
      loading: i18n.t('community.list.loading'),
      noMore: i18n.t('community.list.noMore'),
      emptyTitle: i18n.t('community.list.emptyTitle'),
      emptySummary: i18n.t('community.list.emptySummary'),
      like: i18n.t('community.list.like'),
      comment: i18n.t('community.list.comment'),
      publishBtn: moduleConfig ? i18n.tReplace('community.list.publishBtn', { title: moduleConfig.title }) : '',
      myBtn: i18n.t('community.list.myBtn'),
      statPhotos: i18n.t('community.list.statPhotos'),
      statComments: i18n.t('community.list.statComments'),
      statLikes: i18n.t('community.list.statLikes')
    }

    this.setData({
      moduleConfig: moduleConfig,
      tabs: tabs,
      t: tData
    })

    if (moduleConfig) {
      wx.setNavigationBarTitle({
        title: moduleConfig.title
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
        showCancel: false,
        success: function() {
          wx.navigateBack({
            delta: 1
          })
        }
      })
      return
    }

    wx.setNavigationBarTitle({
      title: moduleConfig.title
    })

    fetchProfileOptions().catch(function() {
      return null
    }).finally(() => {
      this.setData({
        moduleId: moduleId,
        moduleConfig: moduleConfig,
        tabs: this.buildTabs(moduleId),
        activeTabIndex: 0
      })

      this.refreshI18n()
      this.loadStatsIfNeeded()
      this.loadFeed(1, true)
    })
  },

  onShow: function() {
    themeUtil.applyTheme(this)
    this.refreshI18n()
    if (this.data.moduleId) {
      this.loadStatsIfNeeded()
    }
  },

  onPullDownRefresh: function() {
    this.loadFeed(1, true)
  },

  onReachBottom: function() {
    if (this.data.finished || this.data.loading) {
      return
    }

    this.loadFeed(this.data.currentPage + 1, false)
  },

  onShareAppMessage: function() {
    return {
      title: this.data.moduleConfig ? this.data.moduleConfig.title : i18n.t('community.common.campusCommunity'),
      path: '/pages/communityList/communityList?module=' + this.data.moduleId
    }
  }
})
