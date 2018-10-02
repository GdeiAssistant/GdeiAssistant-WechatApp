// pages/schedule/schedule.js
//获取应用实例
const app = getApp()

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
    let username = wx.getStorageSync("username")
    let keycode = wx.getStorageSync("keycode")
    let number = wx.getStorageSync("number")
    let requestData
    if (this.data.week) {
      requestData = {
        username: username,
        keycode: keycode,
        number: number,
        week: this.data.week
      }
    } else {
      requestData = {
        username: username,
        keycode: keycode,
        number: number,
      }
    }
    if (username && keycode && number) {
      wx.request({
        url: "https://www.gdeiassistant.cn/rest/schedulequery",
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: requestData,
        success: function(result) {
          wx.hideNavigationBarLoading()
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
            result.data.scheduleList.forEach(function(e) {
              list[e.column].push(e)
            })
            if(!page.data.week){
              page.setData({
                index: parseInt(result.data.selectedWeek) - 1,
              })
            }
            page.setData({
              scheduleList: list,
              week: result.data.selectedWeek
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
            });
          }
        },
        fail: function() {
          wx.hideNavigationBarLoading()
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
          })
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