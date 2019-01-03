// grade.js
//获取应用实例
const app = getApp()
let utils = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabs: ["大一", "大二", "大三", "大四"],
    firstTermGradeList: null,
    secondTermGradeList: null,
    activeIndex: -1
  },
  tabClick: function(e) {
    this.setData({
      activeIndex: e.currentTarget.id
    });
    this.getGrade()
  },
  getGrade: function() {
    const page = this
    wx.showNavigationBarLoading()
    if (utils.validateRequestAccess()) {
      let token = wx.getStorageSync("accessToken")
      let year = this.data.activeIndex
      let requestData;
      if (year == -1) {
        requestData = {
          token: token.signature
        }
      } else {
        requestData = {
          token: token.signature,
          year: year
        }
      }
      wx.request({
        url: "https://www.gdeiassistant.cn/rest/gradequery",
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: requestData,
        success: function(result) {
          wx.hideNavigationBarLoading()
          if (result.statusCode == 200) {
            if (result.data.success) {
              page.setData({
                firstTermGradeList: result.data.data.firstTermGradeList,
                secondTermGradeList: result.data.data.secondTermGradeList,
                activeIndex: result.data.data.year
              })
            } else {
              utils.showModal('查询失败', result.data.message)
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
    this.getGrade()
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