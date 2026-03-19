const storageKeys = require('../../constants/storage.js')
const infoApi = require('../../services/apis/info.js')
const pageUtils = require('../../utils/page.js')

const PAGE_SIZE = 10
const NEWS_TABS = [
  { type: 1, label: '学校要闻' },
  { type: 2, label: '院部通知' },
  { type: 3, label: '通知公告' },
  { type: 4, label: '学术动态' }
]

Page({
  data: {
    tabs: NEWS_TABS,
    activeType: 1,
    newsList: [],
    currentPage: 1,
    finished: false,
    loading: false,
    errorMessage: null
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
        throw new Error(result.message || '加载新闻通知失败')
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
      navigationTitle: '新闻通知'
    }))
    wx.navigateTo({
      url: `/pages/newsDetail/newsDetail?mode=news&id=${encodeURIComponent(item.id)}`
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
