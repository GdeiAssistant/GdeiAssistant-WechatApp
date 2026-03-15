const storageKeys = require('../../constants/storage.js')
const infoApi = require('../../services/apis/info.js')
const pageUtils = require('../../utils/page.js')

const NEWS_TABS = [
  { type: 1, label: '教学信息' },
  { type: 2, label: '考试信息' },
  { type: 3, label: '教务信息' },
  { type: 4, label: '行政通知' },
  { type: 5, label: '综合信息' }
]

Page({
  data: {
    tabs: NEWS_TABS,
    activeType: 1,
    newsList: [],
    currentPage: 1,
    pageSize: 10,
    finished: false,
    loading: false,
    errorMessage: null
  },

  loadNews: function(pageNumber, reset) {
    if (this.data.loading) {
      return Promise.resolve()
    }

    return pageUtils.runWithNavigationLoading(this, () => {
      return infoApi.getNewsList(this.data.activeType, (pageNumber - 1) * this.data.pageSize, this.data.pageSize)
    }).then((result) => {
      wx.stopPullDownRefresh()
      if (!result.success) {
        pageUtils.showTopTips(this, result.message)
        return
      }

      const list = Array.isArray(result.data) ? result.data : []
      this.setData({
        newsList: reset ? list : this.data.newsList.concat(list),
        currentPage: pageNumber,
        finished: list.length < this.data.pageSize
      })
    }).catch((error) => {
      wx.stopPullDownRefresh()
      pageUtils.showTopTips(this, error.message)
    })
  },

  switchTab: function(event) {
    const nextType = Number(event.currentTarget.dataset.type)
    if (nextType === this.data.activeType) {
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

    wx.setStorageSync(storageKeys.newsDetailItem, item)
    wx.navigateTo({
      url: '/pages/newsDetail/newsDetail'
    })
  },

  onLoad: function() {
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
      title: '新闻通知',
      path: '/pages/news/news'
    }
  }
})
