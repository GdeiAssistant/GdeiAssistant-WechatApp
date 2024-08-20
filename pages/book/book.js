// book.js
//获取应用实例
const app = getApp()
let utils = require("../../utils/util.js")

Page({
  /**
   * 页面的初始数据
   */
  data: {
    password: null,
    result: null,
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
  submit: function(e) {
    const page = this
    wx.showNavigationBarLoading()
    this.setData({
      loading: true
    })
    let token = wx.getStorageSync("accessToken")
    let password = e.detail.value.password
    this.setData({
      password: password
    })
    if (utils.validateRequestAccess()) {
      wx.request({
        url: globalData.resourceDomain + "rest/bookquery",
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: {
          token: token.signature,
          password: password
        },
        success: function(result) {
          wx.hideNavigationBarLoading()
          page.setData({
            loading: false
          })
          if (result.statusCode == 200) {
            if (result.data.success) {
              page.setData({
                result: result.data.data
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
  },
  renewBook: function(event) {
    const page = this
    wx.showNavigationBarLoading()
    this.setData({
      loading: true
    })
    let token = wx.getStorageSync("accessToken")
    let index = event.currentTarget.dataset.index
    let id = event.currentTarget.dataset.id
    let sn = event.currentTarget.dataset.sn
    let password = this.data.password
    if (utils.validateRequestAccess()) {
      wx.request({
        url: globalData.resourceDomain + "rest/bookrenew",
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: {
          token: token.signature,
          id: id,
          sn: sn,
          password: password
        },
        success: function(result) {
          wx.hideNavigationBarLoading()
          page.setData({
            loading: false
          })
          if (result.statusCode == 200) {
            if (result.data.success) {
              utils.showNoActionModal('续借成功', "已成功续借图书")
              let list = page.data.result
              console.log(page.data.result)
              list[index].renewTime++;
              page.setData({
                result: list
              })
            } else {
              utils.showNoActionModal('续借失败', result.data.message)
            }
          } else {
            utils.showNoActionModal('续借失败', '服务暂不可用，请稍后再试')
          }
        },
        fail: function() {
          wx.hideNavigationBarLoading()
          page.setData({
            loading: false
          })
          utils.showNoActionModal('续借失败', '网络连接超时，请重试')
        }
      })
    }
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
    //显示当前页面的转发按钮
    wx.showShareMenu({
      showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
    })
  }
})