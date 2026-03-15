const infoApi = require('../../services/apis/info.js')
const pageUtils = require('../../utils/page.js')

Page({
  data: {
    readingList: [],
    loading: false,
    errorMessage: null
  },

  loadReadingList: function() {
    pageUtils.runWithNavigationLoading(this, () => {
      return infoApi.getReadingList()
    }).then((result) => {
      if (result.success) {
        this.setData({
          readingList: Array.isArray(result.data) ? result.data : []
        })
      } else {
        pageUtils.showTopTips(this, result.message)
      }
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  openReading: function(event) {
    const index = Number(event.currentTarget.dataset.index)
    const item = this.data.readingList[index]
    if (!item) {
      return
    }

    if (item.link) {
      wx.setClipboardData({
        data: item.link,
        success: function() {
          wx.showModal({
            title: item.title,
            content: `${item.description}\n\n链接已复制，请在浏览器中打开。`,
            showCancel: false
          })
        }
      })
      return
    }

    wx.showModal({
      title: item.title,
      content: item.description || '暂无更多内容',
      showCancel: false
    })
  },

  onLoad: function() {
    this.loadReadingList()
  },

  onShareAppMessage: function() {
    return {
      title: '专题阅读',
      path: '/pages/reading/reading'
    }
  }
})
