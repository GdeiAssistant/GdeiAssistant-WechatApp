//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    avatar: null,
    realname: null
  },
  logout: function () {
    wx.showModal({
      title: '退出账号',
      content: '你确定要退出当前账号吗？',
      success: function (res) {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.reLaunch({
            url: '../login/login'
          })
        }
      }
    });
  },
  onLoad: function (options) {
    const page = this
    let username = wx.getStorageSync("username")
    let realname = wx.getStorageSync("realname")
    if (realname && realname!="") {
      page.setData({
        realname: realname
      })
    }
    else {
      page.setData({
        realname: "广东二师助手用户"
      })
    }
    if (username) {
      wx.request({
        url: "https://www.gdeiassistant.cn/rest/api/avatar/" + username,
        method: "GET",
        success: function (result) {
          if (result.data.success && result.data.data != "") {
            page.setData({
              avatar: result.data.data
            })
          }
          else {
            page.setData({
              avatar: "../../image/default.png"
            })
          }
        },
        fail: function () {
          page.setData({
            avatar: "../../image/default.png"
          })
        }
      })
    }
  }
})