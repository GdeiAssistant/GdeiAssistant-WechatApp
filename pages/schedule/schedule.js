// pages/schedule/schedule.js
//获取应用实例
const app = getApp()
let utils = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    index: 0,
    array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    scheduleList: null,
    week: null,
    tabs: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
    activeIndex: 0
  },
  bindPickerChange: function(e) {
    this.setData({
      week: parseInt(e.detail.value) + 1
    })
    this.getDataList()
  },
  tabClick: function(e) {
    this.setData({
      activeIndex: e.currentTarget.id
    });
  },
  getDataList: function() {
    const page = this
    wx.showNavigationBarLoading()
    if (utils.validateRequestAccess()) {
      let token = wx.getStorageSync("accessToken")
      let requestData
      if (this.data.week) {
        requestData = {
          token: token.signature,
          week: this.data.week
        }
      } else {
        requestData = {
          token: token.signature
        }
      }
      wx.request({
        url: "https://www.gdeiassistant.cn/rest/schedulequery",
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: requestData,
        success: function(result) {
          wx.hideNavigationBarLoading()
          if (result.statusCode == 200) {
            if (result.data.success) {
              var list = [
                [],
                [],
                [],
                [],
                [],
                [],
                []
              ]
              result.data.data.scheduleList.forEach(function(e) {
                list[e.column].push(e)
              })
              if (!page.data.week) {
                page.setData({
                  index: parseInt(result.data.data.week) - 1,
                })
              }
              page.setData({
                scheduleList: list,
                week: result.data.data.week
              })
            } else {
              utils.showModal('查询失败',result.data.message)
            }
          } else if (result.statusCode == 401) {
            utils.showModal('查询失败', result.data.message)
          } else {
            utils.showModal('查询失败', '服务暂不可用，请稍后再试')
          }
        },
        fail: function() {
          wx.hideNavigationBarLoading()
          utils.showModal('查询失败', '网络连接超时，请重试')
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.getDataList()
    let day = new Date().getDay()
    if (day == 0) {
      this.setData({
        activeIndex: 6
      })
    } else {
      this.setData({
        activeIndex: day - 1
      })
    }
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