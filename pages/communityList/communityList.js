const {
  getCommunityModule,
  SECONDHAND_CATEGORY_OPTIONS,
  LOST_FOUND_MODE_OPTIONS,
  LOST_FOUND_ITEM_OPTIONS,
  DELIVERY_STATUS_OPTIONS,
  DATING_AREA_OPTIONS,
  DATING_GRADE_OPTIONS,
  PHOTOGRAPH_TAB_OPTIONS
} = require('../../constants/community.js')
const communityApi = require('../../services/apis/community.js')
const pageUtils = require('../../utils/page.js')

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
    return baseText ? `${baseText} · 24 小时后自动删除` : '24 小时后自动删除'
  }
  return baseText
}

function normalizeItem(moduleId, item) {
  const rawItem = item || {}

  switch (moduleId) {
    case 'ershou':
      return {
        id: rawItem.id,
        title: rawItem.name || '未命名商品',
        summary: rawItem.description || '',
        cover: rawItem.pictureURL && rawItem.pictureURL.length ? rawItem.pictureURL[0] : '/image/ershou.png',
        priceText: formatPrice(rawItem.price),
        badgeText: findLabel(SECONDHAND_CATEGORY_OPTIONS, rawItem.type, '闲置'),
        metaText: rawItem.location || '',
        timeText: rawItem.publishTime || '',
        raw: rawItem
      }
    case 'lostandfound':
      return {
        id: rawItem.id,
        title: rawItem.name || '未命名物品',
        summary: rawItem.description || '',
        cover: rawItem.pictureURL && rawItem.pictureURL.length ? rawItem.pictureURL[0] : '/image/lostandfound.png',
        badgeText: Number(rawItem.lostType) === 0 ? '寻物' : '招领',
        subBadgeText: findLabel(LOST_FOUND_ITEM_OPTIONS, rawItem.itemType, '其他'),
        metaText: rawItem.location || '',
        timeText: rawItem.publishTime || '',
        raw: rawItem
      }
    case 'secret':
      return {
        id: rawItem.id,
        title: Number(rawItem.type) === 1 ? '一段语音树洞' : '匿名树洞',
        summary: Number(rawItem.type) === 1 ? '点击查看语音树洞内容' : (rawItem.content || ''),
        likeCount: Number(rawItem.likeCount || 0),
        commentCount: Number(rawItem.commentCount || 0),
        timeText: formatSecretPublishText(rawItem.publishTime, rawItem.timer),
        raw: rawItem
      }
    case 'express':
      return {
        id: rawItem.id,
        title: `${rawItem.nickname || '匿名同学'} -> ${rawItem.name || 'TA'}`,
        summary: rawItem.content || '',
        likeCount: Number(rawItem.likeCount || 0),
        commentCount: Number(rawItem.commentCount || 0),
        timeText: rawItem.publishTime || '',
        raw: rawItem
      }
    case 'topic':
      return {
        id: rawItem.id,
        title: `#${rawItem.topic || '校园话题'}`,
        summary: rawItem.content || '',
        cover: rawItem.imageUrls && rawItem.imageUrls.length ? rawItem.imageUrls[0] : '',
        likeCount: Number(rawItem.likeCount || 0),
        timeText: rawItem.publishTime || '',
        raw: rawItem
      }
    case 'delivery':
      return {
        id: rawItem.orderId,
        title: rawItem.company || '校园跑腿',
        summary: rawItem.address || '',
        priceText: formatPrice(rawItem.price),
        badgeText: findLabel(DELIVERY_STATUS_OPTIONS, rawItem.state, '任务'),
        metaText: rawItem.remarks || '',
        timeText: rawItem.orderTime || '',
        raw: rawItem
      }
    case 'dating':
      return {
        id: rawItem.profileId,
        title: rawItem.nickname || '匿名同学',
        summary: rawItem.content || '',
        cover: rawItem.pictureURL || '/image/dating.png',
        badgeText: findLabel(DATING_GRADE_OPTIONS, rawItem.grade, '未知年级'),
        metaText: rawItem.faculty || '',
        timeText: rawItem.hometown || '',
        raw: rawItem
      }
    case 'photograph':
      return {
        id: rawItem.id,
        title: rawItem.title || '校园作品',
        summary: rawItem.content || '',
        cover: rawItem.firstImageUrl || (rawItem.imageUrls && rawItem.imageUrls.length ? rawItem.imageUrls[0] : '/image/photograph.png'),
        likeCount: Number(rawItem.likeCount || 0),
        commentCount: Number(rawItem.commentCount || 0),
        timeText: rawItem.createTime || '',
        raw: rawItem
      }
    default:
      return {
        id: rawItem.id,
        title: rawItem.title || '未命名内容',
        summary: rawItem.content || '',
        raw: rawItem
      }
  }
}

Page({
  data: {
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
    stats: null
  },

  buildTabs: function(moduleId) {
    switch (moduleId) {
      case 'ershou':
        return SECONDHAND_CATEGORY_OPTIONS
      case 'lostandfound':
        return LOST_FOUND_MODE_OPTIONS
      case 'delivery':
        return DELIVERY_STATUS_OPTIONS
      case 'dating':
        return DATING_AREA_OPTIONS
      case 'photograph':
        return PHOTOGRAPH_TAB_OPTIONS
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

    if (moduleId === 'ershou') {
      options.type = activeTab && Number(activeTab.value) >= 0 ? Number(activeTab.value) : null
    }

    if (moduleId === 'lostandfound') {
      options.mode = activeTab ? Number(activeTab.value) : 0
    }

    if (moduleId === 'dating') {
      options.area = activeTab ? Number(activeTab.value) : 0
    }

    if (moduleId === 'photograph') {
      options.type = activeTab ? Number(activeTab.feedValue) : 1
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
        pageUtils.showTopTips(this, result.message || '加载失败')
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
      url: `/pages/communityDetail/communityDetail?module=${this.data.moduleId}&id=${item.id}`
    })
  },

  openPublish: function() {
    wx.navigateTo({
      url: `/pages/communityPublish/communityPublish?module=${this.data.moduleId}`
    })
  },

  openCenter: function() {
    wx.navigateTo({
      url: `/pages/communityCenter/communityCenter?module=${this.data.moduleId}`
    })
  },

  onLoad: function(options) {
    const moduleId = options && options.module ? options.module : ''
    const moduleConfig = getCommunityModule(moduleId)
    if (!moduleConfig) {
      wx.showModal({
        title: '提示',
        content: '未识别的社区模块',
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

    this.setData({
      moduleId: moduleId,
      moduleConfig: moduleConfig,
      tabs: this.buildTabs(moduleId),
      activeTabIndex: 0
    })

    this.loadStatsIfNeeded()
    this.loadFeed(1, true)
  },

  onShow: function() {
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
      title: this.data.moduleConfig ? this.data.moduleConfig.title : '校园社区',
      path: `/pages/communityList/communityList?module=${this.data.moduleId}`
    }
  }
})
