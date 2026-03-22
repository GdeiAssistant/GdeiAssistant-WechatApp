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
        navTitle: i18n.t('evaluatePage.navTitle'),
        autoSubmitTitle: i18n.t('evaluatePage.autoSubmitTitle'),
        autoSubmitLabel: i18n.t('evaluatePage.autoSubmitLabel'),
        submitButton: i18n.t('evaluatePage.submitButton'),
        successTitle: i18n.t('evaluatePage.successTitle'),
        successWithSubmit: i18n.t('evaluatePage.successWithSubmit'),
        successWithoutSubmit: i18n.t('evaluatePage.successWithoutSubmit'),
        shareTitle: i18n.t('evaluatePage.shareTitle')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },
  data: {
    themeClass: '',
    t: {},
    checked: false,
    loading: false,
    errorMessage: null
  },

  formSubmit: function() {
    pageUtils.runWithNavigationLoading(this, () => {
      return campusApi.evaluate(this.data.checked)
    }).then((result) => {
      if (result.success) {
        if (this.data.checked) {
          utils.showModal(i18n.t('evaluatePage.successTitle'), i18n.t('evaluatePage.successWithSubmit'))
        } else {
          utils.showModal(i18n.t('evaluatePage.successTitle'), i18n.t('evaluatePage.successWithoutSubmit'))
        }
      } else {
        pageUtils.showTopTips(this, result.message)
      }
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  changeSwitch: function(e) {
    this.setData({ checked: e.detail.value })
  },

  onShareAppMessage: function() {
    return {
      title: i18n.t('evaluatePage.shareTitle'),
      path: '/pages/evaluate/evaluate'
    }
  }
})
