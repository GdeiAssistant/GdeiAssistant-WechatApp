// bill.js
//获取应用实例
const app = getApp()
let utils = require("../../utils/util.js")

Page({
  /**
   * 页面的初始数据
   */
  data: {
    date: null,
    start: null,
    end: null,
    result: null,
    loading: false,
    errorMessage: null
  },
  reset: function() {
    this.setData({
      date: null,
      result: null,
      loading: false
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
  submit: function() {
    const page = this
    if (this.data.date) {
      wx.showNavigationBarLoading()
      this.setData({
        loading: true
      })
      var dateStringArray = this.data.date.split("-")
      let token = wx.getStorageSync("accessToken")
      let year = dateStringArray[0]
      let month = dateStringArray[1]
      let date = dateStringArray[2]
      if (utils.validateRequestAccess()) {
        wx.request({
          url: "https://www.gdeiassistant.cn/rest/cardquery",
          method: "POST",
          header: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data: {
            token: token.signature,
            year: year,
            month: month,
            date: date
          },
          success: function(result) {
            wx.hideNavigationBarLoading()
            page.setData({
              loading: false
            })
            if (result.statusCode == 200) {
              if (result.data.success) {
                page.setData({
                  result: result.data.data.cardList
                })
              } else {
                utils.showModal('查询失败', result.data.message)
              }
            } else {
              utils.showModal('查询失败', '服务暂不可用，请稍后再试')
            }
          },
          fail: function() {
            wx.hideNavigationBarLoading()
            page.setData({
              loading: false
            })
            utils.showModal('查询失败', '网络连接超时，请重试')
          }
        })
      }
    } else {
      this.showTopTips('请选择需要查询的日期')
    }
  },
  bindDateChange: function(event) {
    this.setData({
      date: event.detail.value
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var todayDate = new Date()
    var lastYearDate = new Date(todayDate - 365 * 24 * 60 * 60 * 1000)
    this.setData({
      end: todayDate.getFullYear() + "-" + (todayDate.getMonth() + 1) + "-" + todayDate.getDate(),
      start: lastYearDate.getFullYear() + "-" + (lastYearDate.getMonth() + 1) + "-" + lastYearDate.getDate()
    })
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