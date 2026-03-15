const storageKeys = require('../../constants/storage.js')

Page({
  data: {
    newsItem: null
  },

  onLoad: function() {
    const newsItem = wx.getStorageSync(storageKeys.newsDetailItem)
    this.setData({
      newsItem: newsItem || null
    })
  },

  onShareAppMessage: function() {
    return {
      title: this.data.newsItem && this.data.newsItem.title ? this.data.newsItem.title : '新闻通知',
      path: '/pages/news/news'
    }
  }
})
