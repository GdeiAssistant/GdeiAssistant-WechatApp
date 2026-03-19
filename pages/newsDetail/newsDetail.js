const storageKeys = require('../../constants/storage.js')
const infoApi = require('../../services/apis/info.js')
const messagesApi = require('../../services/apis/messages.js')
const pageUtils = require('../../utils/page.js')

Page({
  data: {
    newsItem: null,
    loading: false,
    errorMessage: null,
    mode: 'news'
  },

  loadDetail: function(id, mode) {
    if (!id) {
      return Promise.resolve()
    }

    const requestTask = mode === 'announcement'
      ? function() { return messagesApi.getAnnouncementDetail(id) }
      : function() { return infoApi.getNewsDetail(id) }

    return pageUtils.runWithNavigationLoading(this, requestTask, {
      loadingKey: 'loading'
    }).then((result) => {
      if (!result.success) {
        throw new Error(result.message || '加载详情失败')
      }

      const payload = result.data || {}
      const currentItem = this.data.newsItem || {}
      this.setData({
        newsItem: Object.assign({}, currentItem, payload, {
          publishDate: payload.publishDate || payload.publishTime || currentItem.publishDate || '',
          navigationTitle: mode === 'announcement' ? '系统通知' : '新闻通知'
        }),
        errorMessage: null
      })
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message || '加载详情失败')
      this.setData({
        errorMessage: error.message || '加载详情失败'
      })
    })
  },

  onLoad: function(options) {
    const newsItem = wx.getStorageSync(storageKeys.newsDetailItem)
    const mode = options && options.mode === 'announcement' ? 'announcement' : 'news'
    const detailId = options && options.id ? decodeURIComponent(options.id) : ''
    this.setData({
      newsItem: newsItem || null,
      mode: mode
    })

    wx.setNavigationBarTitle({
      title: mode === 'announcement' ? '系统通知' : '新闻通知'
    })

    this.loadDetail(detailId || (newsItem && newsItem.id) || '', mode)
  },

  onShareAppMessage: function() {
    const navigationTitle = this.data.newsItem && this.data.newsItem.navigationTitle
    return {
      title: this.data.newsItem && this.data.newsItem.title ? this.data.newsItem.title : '新闻通知',
      path: navigationTitle === '系统通知' ? '/pages/inbox/inbox' : '/pages/news/news'
    }
  }
})
