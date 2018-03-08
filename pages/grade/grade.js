// grade.js
//获取应用实例
const app = getApp()

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
  tabClick: function (e) {
    this.setData({
      activeIndex: e.currentTarget.id
    });
    this.getGrade()
  },
  getGrade: function () {
    const page = this
    wx.showNavigationBarLoading()
    let username = wx.getStorageSync("username")
    let keycode = wx.getStorageSync("keycode")
    let number = wx.getStorageSync("number")
    let queryYear = this.data.activeIndex
    let requestData;
    if (queryYear == -1) {
      requestData = {
        username: username,
        keycode: keycode,
        number: number,
      }
    }
    else {
      requestData = {
        username: username,
        keycode: keycode,
        number: number,
        year: queryYear
      }
    }
    if (username && keycode && number) {
      wx.request({
        url: "https://www.gdeiassistant.cn/rest/gradequery",
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: requestData,
        success: function (result) {
          wx.hideNavigationBarLoading()
          if (result.data.success) {
            page.setData({
              firstTermGradeList: result.data.firstTermGradeList,
              secondTermGradeList: result.data.secondTermGradeList,
              activeIndex: result.data.queryYear
            })
          }
          else {
            wx.showModal({
              title: '查询失败',
              content: result.data.errorMessage,
              showCancel: false,
              success: function (res) {
                if (res.confirm) {
                  wx.navigateBack({
                    delta: 1
                  })
                }
              }
            })
          }
        },
        fail: function () {
          wx.hideNavigationBarLoading()
          wx.showModal({
            title: '查询失败',
            content: '网络连接超时，请重试',
            showCancel: false,
            success: function (res) {
              if (res.confirm) {
                wx.navigateBack({
                  delta: 1
                })
              }
            }
          });
        }
      })
    }
    else {
      wx.showModal({
        title: '查询失败',
        content: "登录凭证已过期，请重新登录",
        showCancel: false,
        success: function (res) {
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
  onLoad: function (options) {
    this.getGrade()
  },

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
  onReady: function () {

  },

	/**
	 * 生命周期函数--监听页面显示
	 */
  onShow: function () {

  },

	/**
	 * 生命周期函数--监听页面隐藏
	 */
  onHide: function () {

  },

	/**
	 * 生命周期函数--监听页面卸载
	 */
  onUnload: function () {

  },

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
  onPullDownRefresh: function () {

  },

	/**
	 * 页面上拉触底事件的处理函数
	 */
  onReachBottom: function () {

  },

	/**
	 * 用户点击右上角分享
	 */
  onShareAppMessage: function () {

  }
})