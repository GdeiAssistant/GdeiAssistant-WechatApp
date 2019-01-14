// evaluate.js
//获取应用实例
const app = getApp()
let utils = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    checked: false,
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
  formSubmit() {
    const page = this
    if (utils.validateRequestAccess()) {
      let token = wx.getStorageSync("accessToken")
      this.setData({
        loading: true
      })
      wx.showNavigationBarLoading()
      wx.request({
        url: "https://www.gdeiassistant.cn/rest/evaluate",
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: {
          token: token.signature,
          directlySubmit: page.data.checked
        },
        success: function(result) {
          page.setData({
            loading: false
          })
          wx.hideNavigationBarLoading()
          if (result.statusCode == 200) {
            if (result.data.success) {
              if (page.data.checked) {
                utils.showModal('一键评教成功', '一键评教成功，评教信息已提交')
              } else {
                utils.showModal('一键评教成功', '一键评教成功，请登录教务系统进行最终确认')
              }
            } else {
              page.showTopTips(result.data.message)
            }
          } else {
            utils.showModal('评教失败', '服务暂不可用，请稍后再试')
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
  changeSwitch(e) {
    this.setData({
      checked: e.detail.value
    })
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