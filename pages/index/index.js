const auth = require('../../services/auth.js')
const userApi = require('../../services/apis/user.js')

Page({
  data: {
    avatar: null,
    nickname: null,
    access: {
      grade: true,
      schedule: true,
      bill: true,
      card: true,
      lost: true,
      evaluate: true,
      collection: true,
      book: true
    }
  },

  logout: function() {
    wx.showModal({
      title: '退出账号',
      content: '你确定要退出当前账号吗？',
      success: function(res) {
        if (!res.confirm) {
          return
        }

        auth.logout().finally(() => {
          auth.clearSession()
          wx.reLaunch({
            url: '/pages/login/login'
          })
        })
      }
    })
  },

  onLoad: function() {
    const page = this

    userApi.getAvatar().then((result) => {
      if (result.success && result.data !== '') {
        page.setData({
          avatar: result.data
        })
      } else {
        page.setData({
          avatar: '../../image/default.png'
        })
      }
    }).catch(() => {
      page.setData({
        avatar: '../../image/default.png'
      })
    })

    userApi.getProfile().then((result) => {
      if (result.success && result.data && result.data.nickname) {
        page.setData({
          nickname: result.data.nickname
        })
      } else {
        page.setData({
          nickname: '广东二师助手用户'
        })
      }
    }).catch(() => {
      page.setData({
        nickname: '广东二师助手用户'
      })
    })

  },

  onShareAppMessage: function() {
    wx.showShareMenu({
      showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
    })
  }
})
