//index.js
//获取应用实例
const app = getApp()
const utils = require('../../utils/util.js')

Page({
  data: {
    avatar: null,
    kickname: null,
    access: {
      grade: null,
      schedule: null,
      evaluate: null,
      card: null,
      bill: null,
      lost: null,
      charge: null,
      collection: null
    }
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
      if (accessToken) {
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
        //获取功能菜单权限列表
        wx.request({
          url: "https://www.gdeiassistant.cn/rest/access/wechat",
          method: "POST",
          header: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data: {
            token: accessToken.signature
          },
          success: function(result) {
            if (result.data.success) {
              page.setData({
                access: {
                  grade: result.data.data.grade,
                  schedule: result.data.data.schedule,
                  evaluate: result.data.data.evaluate,
                  card: result.data.data.card,
                  bill: result.data.data.bill,
                  lost: result.data.data.lost,
                  charge: result.data.data.charge,
                  collection: result.data.data.collection
                }
              })
            } else {
              utils.showNoActionModal('获取功能菜单失败', result.data.message)
            }
          },
          fail: function() {
            utils.showNoActionModal('网络异常', '请检查网络连接')
          }
        })
      }
    }
  }
})