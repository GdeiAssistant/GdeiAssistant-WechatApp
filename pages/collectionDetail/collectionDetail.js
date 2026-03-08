const libraryApi = require('../../services/apis/library.js')

Page({
  data: {
    query: null,
    result: null,
    errorMessage: null
  },

  onLoad: function(options) {
    wx.setNavigationBarTitle({
      title: options.bookname
    })

    const query = {
      opacUrl: options.opacUrl,
      page: options.page,
      schoolId: options.schoolId,
      search: options.search,
      searchtype: options.searchtype,
      xc: options.xc
    }

    this.setData({ query })
    wx.showNavigationBarLoading()

    libraryApi.queryCollectionDetail(query).then((result) => {
      wx.hideNavigationBarLoading()
      if (!result.success) {
        this.showTopTips(result.message)
        return
      }

      const detail = result.data
      if (detail.principal && detail.principal.split(' ').length !== 1) {
        detail.autograph = detail.principal.split(' ')[0]
        detail.director = detail.principal.split(' ')[1]
      }
      if (detail.publishingHouse && detail.publishingHouse.split(' ').length !== 1) {
        detail.house = detail.publishingHouse.split(' ')[0]
        detail.year = detail.publishingHouse.split(' ')[1]
      }
      if (detail.price && detail.price.split(' ').length !== 1) {
        detail.ISBN = detail.price.split(' ')[0]
        detail.priceValue = detail.price.split(' ')[1]
      }
      this.setData({ result: detail })
    }).catch((error) => {
      wx.hideNavigationBarLoading()
      this.showTopTips(error.message)
    })
  },

  showTopTips: function(content) {
    const that = this
    this.setData({ errorMessage: content })
    setTimeout(function() {
      that.setData({ errorMessage: null })
    }, 3000)
  },

  onShareAppMessage: function() {
    wx.showShareMenu({
      showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
    })
  }
})
