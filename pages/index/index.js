const { getSystemActions } = require('../../constants/features.js')
const auth = require('../../services/auth.js')
const messagesApi = require('../../services/apis/messages.js')
const socialApi = require('../../services/apis/social.js')
const socialRealtime = require('../../services/social-realtime.js')
const userApi = require('../../services/apis/user.js')
const featureConfig = require('../../services/feature-config.js')
const campusApi = require('../../services/apis/campus.js')
const dataSource = require('../../services/data-source.js')
const todaySchedule = require('../../utils/today-schedule.js')
const homeIcons = require('../../constants/home-icons.js')
var themeUtil = require('../../utils/theme')
var tabBarUtil = require('../../utils/tab-bar')
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
    systemActions: [],
    hiddenFeatureIds: [],
    inboxUnreadCount: 0,
    inboxBadgeText: '',
    today: { status: 'loading', lessons: [] },
    todayVisible: false,
    todayDate: '',
    todaySource: ''
  },

  refreshI18n: function () {
    this.setData({
      t: {
        appName: i18n.t('index.appName'),
        navTitle: i18n.t('index.navTitle'),
        viewProfile: i18n.t('index.viewProfile'),
        settingsSection: i18n.t('index.settingsSection'),
        copyright: i18n.t('common.copyright'),
        rightsReserved: i18n.t('common.rightsReserved'),
        todayTitle: i18n.t('index.todayTitle'),
        todayEmpty: i18n.t('index.todayEmpty'),
        todayUnavailable: i18n.t('index.todayUnavailable'),
        todayLoading: i18n.t('common.loading'),
        viewSchedule: i18n.t('features.schedule.title')
      },
      systemActions: getSystemActions().map((action) => this.withHomeIcon(action))
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
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  },

  openInbox: function() {
    wx.navigateTo({
      url: '/pages/inbox/inbox'
    })
  },

  loadHomeSections: function() {
    const page = this
    const hiddenFeatureIds = this.data.hiddenFeatureIds || []
    const homeSections = featureConfig.getHomeSections().map(function(section) {
      return {
        id: section.id,
        title: section.title,
        features: section.features.filter(function(feature) {
          return hiddenFeatureIds.indexOf(feature.id) === -1
        }).map(function(feature) { return page.withHomeIcon(feature) })
      }
    }).filter(function(section) {
      return section.features.length > 0
    })

    this.setData({
      homeSections: homeSections,
      todayVisible: homeSections.some(function(section) {
        return section.features.some(function(feature) { return feature.id === 'schedule' })
      })
    })
  },

  withHomeIcon: function(item) {
    return Object.assign({}, item, { icon: homeIcons.getIcon(item.id, false), iconDark: homeIcons.getIcon(item.id, true) })
  },

  loadTodaySchedule: function() {
    const generation = this.todayGeneration = (this.todayGeneration || 0) + 1
    const now = new Date()
    const date = todaySchedule.campusDate(now).label
    this.setData({ todayDate: date, todaySource: dataSource.getDataSourceLabel(), today: { status: 'loading', lessons: [] } })
    if (!this.data.todayVisible || !auth.getSessionToken()) {
      this.setData({ today: { status: 'unavailable', lessons: [] } })
      return
    }
    campusApi.getSchedule().then((result) => {
      if (this.unloaded || !this.data.todayVisible || generation !== this.todayGeneration) return
      // A response that crossed campus midnight is not today's timetable.
      if (todaySchedule.campusDate(new Date()).label !== date) {
        this.loadTodaySchedule()
        return
      }
      this.setData({ today: result && result.success ? todaySchedule.getTodaySchedule(result.data, now) : { status: 'unavailable', lessons: [] } })
    }).catch(() => {
      if (this.unloaded || !this.data.todayVisible || generation !== this.todayGeneration) return
      this.setData({ today: { status: 'unavailable', lessons: [] } })
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
    Promise.all([
      messagesApi.getUnreadCount().catch(function() {
        return { success: true, data: 0 }
      }),
      socialApi.getUnread().catch(function() {
        return { success: true, data: { total: 0 } }
      })
    ]).then((results) => {
      const interactionUnread = results[0] && results[0].success ? Number(results[0].data || 0) : 0
      const directUnread =
        results[1] && results[1].success ? Number((results[1].data && results[1].data.total) || 0) : 0
      const unreadCount = interactionUnread + directUnread
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
    this.setData({ hiddenFeatureIds: [] })
  },

  onShow: function() {
    themeUtil.applyTheme(this)
    tabBarUtil.syncTabBar(this, 0)
    this.refreshI18n()
    this.loadProfile()
    this.loadInboxStatus()
    this.loadHomeSections()
    this.loadTodaySchedule()
    if (auth.getSessionToken()) {
      socialRealtime.ensureConnected()
    }
  },

  onHide: function() {
    this.todayGeneration = (this.todayGeneration || 0) + 1
  },

  onUnload: function() {
    this.unloaded = true
    this.todayGeneration = (this.todayGeneration || 0) + 1
  },

  onShareAppMessage: function() {
    return {
      title: i18n.t('index.appName'),
      path: '/pages/login/login'
    }
  }
})
