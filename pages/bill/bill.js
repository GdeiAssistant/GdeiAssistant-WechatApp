const utils = require('../../utils/util.js')
const campusApi = require('../../services/apis/campus.js')
const pageUtils = require('../../utils/page.js')
var themeUtil = require('../../utils/theme')
var i18n = require('../../utils/i18n')

Page({
  onShow: function () {
    themeUtil.applyTheme(this)
    this.refreshI18n()
  },
  refreshI18n: function () {
    this.setData({
      t: {
        navTitle: i18n.t('billPage.navTitle'),
        selectDateHint: i18n.t('billPage.selectDateHint'),
        dateLabel: i18n.t('billPage.dateLabel'),
        notSelected: i18n.t('billPage.notSelected'),
        queryButton: i18n.t('billPage.queryButton'),
        noRecords: i18n.t('billPage.noRecords'),
        recordsTitle: i18n.t('billPage.recordsTitle'),
        yuan: i18n.t('billPage.yuan'),
        reQuery: i18n.t('billPage.reQuery'),
        queryFailed: i18n.t('common.queryFailed'),
        shareTitle: i18n.t('billPage.shareTitle')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },
  data: {
    themeClass: '',
    t: {},
    date: null,
    start: null,
    end: null,
    result: null,
    loading: false,
    errorMessage: null
  },

  reset: function() {
    this.setData({
      date: null,
      result: null,
      loading: false
    })
  },

  submit: function() {
    if (!this.data.date) {
      pageUtils.showTopTips(this, i18n.t('billPage.selectDateHint'))
      return
    }

    const dateStringArray = this.data.date.split('-')

    pageUtils.runWithNavigationLoading(this, () => {
      return campusApi.getCardBill(dateStringArray[0], dateStringArray[1], dateStringArray[2])
    }).then((result) => {
      if (result.success) {
        this.setData({ result: result.data.cardList })
      } else {
        utils.showModal(i18n.t('common.queryFailed'), result.message)
      }
    }).catch((error) => {
      utils.showModal(i18n.t('common.queryFailed'), error.message)
    })
  },

  bindDateChange: function(event) {
    this.setData({ date: event.detail.value })
  },

  onLoad: function() {
    const todayDate = new Date()
    const lastYearDate = new Date(todayDate - 365 * 24 * 60 * 60 * 1000)
    this.setData({
      end: todayDate.getFullYear() + '-' + (todayDate.getMonth() + 1) + '-' + todayDate.getDate(),
      start: lastYearDate.getFullYear() + '-' + (lastYearDate.getMonth() + 1) + '-' + lastYearDate.getDate()
    })
  },

  onShareAppMessage: function() {
    return {
      title: i18n.t('billPage.shareTitle'),
      path: '/pages/bill/bill'
    }
  }
})
