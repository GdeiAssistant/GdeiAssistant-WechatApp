const { getSystemActions } = require('../../constants/features.js')
const auth = require('../../services/auth.js')
const socialRealtime = require('../../services/social-realtime.js')
const featureConfig = require('../../services/feature-config.js')
var themeUtil = require('../../utils/theme')
var tabBarUtil = require('../../utils/tab-bar')
var i18n = require('../../utils/i18n')

const GREETING_KEYS = [
  'index.greetingNight',
  'index.greetingMorning',
  'index.greetingNoon',
  'index.greetingAfternoon',
  'index.greetingEvening',
  'index.greetingNight'
]

function greetingKeyByHour(hour) {
  if (hour >= 5 && hour <= 11) {
    return GREETING_KEYS[1]
  }
  if (hour >= 12 && hour <= 13) {
    return GREETING_KEYS[2]
  }
  if (hour >= 14 && hour <= 17) {
    return GREETING_KEYS[3]
  }
  if (hour >= 18 && hour <= 23) {
    return GREETING_KEYS[4]
  }
  return GREETING_KEYS[0]
}

function formatToday() {
  const now = new Date()
  const locale = i18n.getCurrentLocale ? i18n.getCurrentLocale() : 'zh-CN'
  const month = now.getMonth() + 1
  const date = now.getDate()
  const day = now.getDay()

  if (locale === 'en') {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return weekDays[day] + ', ' + months[month - 1] + ' ' + date
  }
  if (locale === 'ja') {
    const weekDays = ['日', '月', '火', '水', '木', '金', '土']
    return month + '月' + date + '日（' + weekDays[day] + '）'
  }
  if (locale === 'ko') {
    const weekDays = ['일', '월', '화', '수', '목', '금', '토']
    return month + '월 ' + date + '일 (' + weekDays[day] + ')'
  }
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return month + '月' + date + '日 ' + weekDays[day]
}

Page({
  data: {
    themeClass: '',
    fontStyle: '',
    t: {},
    homeSections: [],
    systemActions: [],
    hiddenFeatureIds: []
  },

  refreshI18n: function () {
    this.setData({
      t: {
        appName: i18n.t('index.appName'),
        navTitle: i18n.t('index.navTitle'),
        greeting: i18n.t(greetingKeyByHour(new Date().getHours())),
        today: formatToday(),
        settingsSection: i18n.t('index.settingsSection'),
        copyright: i18n.t('common.copyright'),
        rightsReserved: i18n.t('common.rightsReserved')
      },
      systemActions: getSystemActions()
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
      homeSections: homeSections
    })
  },

  onLoad: function() {
    this.setData({ hiddenFeatureIds: [] })
  },

  onShow: function() {
    themeUtil.applyTheme(this)
    tabBarUtil.syncTabBar(this, 0)
    tabBarUtil.refreshUnreadBadge(this)
    this.refreshI18n()
    this.loadHomeSections()
    if (auth.getSessionToken()) {
      socialRealtime.ensureConnected()
    }
  },

  onShareAppMessage: function() {
    return {
      title: i18n.t('index.appName'),
      path: '/pages/login/login'
    }
  }
})
