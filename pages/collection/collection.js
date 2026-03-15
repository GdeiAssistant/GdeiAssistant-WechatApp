const libraryApi = require('../../services/apis/library.js')
const pageUtils = require('../../utils/page.js')

Page({
  data: {
    list: [],
    keyword: null,
    currentPage: 0,
    sumPage: 0,
    hasMore: false,
    loading: false,
    errorMessage: null
  },

  formSubmit: function(e) {
    const keyword = e.detail.value.keyword
    if (!keyword) {
      pageUtils.showTopTips(this, '请填写要查询的书名')
      return
    }

    this.setData({
      loading: true,
      list: [],
      keyword,
      currentPage: 0,
      sumPage: 0
    })
    pageUtils.runWithNavigationLoading(this, () => {
      return libraryApi.queryCollection(keyword, 1)
    }).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message)
        return
      }

      if (!result.collectionList || result.collectionList.length === 0) {
        pageUtils.showTopTips(this, '没有找到对应的图书信息')
        return
      }

      this.setData({
        list: result.collectionList,
        currentPage: 1,
        sumPage: result.sumPage,
        hasMore: 1 < result.sumPage
      })
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  loadMore: function() {
    if (!this.data.keyword || this.data.currentPage >= this.data.sumPage) {
      pageUtils.showTopTips(this, '没有更多图书信息')
      return
    }

    wx.showLoading({ title: '数据加载中', mask: true })
    const nextPage = this.data.currentPage + 1

    libraryApi.queryCollection(this.data.keyword, nextPage).then((result) => {
      wx.hideLoading()
      if (!result.success) {
        pageUtils.showTopTips(this, result.message)
        return
      }

      if (!result.collectionList || result.collectionList.length === 0) {
        pageUtils.showTopTips(this, '没有更多图书信息')
        return
      }

      this.setData({
        list: this.data.list.concat(result.collectionList),
        currentPage: nextPage,
        hasMore: nextPage < this.data.sumPage
      })
    }).catch((error) => {
      wx.hideLoading()
      pageUtils.showTopTips(this, error.message)
    })
  },

  onShareAppMessage: function() {
    return {
      title: '馆藏查询',
      path: '/pages/collection/collection'
    }
  }
})
