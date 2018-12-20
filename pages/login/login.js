//login.js
//获取应用实例
const app = getApp()
const utils = require('../../utils/util.js')
const globalData = require('../../common/data/data.js')

Page({
  data: {
    login: false,
    unionid: null
  },
  formSubmit: function(e) {
    let page = this
    let username = e.detail.value.username
    let password = e.detail.value.password
    if (username && password) {
      //生成时间戳和随机值
      let nonce = Math.random().toString(36).substr(2, 15)
      let timestamp = new Date().getTime()
      //进行字典排序
    
      //进行摘要签名
      let signature = utils.sha1Hex(timestamp + nonce + globalData.requestValidateToken)
      wx.showNavigationBarLoading()
      wx.request({
        url: "https://www.gdeiassistant.cn/rest/userlogin",
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: {
          unionid: page.data.unionid,
          username: username,
          password: password,
          nonce: nonce,
          timestamp: timestamp,
          signature: signature
        },
        success: function(result) {
          wx.hideNavigationBarLoading()
          if (result.statusCode == 200) {
            if (result.data.success) {
              let username = result.data.user.username
              let accessToken = result.data.accessToken
              let refreshToken = result.data.refreshToken
              wx.setStorageSync("username", username)
              wx.setStorageSync("accessToken", accessToken)
              wx.setStorageSync("refreshToken", refreshToken)
              wx.redirectTo({
                url: '../index/index',
              })
            } else {
              utils.showModal('登录失败', result.data.message)
            }
          } else {
            utils.showModal('登录失败', '服务暂不可用，请稍后再试')
          }
        },
        fail: function() {
          utils.showModal('登录失败', '网络连接超时，请重试')
        }
      })
    } else {
      utils.showNoActionModal('请填写教务系统信息', '教务系统账号和密码不能为空')
    }
  },
  onLoad: function() {
    let page = this
    let accessToken = wx.getStorageSync("accessToken")
    let refreshToken = wx.getStorageSync("refreshToken")
    if (accessToken && refreshToken) {
      //校验时间戳
      if (utils.validateTokenTimestamp(accessToken.expireTime)) {
        //权限令牌有效，进入功能主页
        wx.redirectTo({
          url: '../index/index',
        })
      } else {
        if (utils.validateTokenTimestamp(refreshToken.expireTime)) {
          //使用刷新令牌刷新令牌信息
          wx.request({
            url: "https://www.gdeiassistant.cn/rest/token/refresh",
            method: "POST",
            header: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            data: {
              token: refreshToken.signature
            },
            success: function(result) {
              if (result.statusCode == 200) {
                if (result.data.success) {
                  wx.setStorageSync("accessToken", result.data.data.accessToken)
                  wx.setStorageSync("refreshToken", result.data.data.refreshToken)
                  wx.redirectTo({
                    url: '../index/index',
                  })
                } else {
                  utils.showModal('更新令牌失败，请尝试重新登录', result.data.message)
                  page.setData({
                    login: true
                  })
                }
              } else {
                utils.showModal('更新令牌失败，请尝试重新登录', '服务暂不可用，请稍后再试')
                page.setData({
                  login: true
                })
              }
            },
            fail: function() {
              utils.showModal('网络异常', '请检查网络连接')
            }
          })
        } else {
          utils.showModal('登录凭证过期', '请重新登录')
          page.setData({
            login: true
          })
        }
      }
    } else {
      // 微信登录
      wx.login({
        success: res => {
          if (!res.code) {
            utils.showModal('登录失败', '微信登录失败')
          } else {
            // 通过code值获取微信id
            wx.request({
              url: "https://www.gdeiassistant.cn/wechat/app/userid",
              method: "POST",
              header: {
                "Content-Type": "application/x-www-form-urlencoded"
              },
              data: {
                code: res.code
              },
              success: function(result) {
                if (result.statusCode == 200) {
                  if (result.data.success) {
                    let unionid = result.data.data.openid;
                    page.setData({
                      unionid: unionid,
                      login: true
                    })
                  } else {
                    utils.showModal('登录失败', result.data.message)
                  }
                } else {
                  utils.showModal('登录失败', '服务暂不可用，请稍后重试')
                }
              },
              fail: function() {
                utils.showModal('网络异常', '请检查网络连接')
              }
            })
          }
        }
      })
    }
  },
})