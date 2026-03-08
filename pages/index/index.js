const utils = require('../../utils/util.js')
const auth = require('../../services/auth.js')
const userApi = require('../../services/apis/user.js')

Page({
  data: {
    avatar: null,
    nickname: null,
    access: null
  },

  logout: function() {
    wx.showModal({
      title: '退出账号',
      content: '你确定要退出当前账号吗？',
      success: function(res) {
        if (!res.confirm) {
          return
        }

        const accessToken = auth.getAccessToken()
        const refreshToken = auth.getRefreshToken()

        Promise.all([
          auth.expireToken(accessToken && accessToken.signature),
          auth.expireToken(refreshToken && refreshToken.signature)
        ]).finally(() => {
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
    const username = wx.getStorageSync('username')

    if (!username) {
      return
    }

    userApi.getAvatar(username).then((result) => {
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

    userApi.getAccessList().then((result) => {
      if (result.success) {
        page.setData({
          access: result.data
        })
      } else {
        utils.showNoActionModal('获取功能菜单失败', result.message)
      }
    }).catch(() => {
      utils.showNoActionModal('网络异常', '请检查网络连接')
    })
  },

  onShareAppMessage: function() {
    wx.showShareMenu({
      showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
    })
  }
})
