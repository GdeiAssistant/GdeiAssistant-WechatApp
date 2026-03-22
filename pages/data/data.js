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
        navTitle: i18n.t('dataPage.navTitle')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },
  data: {
    t: {}
  },
  onShareAppMessage: function() {
    return {
      title: '数据查询',
      path: '/pages/data/data'
    }
  }
})
