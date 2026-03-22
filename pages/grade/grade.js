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
    tabs: [],
    firstTermGradeList: null,
    secondTermGradeList: null,
    activeIndex: -1
  },

  refreshI18n: function () {
    var tabs = i18n.t('grade.tabs')
    if (!Array.isArray(tabs)) {
      tabs = ['大一', '大二', '大三', '大四']
    }
    this.setData({
      tabs: tabs,
      t: {
        navTitle: i18n.t('grade.navTitle'),
        title: i18n.t('grade.title'),
        firstTerm: i18n.t('grade.firstTerm'),
        secondTerm: i18n.t('grade.secondTerm')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },

  tabClick: function(e) {
    this.setData({
      activeIndex: Number(e.currentTarget.id)
    })
    this.getGrade()
  },

  getGrade: function() {
    const page = this
    wx.showNavigationBarLoading()
    campusApi.getGrade(this.data.activeIndex).then((result) => {
      wx.hideNavigationBarLoading()
      if (result.success) {
        page.setData({
          firstTermGradeList: result.data.firstTermGradeList,
          secondTermGradeList: result.data.secondTermGradeList,
          activeIndex: result.data.year
        })
      } else {
        utils.showModal(i18n.t('common.queryFailed'), result.message)
      }
    }).catch((error) => {
      wx.hideNavigationBarLoading()
      utils.showModal(i18n.t('common.queryFailed'), error.message)
    })
  },

  onLoad: function() {
    this.refreshI18n()
    this.getGrade()
  },

  onShareAppMessage: function() {
    return {
      title: i18n.t('grade.title'),
      path: '/pages/grade/grade'
    }
  }
})
