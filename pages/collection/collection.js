const libraryApi = require('../../services/apis/library.js')

Page({
  data: {
    list: [],
    bookname: null,
    currentPage: 0,
    sumPage: 0,
    hasMore: false,
    loading: false,
    errorMessage: null
  },

  formSubmit: function(e) {
    const bookname = e.detail.value.bookname
    if (!bookname) {
      this.showTopTips('请填写要查询的书名')
      return
    }

    this.setData({
      loading: true,
      list: [],
      bookname,
      currentPage: 0,
      sumPage: 0
    })
    wx.showNavigationBarLoading()

    libraryApi.queryCollection(bookname, 1).then((result) => {
      this.setData({ loading: false })
      wx.hideNavigationBarLoading()
      if (!result.success) {
        this.showTopTips(result.message)
        return
      }

      if (!result.collectionList || result.collectionList.length === 0) {
        this.showTopTips('没有找到对应的图书信息')
        return
      }

      this.setData({
        list: result.collectionList,
        currentPage: 1,
        sumPage: result.sumPage,
        hasMore: 1 < result.sumPage
      })
    }).catch((error) => {
      this.setData({ loading: false })
      wx.hideNavigationBarLoading()
      this.showTopTips(error.message)
    })
  },

  loadMore: function() {
    if (!this.data.bookname || this.data.currentPage >= this.data.sumPage) {
      this.showTopTips('没有更多图书信息')
      return
    }

    wx.showLoading({ title: '数据加载中', mask: true })
    const nextPage = this.data.currentPage + 1

    libraryApi.queryCollection(this.data.bookname, nextPage).then((result) => {
      wx.hideLoading()
      if (!result.success) {
        this.showTopTips(result.message)
        return
      }

      if (!result.collectionList || result.collectionList.length === 0) {
        this.showTopTips('没有更多图书信息')
        return
      }

      this.setData({
        list: this.data.list.concat(result.collectionList),
        currentPage: nextPage,
        hasMore: nextPage < this.data.sumPage
      })
    }).catch((error) => {
      wx.hideLoading()
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
