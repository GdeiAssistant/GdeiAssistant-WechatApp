// cardLost.js
//获取应用实例
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
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
  setCardLost: function(e) {
    const page = this
    let username = wx.getStorageSync("username")
    let password = wx.getStorageSync("password")
    let cardPassword = e.detail.value.password
    let requestData = {
      username: username,
      password: password,
      cardPassword: cardPassword
    }
    if (cardPassword && cardPassword.length == 6 && /^\d+$/.test(cardPassword)) {
      if (username && password) {
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
          data: requestData,
          success: function(result) {
            wx.hideNavigationBarLoading()
            page.setData({
              loading: false
            })
            if (result.data.success) {
              wx.showModal({
                title: '挂失成功',
                content: '请尽快前往办卡处进行校园卡补办',
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
              page.showTopTips(result.data.errorMessage)
            }
          },
          fail: function() {
            wx.hideNavigationBarLoading()
            page.setData({
              loading: false
            })
            page.showTopTips("网络连接超时，请重试")
          }
        })
      } else {
        wx.showModal({
          title: '挂失失败',
          content: "登录凭证已过期，请重新登录",
          showCancel: false,
          success: function(res) {
            if (res.confirm) {
              wx.reLaunch({
                url: '../login/login',
              })
            }
          }
        })
      }
    } else {
      this.showTopTips("请输入正确的校园卡查询密码")
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

  }
})