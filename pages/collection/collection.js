// collection.js
//获取应用实例
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    bookname: null,
    currentPage: 0,
    sumPage: 0,
    hasMore: false,
    loading: false
  },
  formSubmit: function(e) {
    const page = this
    let bookname = e.detail.value.bookname
    if (!bookname || bookname.length == 0) {
      this.showTopTips("请填写要查询的书名")
    } else {
      let requestData = {
        bookname: bookname,
        page: 1
      }
      this.setData({
        loading: true
      })
      wx.showNavigationBarLoading()
      wx.request({
        url: "https://www.gdeiassistant.cn/rest/collectionquery",
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: requestData,
        success: function(result) {
          page.setData({
            loading: false
          })
          wx.hideNavigationBarLoading()
          if (result.data.success) {
            if (result.data.collectionList.length == 0) {
              page.showTopTips("没有找到对应的图书信息")
            } else {
              let list = page.data.list
              result.data.collectionList.forEach(function(e) {
                list.push(e)
              })
              page.setData({
                bookname: bookname,
                list: list,
                currentPage: 1,
                sumPage: result.data.sumPage
              })
            }
          } else {
            page.showTopTips(result.data.message)
          }
        },
        fail: function() {
          page.setData({
            loading: false
          })
          wx.hideNavigationBarLoading()
          page.showTopTips("网络连接超时，请重试")
        }
      })
    }
  },
  loadMore: function() {
    let page = this
    wx.showLoading({
      title: '数据加载中',
      mask: true
    });
    let requestData = {
      bookname: this.data.bookname,
      page: this.data.currentPage + 1
    }
    wx.request({
      url: "https://www.gdeiassistant.cn/rest/collectionquery",
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: requestData,
      success: function(result) {
        if (result.data.success) {
          if (result.data.collectionList.length == 0) {
            page.showTopTips("没有更多图书信息")
            wx.hideLoading()
          } else {
            let list = page.data.list
            result.data.collectionList.forEach(function(e) {
              list.push(e)
            })
            page.setData({
              list: list,
              currentPage: page.data.currentPage + 1
            })
            wx.hideLoading()
          }
        } else {
          page.showTopTips(result.data.message)
          wx.hideLoading()
        }
      },
      fail: function() {
        page.showTopTips("网络连接超时，请重试")
        wx.hideLoading()
      }
    })
  },
  showTopTips: function(content) {
    var that = this;
    this.setData({
      errorMessage: content
    });
    setTimeout(function() {
      that.setData({
        errorMessage: null
      });
    }, 3000);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})