const { getSystemActions } = require('../../constants/features.js')
const auth = require('../../services/auth.js')
const dataSource = require('../../services/data-source.js')
const campusApi = require('../../services/apis/campus.js')
const messagesApi = require('../../services/apis/messages.js')
const socialApi = require('../../services/apis/social.js')
const socialRealtime = require('../../services/social-realtime.js')
const userApi = require('../../services/apis/user.js')
const featureConfig = require('../../services/feature-config.js')
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

function getTodayColumnIndex() {
  return (new Date().getDay() + 6) % 7
}

Page({
  data: {
    themeClass: 'theme-light accent-banyan',
    themeAccent: 'banyan',
    themeColor: '#0E7C61',
    isDarkTheme: false,
    fontStyle: '',
    t: {},
    avatar: null,
    nickname: null,
    homeSections: [],
    systemActions: [],
    hiddenFeatureIds: [],
    inboxUnreadCount: 0,
    inboxBadgeText: '',
    cardBalance: '--',
    cardStatusText: '',
    cardStatusNormal: true,
    currentWeek: 5,
    weekBadgeText: '',
    todayAgenda: [],
    todayClassCount: 0,
    todayClassCountText: '',
    latestNotice: null
  },

  refreshI18n: function () {
    var week = this.data.currentWeek || 5
    var count = this.data.todayClassCount || 0
    this.setData({
      t: {
        appName: i18n.t('index.appName'),
        navTitle: i18n.t('index.navTitle'),
        viewProfile: i18n.t('index.viewProfile'),
        settingsSection: i18n.t('index.settingsSection'),
        campusTagline: i18n.t('index.campusTagline'),
        campusCardTitle: i18n.t('index.campusCardTitle'),
        cardBalanceLabel: i18n.t('index.cardBalanceLabel'),
        cardStatusNormal: i18n.t('index.cardStatusNormal'),
        cardStatusAbnormal: i18n.t('index.cardStatusAbnormal'),
        cardDetailBtn: i18n.t('index.cardDetailBtn'),
        todayAgendaTitle: i18n.t('index.todayAgendaTitle'),
        noAgendaToday: i18n.t('index.noAgendaToday'),
        viewFullSchedule: i18n.t('index.viewFullSchedule'),
        noticeLabel: i18n.t('index.noticeLabel'),
        inboxLabel: i18n.t('index.inboxLabel'),
        footerNote: i18n.t('index.footerNote'),
        copyright: i18n.t('common.copyright'),
        rightsReserved: i18n.t('common.rightsReserved')
      },
      weekBadgeText: i18n.tReplace('index.weekBadge', { week: week }),
      todayClassCountText: i18n.tReplace('index.todayClassCount', { count: count }),
      systemActions: getSystemActions()
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },

  logout: function () {
    wx.showModal({
      title: i18n.t('index.logoutTitle'),
      content: i18n.t('index.logoutContent'),
      success: function (res) {
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

  handleActionTap: function (event) {
    const action = event.currentTarget.dataset.action
    if (action === 'logout') {
      this.logout()
    }
  },

  openProfile: function () {
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  },

  openInbox: function () {
    wx.navigateTo({
      url: '/pages/inbox/inbox'
    })
  },

  openCard: function () {
    wx.navigateTo({
      url: '/pages/card/card'
    })
  },

  openSchedule: function () {
    wx.navigateTo({
      url: '/pages/schedule/schedule'
    })
  },

  openAnnouncement: function () {
    var notice = this.data.latestNotice
    if (notice && notice.id) {
      wx.navigateTo({
        url: '/pages/announcement/announcement?id=' + encodeURIComponent(String(notice.id))
      })
      return
    }
    wx.navigateTo({
      url: '/pages/inbox/inbox'
    })
  },

  loadHomeSections: function () {
    const hiddenFeatureIds = this.data.hiddenFeatureIds || []
    const homeSections = featureConfig
      .getHomeSections()
      .map(function (section) {
        return {
          id: section.id,
          title: section.title,
          features: section.features.filter(function (feature) {
            return hiddenFeatureIds.indexOf(feature.id) === -1
          })
        }
      })
      .filter(function (section) {
        return section.features.length > 0
      })

    this.setData({
      homeSections: homeSections
    })
  },

  loadProfile: function () {
    const page = this
    var defaultNickname = i18n.t('index.defaultNickname')

    userApi
      .getAvatar()
      .then(function (result) {
        page.setData({
          avatar: result.success && result.data ? result.data : '../../image/default.png'
        })
      })
      .catch(function () {
        page.setData({
          avatar: '../../image/default.png'
        })
      })

    userApi
      .getProfile()
      .then(function (result) {
        page.setData({
          nickname:
            result.success && result.data && result.data.nickname
              ? result.data.nickname
              : defaultNickname
        })
      })
      .catch(function () {
        page.setData({
          nickname: defaultNickname
        })
      })
  },

  loadEditorialSummary: function () {
    const canFetchCampus =
      typeof dataSource.isMockMode === 'function' &&
      (dataSource.isMockMode() || typeof wx.request === 'function')
    if (!canFetchCampus) {
      return
    }

    const page = this
    if (typeof campusApi.getCardInfo === 'function') {
      campusApi
        .getCardInfo()
        .then(function (res) {
          if (res && res.success && res.data) {
            var lostState = String(res.data.cardLostState || '').toLowerCase()
            var isAbnormal =
              lostState.indexOf('lost') !== -1 ||
              lostState.indexOf('挂失') !== -1 ||
              lostState.indexOf('掛失') !== -1 ||
              lostState.indexOf('紛失') !== -1 ||
              lostState.indexOf('분실') !== -1
            page.setData({
              cardBalance:
                res.data.cardBalance !== undefined && res.data.cardBalance !== null
                  ? String(res.data.cardBalance)
                  : '--',
              cardStatusText: res.data.cardLostState || i18n.t('index.cardStatusNormal'),
              cardStatusNormal: !isAbnormal
            })
          }
        })
        .catch(function () {})
    }

    if (typeof campusApi.getSchedule === 'function') {
      campusApi
        .getSchedule()
        .then(function (res) {
          if (res && res.success && res.data) {
            var week = Number(res.data.week || 5)
            var list = Array.isArray(res.data.scheduleList) ? res.data.scheduleList : []
            var todayCol = getTodayColumnIndex()
            var todayClasses = list.filter(function (item) {
              return Number(item.column) === todayCol
            })
            page.setData({
              currentWeek: week,
              weekBadgeText: i18n.tReplace('index.weekBadge', { week: week }),
              todayAgenda: todayClasses.slice(0, 3),
              todayClassCount: todayClasses.length,
              todayClassCountText: i18n.tReplace('index.todayClassCount', {
                count: todayClasses.length
              })
            })
          }
        })
        .catch(function () {})
    }

    if (typeof messagesApi.getAnnouncementList === 'function') {
      messagesApi
        .getAnnouncementList(0, 1)
        .then(function (res) {
          if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
            page.setData({
              latestNotice: res.data[0]
            })
          }
        })
        .catch(function () {})
    }
  },

  loadInboxStatus: function () {
    Promise.all([
      messagesApi.getUnreadCount().catch(function () {
        return { success: true, data: 0 }
      }),
      socialApi.getUnread().catch(function () {
        return { success: true, data: { total: 0 } }
      })
    ])
      .then((results) => {
        const interactionUnread =
          results[0] && results[0].success ? Number(results[0].data || 0) : 0
        const directUnread =
          results[1] && results[1].success
            ? Number((results[1].data && results[1].data.total) || 0)
            : 0
        const unreadCount = interactionUnread + directUnread
        this.setData({
          inboxUnreadCount: unreadCount,
          inboxBadgeText: formatInboxBadge(unreadCount)
        })
      })
      .catch(() => {
        this.setData({
          inboxUnreadCount: 0,
          inboxBadgeText: ''
        })
      })
  },

  onLoad: function () {
    this.setData({ hiddenFeatureIds: [] })
  },

  onShow: function () {
    themeUtil.applyTheme(this)
    tabBarUtil.syncTabBar(this, 0)
    this.refreshI18n()
    this.loadProfile()
    this.loadInboxStatus()
    this.loadHomeSections()
    this.loadEditorialSummary()
    if (auth.getSessionToken()) {
      socialRealtime.ensureConnected()
    }
  },

  onShareAppMessage: function () {
    return {
      title: i18n.t('index.appName'),
      path: '/pages/login/login'
    }
  }
})
