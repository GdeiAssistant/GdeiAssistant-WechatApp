// card.js
//获取应用实例
const app = getApp()
let utils = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    card: null
  },
  getCardInfo: function() {
    const page = this
    wx.showNavigationBarLoading()
    if (utils.validateRequestAccess()) {
      let token = wx.getStorageSync("accessToken")
      wx.request({
        url: "https://www.gdeiassistant.cn/rest/cardinfo",
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: {
          token: token.signature
        },
        success: function(result) {
          wx.hideNavigationBarLoading()
          if (result.statusCode == 200) {
            if (result.data.success) {
              page.setData({
                card: {
                  name: result.data.data.name,
                  number: result.data.data.number,
                  cardBalance: result.data.data.cardBalance,
                  cardInterimBalance: result.data.data.cardInterimBalance,
                  cardNumber: result.data.data.cardNumber,
                  cardLostState: result.data.data.cardLostState,
                  cardFreezeState: result.data.data.cardFreezeState
                }
              })
            } else {
              utils.showModal('查询失败', result.data.message)
            }
          }else {
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
    this.getCardInfo()
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