// evaluate.js
//获取应用实例
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    checked: false,
    loading: false
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
    let username = wx.getStorageSync("username")
    let keycode = wx.getStorageSync("keycode")
    let number = wx.getStorageSync("number")
    let requestData = {
      username: username,
      keycode: keycode,
      number: number,
      directlySubmit: page.data.checked
    }
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
      data: requestData,
      success: function(result) {
        page.setData({
          loading: false
        })
        wx.hideNavigationBarLoading()
        if (result.data.success) {
          if (page.data.checked) {
            wx.showModal({
              title: '一键评教成功',
              content: '一键评教成功，评教信息已提交',
              showCancel: false,
              success: function(res) {
                if (res.confirm) {
                  wx.navigateBack({
                    delta: 1
                  })
                }
              }
            })
          } else {
            wx.showModal({
              title: '一键评教成功',
              content: '一键评教成功，请登录教务系统进行最终确认',
              showCancel: false,
              success: function(res) {
                if (res.confirm) {
                  wx.navigateBack({
                    delta: 1
                  })
                }
              }
            })
          }
        } else {
          page.showTopTips(result.data.errorMessage)
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