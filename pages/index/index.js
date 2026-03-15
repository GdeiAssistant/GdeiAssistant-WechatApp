const { SYSTEM_ACTIONS } = require('../../constants/features.js')
const auth = require('../../services/auth.js')
const userApi = require('../../services/apis/user.js')
const featureConfig = require('../../services/feature-config.js')
const dataSource = require('../../services/data-source.js')

Page({
  data: {
    avatar: null,
    nickname: null,
    homeSections: [],
    systemActions: SYSTEM_ACTIONS,
    dataSourceLabel: '',
    hiddenFeatureIds: []
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

  handleActionTap: function(event) {
    const action = event.currentTarget.dataset.action
    if (action === 'logout') {
      this.logout()
    }
  },

  loadHomeSections: function() {
    const hiddenFeatureIds = this.data.hiddenFeatureIds || []
    const homeSections = featureConfig.getHomeSections().map(function(section) {
      return {
        id: section.id,
        title: section.title,
        features: section.features.filter(function(feature) {
          return hiddenFeatureIds.indexOf(feature.id) === -1
        })
      }
    }).filter(function(section) {
      return section.features.length > 0
    })

    this.setData({
      homeSections: homeSections,
      dataSourceLabel: dataSource.getDataSourceLabel()
    })
  },

  loadProfile: function() {
    const page = this

    userApi.getAvatar().then(function(result) {
      page.setData({
        avatar: result.success && result.data ? result.data : '../../image/default.png'
      })
    }).catch(function() {
      page.setData({
        avatar: '../../image/default.png'
      })
    })

    userApi.getProfile().then(function(result) {
      page.setData({
        nickname: result.success && result.data && result.data.nickname ? result.data.nickname : '广东二师助手用户'
      })
    }).catch(function() {
      page.setData({
        nickname: '广东二师助手用户'
      })
    })
  },

  onLoad: function() {
    this.loadProfile()
    this.setData({ hiddenFeatureIds: [] })
    this.loadHomeSections()
  },

  onShow: function() {
    this.loadProfile()
    this.loadHomeSections()
  },

  onShareAppMessage: function() {
    return {
      title: '广东二师助手',
      path: '/pages/login/login'
    }
  }
})
