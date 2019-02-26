// pages/collectionDetail/collectionDetail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    query: null,
    result: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let page = this
    wx.setNavigationBarTitle({
      title: options.bookname
    })
    this.setData({
      query: {
        opacUrl: options.opacUrl,
        page: options.page,
        schoolId: options.schoolId,
        search: options.search,
        searchtype: options.searchtype,
        xc: options.xc
      }
    })
    wx.showNavigationBarLoading()
    wx.request({
      url: "https://www.gdeiassistant.cn/rest/collectiondetail",
      method: "POST",
      data: this.data.query,
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      success: function (result) {
        wx.hideNavigationBarLoading()
        if (result.data.success) {
          let detail = result.data.data
          if (detail.principal.split(" ").length != 1){
            detail.autograph = detail.principal.split(" ")[0]
            detail.director = detail.principal.split(" ")[1]
          }
          if (detail.publishingHouse.split(" ").length!=1){
            detail.house = detail.publishingHouse.split(" ")[0]
            detail.year = detail.publishingHouse.split(" ")[1]
          }
          if (detail.price.split(" ").length != 1){
            detail.ISBN = detail.price.split(" ")[0]
            detail.priceValue = detail.price.split(" ")[1]
          }
          page.setData({
            result: detail
          })
        } else {
          page.showTopTips(result.data.message)
        }
      },
      fail: function () {
        wx.hideNavigationBarLoading()
        page.showTopTips("网络连接超时")
      }
    })
  },
  showTopTips: function (content) {
    var that = this;
    this.setData({
      errorMessage: content
    });
    setTimeout(function () {
      that.setData({
        errorMessage: null
      });
    }, 3000);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})