// cardLost.js
//获取应用实例
const app = getApp()
let utils = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    loading: false,
    errorMessage: null
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
  setCardLost: function(e) {
    const page = this
    if (utils.validateRequestAccess()) {
      let token = wx.getStorageSync("accessToken")
      let cardPassword = e.detail.value.password
      if (cardPassword && cardPassword.length == 6 && /^\d+$/.test(cardPassword)) {
        wx.showNavigationBarLoading()
        this.setData({
          loading: true
        })
        wx.request({
          url: "https://www.gdeiassistant.cn/rest/cardlost",
          method: "POST",
          header: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data: {
            token: token,
            cardPassword: cardPassword
          },
          success: function(result) {
            wx.hideNavigationBarLoading()
            page.setData({
              loading: false
            })
            if (result.statusCode == 200) {
              if (result.data.success) {
                utils.showModal('挂失成功', '请尽快前往办卡处进行校园卡补办')
              } else {
                page.showTopTips(result.data.message)
              }
            } else {
              page.showTopTips('服务暂不可用，请稍后再试')
            }
          },
          fail: function() {
            wx.hideNavigationBarLoading()
            page.setData({
              loading: false
            })
            page.showTopTips('网络连接超时，请重试')
          }
        })
      } else {
        this.showTopTips('请输入正确的校园卡查询密码')
      }
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {},

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