const storageKeys = require('../../constants/storage.js')
const infoApi = require('../../services/apis/info.js')
const pageUtils = require('../../utils/page.js')
var themeUtil = require('../../utils/theme')
var i18n = require('../../utils/i18n')

const PAGE_SIZE = 10
const DEFAULT_NEWS_TABS = []

Page({
  onShow: function () {
    themeUtil.applyTheme(this)
    this.refreshI18n()
  },
  data: {
    themeClass: '',
    fontStyle: '',
    t: {},
    tabs: DEFAULT_NEWS_TABS,
    activeType: 1,
    newsList: [],
    currentPage: 1,
    finished: false,
    loading: false,
    errorMessage: null
  },

  refreshI18n: function () {
    var tabs = i18n.t('info.newsTabs')
    if (!Array.isArray(tabs)) {
      tabs = []
    }
    this.setData({
      tabs: tabs,
      t: {
        navTitle: i18n.t('info.navTitle'),
        loadingNews: i18n.t('info.loadingNews'),
        noMoreNews: i18n.t('info.noMoreNews'),
        noNews: i18n.t('info.noNews')
      }
    })
    wx.setNavigationBarTitle({ title: i18n.t('info.navTitle') })
  },

  loadNews: function(pageNumber, reset) {
    if (this.data.loading) {
      return Promise.resolve()
    }

    return pageUtils.runWithNavigationLoading(this, () => {
      return infoApi.getNewsList(this.data.activeType, (pageNumber - 1) * PAGE_SIZE, PAGE_SIZE)
    }, {
      loadingKey: 'loading'
    }).then((result) => {
      if (!result.success) {
        throw new Error(result.message || i18n.t('info.loadNewsFailed'))
      }

      const nextList = Array.isArray(result.data) ? result.data : []
      this.setData({
        newsList: reset ? nextList : this.data.newsList.concat(nextList),
        currentPage: pageNumber,
        finished: nextList.length < PAGE_SIZE
      })
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    }).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  switchTab: function(event) {
    const nextType = Number(event.currentTarget.dataset.type)
    if (!nextType || nextType === this.data.activeType) {
      return
    }

    this.setData({
      activeType: nextType,
      newsList: [],
      currentPage: 1,
      finished: false
    })
    this.loadNews(1, true)
  },

  openNewsDetail: function(event) {
    const index = Number(event.currentTarget.dataset.index)
    const item = this.data.newsList[index]
    if (!item) {
      return
    }

    wx.setStorageSync(storageKeys.newsDetailItem, Object.assign({}, item, {
      navigationTitle: i18n.t('info.news')
    }))
    wx.navigateTo({
      url: `/pages/newsDetail/newsDetail?mode=news&id=${encodeURIComponent(item.id)}`
    })
  },

  onLoad: function() {
    this.refreshI18n()
    this.loadNews(1, true)
  },

  onPullDownRefresh: function() {
    this.loadNews(1, true)
  },

  onReachBottom: function() {
    if (this.data.finished || this.data.loading) {
      return
    }

    this.loadNews(this.data.currentPage + 1, false)
  },

  onShareAppMessage: function() {
    return {
      title: i18n.t('info.news'),
      path: '/pages/news/news'
    }
  }
})
