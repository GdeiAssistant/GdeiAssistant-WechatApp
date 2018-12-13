//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    avatar: null,
    kickname: null
  },
  logout: function() {
    wx.showModal({
      title: '退出账号',
      content: '你确定要退出当前账号吗？',
      success: function(res) {
        if (res.confirm) {
          let accessToken = wx.getStorageSync("accessToken")
          let refreshToken = wx.getStorageSync("refreshToken")
          if (accessToken) {
            wx.request({
              url: "https://www.gdeiassistant.cn/rest/token/expire",
              method: "POST",
              header: {
                "Content-Type": "application/x-www-form-urlencoded"
              },
              data: {
                token: accessToken.signature
              }
            })
          }
          if (refreshToken) {
            wx.request({
              url: "https://www.gdeiassistant.cn/rest/token/expire",
              method: "POST",
              header: {
                "Content-Type": "application/x-www-form-urlencoded"
              },
              data: {
                token: refreshToken.signature
              }
            })
          }
          wx.clearStorageSync()
          wx.reLaunch({
            url: '../login/login'
          })
        }
      }
    });
  },
  onLoad: function(options) {
    const page = this
    let accessToken = wx.getStorageSync("accessToken")
    let username = wx.getStorageSync("username")
    if (username) {
      //获取头像信息
      wx.request({
        url: "https://www.gdeiassistant.cn/rest/avatar/" + username,
        method: "GET",
        success: function(result) {
          if (result.data.success && result.data.data != "") {
            page.setData({
              avatar: result.data.data
            })
          } else {
            page.setData({
              avatar: "../../image/default.png"
            })
          }
        },
        fail: function() {
          page.setData({
            avatar: "../../image/default.png"
          })
        }
      })
      //获取资料信息
      wx.request({
        url: "https://www.gdeiassistant.cn/rest/profile",
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: {
          token: accessToken.signature
        },
        success: function(result) {
          if (result.data.success && result.data.data && result.data.data.kickname) {
            page.setData({
              kickname: result.data.data.kickname
            })
          } else {
            page.setData({
              kickname: "易小助用户"
            })
          }
        },
        fail: function() {
          page.setData({
            kickname: "易小助用户"
          })
        }
      })
    }
  }
})