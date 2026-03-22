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
        navTitle: i18n.t('cardLostPage.navTitle'),
        passwordLabel: i18n.t('cardLostPage.passwordLabel'),
        passwordPlaceholder: i18n.t('cardLostPage.passwordPlaceholder'),
        passwordValidation: i18n.t('cardLostPage.passwordValidation'),
        reportButton: i18n.t('cardLostPage.reportButton'),
        warning: i18n.t('cardLostPage.warning'),
        successTitle: i18n.t('cardLostPage.successTitle'),
        successContent: i18n.t('cardLostPage.successContent'),
        shareTitle: i18n.t('cardLostPage.shareTitle')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },
  data: {
    themeClass: '',
    t: {},
    loading: false,
    errorMessage: null
  },

  setCardLost: function(e) {
    const cardPassword = e.detail.value.password
    if (!(cardPassword && cardPassword.length === 6 && /^\d+$/.test(cardPassword))) {
      pageUtils.showTopTips(this, i18n.t('cardLostPage.passwordValidation'))
      return
    }

    pageUtils.runWithNavigationLoading(this, () => {
      return campusApi.setCardLost(cardPassword)
    }).then((result) => {
      if (result.success) {
        wx.showModal({
          title: i18n.t('cardLostPage.successTitle'),
          content: i18n.t('cardLostPage.successContent'),
          showCancel: false
        })
      } else {
        pageUtils.showTopTips(this, result.message)
      }
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  onShareAppMessage: function() {
    return {
      title: i18n.t('cardLostPage.shareTitle'),
      path: '/pages/cardLost/cardLost'
    }
  }
})
