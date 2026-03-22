const { SYSTEM_ACTIONS } = require('../../constants/features.js')
const auth = require('../../services/auth.js')
const messagesApi = require('../../services/apis/messages.js')
const userApi = require('../../services/apis/user.js')
const featureConfig = require('../../services/feature-config.js')
const dataSource = require('../../services/data-source.js')
var themeUtil = require('../../utils/theme')
var i18n = require('../../utils/i18n')

function formatInboxBadge(unreadCount) {
  const count = Number(unreadCount || 0)
  if (count <= 0) {
    return ''
  }
  return count > 99 ? '99+' : String(count)
}

Page({
  data: {
    themeClass: '',
    fontStyle: '',
    t: {},
    avatar: null,
    nickname: null,
    homeSections: [],
    systemActions: SYSTEM_ACTIONS,
    dataSourceLabel: '',
    hiddenFeatureIds: [],
    inboxUnreadCount: 0,
    inboxBadgeText: ''
  },

  refreshI18n: function () {
    var dataSourceRaw = dataSource.getDataSourceLabel()
    this.setData({
      t: {
        appName: i18n.t('index.appName'),
        navTitle: i18n.t('index.navTitle'),
        dataSourceLabel: i18n.t('index.dataSourceLabel') + dataSourceRaw,
        viewProfile: i18n.t('index.viewProfile'),
        settingsSection: i18n.t('index.settingsSection')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },

  logout: function() {
    wx.showModal({
      title: i18n.t('index.logoutTitle'),
      content: i18n.t('index.logoutContent'),
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

  openProfile: function() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    })
  },

  openInbox: function() {
    wx.navigateTo({
      url: '/pages/inbox/inbox'
    })
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
    var defaultNickname = i18n.t('index.defaultNickname')

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
        nickname: result.success && result.data && result.data.nickname ? result.data.nickname : defaultNickname
      })
    }).catch(function() {
      page.setData({
        nickname: defaultNickname
      })
    })
  },

  loadInboxStatus: function() {
    messagesApi.getUnreadCount().then((result) => {
      if (!result.success) {
        throw new Error(result.message || i18n.t('index.unreadFailed'))
      }

      const unreadCount = Number(result.data || 0)
      this.setData({
        inboxUnreadCount: unreadCount,
        inboxBadgeText: formatInboxBadge(unreadCount)
      })
    }).catch(() => {
      this.setData({
        inboxUnreadCount: 0,
        inboxBadgeText: ''
      })
    })
  },

  onLoad: function() {
    this.refreshI18n()
    this.loadProfile()
    this.loadInboxStatus()
    this.setData({ hiddenFeatureIds: [] })
    this.loadHomeSections()
  },

  onShow: function() {
    themeUtil.applyTheme(this)
    this.refreshI18n()
    this.loadProfile()
    this.loadInboxStatus()
    this.loadHomeSections()
  },

  onShareAppMessage: function() {
    return {
      title: i18n.t('index.appName'),
      path: '/pages/login/login'
    }
  }
})
