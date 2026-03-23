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
        navTitle: i18n.t('dataPage.navTitle'),
        selectProject: i18n.t('dataPage.selectProject'),
        electricityQuery: i18n.t('dataPage.electricityQuery'),
        yellowPageQuery: i18n.t('dataPage.yellowPageQuery'),
        shareTitle: i18n.t('dataPage.shareTitle')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },
  data: {
    t: {}
  },
  onShareAppMessage: function() {
    return {
      title: this.data.t.shareTitle,
      path: '/pages/data/data'
    }
  }
})
