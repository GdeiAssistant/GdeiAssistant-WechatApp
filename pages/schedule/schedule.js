const utils = require('../../utils/util.js')
const campusApi = require('../../services/apis/campus.js')
var themeUtil = require('../../utils/theme')
var i18n = require('../../utils/i18n')

Page({
  onShow: function () {
    themeUtil.applyTheme(this)
    this.refreshI18n()
  },
  data: {
    themeClass: '',
    fontStyle: '',
    t: {},
    index: 0,
    array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    scheduleList: null,
    week: null,
    tabs: [],
    activeIndex: 0
  },

  refreshI18n: function () {
    var tabs = i18n.t('schedule.tabs')
    if (!Array.isArray(tabs)) {
      tabs = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    }
    this.setData({
      tabs: tabs,
      t: {
        navTitle: i18n.t('schedule.navTitle'),
        title: i18n.t('schedule.title'),
        weekLabel: i18n.t('schedule.currentWeek'),
        weekRange: i18n.t('schedule.weekRange')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },

  formatWeekLabel: function (week) {
    return i18n.tReplace('schedule.currentWeek', { week: week })
  },

  formatWeekRange: function (min, max) {
    return i18n.tReplace('schedule.weekRange', { min: min, max: max })
  },

  bindPickerChange: function(e) {
    this.setData({
      week: parseInt(e.detail.value, 10) + 1
    })
    this.getDataList()
  },

  tabClick: function(e) {
    this.setData({
      activeIndex: Number(e.currentTarget.id)
    })
  },

  getDataList: function() {
    const page = this
    wx.showNavigationBarLoading()
    campusApi.getSchedule(this.data.week).then((result) => {
      wx.hideNavigationBarLoading()
      if (!result.success) {
        utils.showModal(i18n.t('common.queryFailed'), result.message)
        return
      }

      const list = [[], [], [], [], [], [], []]
      result.data.scheduleList.forEach(function(item) {
        list[item.column].push(item)
      })

      if (!page.data.week) {
        page.setData({
          index: parseInt(result.data.week, 10) - 1
        })
      }

      page.setData({
        scheduleList: list,
        week: result.data.week
      })
    }).catch((error) => {
      wx.hideNavigationBarLoading()
      utils.showModal(i18n.t('common.queryFailed'), error.message)
    })
  },

  onLoad: function() {
    this.refreshI18n()
    this.getDataList()
    const day = new Date().getDay()
    this.setData({
      activeIndex: day === 0 ? 6 : day - 1
    })
  },

  onShareAppMessage: function() {
    return {
      title: i18n.t('schedule.title'),
      path: '/pages/schedule/schedule'
    }
  }
})
