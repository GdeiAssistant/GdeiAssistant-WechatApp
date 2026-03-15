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

    if (newsItem && newsItem.navigationTitle) {
      wx.setNavigationBarTitle({
        title: newsItem.navigationTitle
      })
    }
  },

  onShareAppMessage: function() {
    const navigationTitle = this.data.newsItem && this.data.newsItem.navigationTitle
    return {
      title: this.data.newsItem && this.data.newsItem.title ? this.data.newsItem.title : '新闻通知',
      path: navigationTitle === '系统通知' ? '/pages/inbox/inbox' : '/pages/news/news'
    }
  }
})
