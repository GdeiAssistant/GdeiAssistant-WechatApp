// pages/bill/bill.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    date: null,
    start: null,
    end: null,
    errorMessage: null,
    result: null,
    loading: false
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
      let username = wx.getStorageSync("username")
      let password = wx.getStorageSync("password")
      let year = dateStringArray[0]
      let month = dateStringArray[1]
      let date = dateStringArray[2]
      let requestData = {
        username: username,
        password: password,
        year: year,
        month: month,
        date: date
      }
      if (username && password) {
        wx.request({
          url: "https://www.gdeiassistant.cn/rest/cardquery",
          method: "POST",
          header: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data: requestData,
          success: function(result) {
            wx.hideNavigationBarLoading()
            page.setData({
              loading: true
            })
            if (result.data.success) {
              page.setData({
                result: result.data.cardList
              })
            } else {
              wx.showModal({
                title: '查询失败',
                content: result.data.errorMessage,
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
          },
          fail: function() {
            wx.hideNavigationBarLoading()
            page.setData({
              loading: true
            })
            wx.showModal({
              title: '查询失败',
              content: '网络连接超时，请重试',
              showCancel: false,
              success: function(res) {
                if (res.confirm) {
                  wx.navigateBack({
                    delta: 1
                  })
                }
              }
            });
          }
        })
      } else {
        wx.showModal({
          title: '查询失败',
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
      this.showTopTips("请选择需要查询的日期")
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