//login.js
//获取应用实例
const app = getApp()

Page({
  formSubmit: function (e) {
    let username = e.detail.value.username
    let password = e.detail.value.password
    if (username && password) {
      wx.showNavigationBarLoading()
      wx.request({
        url: "https://www.gdeiassistant.cn/rest/userlogin",
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: {
          username: username,
          password: password
        },
        success: function (result) {
          wx.hideNavigationBarLoading()
          if (result.data.success) {
            let username = result.data.user.username
            let password = result.data.user.password
            let keycode = result.data.user.keycode
            let number = result.data.user.number
            let xm = result.data.user.xm
            wx.setStorageSync("username", username)
            wx.setStorageSync("password", password)
            wx.setStorageSync("keycode", keycode)
            wx.setStorageSync("number", number)
            wx.setStorageSync("xm", xm)
            wx.redirectTo({
              url: '../index/index',
            })
          }
          else {
            wx.showModal({
              title: '登录失败',
              content: result.data.errorMessage,
              showCancel: false
            })
          }
        },
        fail: function () {
          wx.hideNavigationBarLoading()
          wx.showModal({
            title: '登录失败',
            content: '网络连接超时，请重试',
            showCancel: false
          })
        }
      })
    }
    else {
      wx.showModal({
        title: '请填写教务系统信息',
        content: '教务系统账号和密码不能为空',
        showCancel: false
      })
    }
  },
  onLoad: function () {
    // 微信登录
    wx.login({
      success: res => {
        if (!res.code) {
          wx.showModal({
            title: '登录失败',
            content: '微信登录失败',
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
        else {
          let username = wx.getStorageSync("username")
          let password = wx.getStorageSync("password")
          let keycode = wx.getStorageSync("keycode")
          let number = wx.getStorageSync("number")
          if (username && password && keycode && number) {
            wx.redirectTo({
              url: '../index/index',
            })
          }
        }
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              app.globalData.userInfo = res.userInfo
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  }
})
