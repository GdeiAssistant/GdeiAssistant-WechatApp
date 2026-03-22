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
        navTitle: i18n.t('cardLostPage.navTitle')
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
      pageUtils.showTopTips(this, '请输入正确的校园卡查询密码')
      return
    }

    pageUtils.runWithNavigationLoading(this, () => {
      return campusApi.setCardLost(cardPassword)
    }).then((result) => {
      if (result.success) {
        wx.showModal({
          title: '挂失成功',
          content: '请尽快前往办卡处进行校园卡补办',
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
      title: '校园卡挂失',
      path: '/pages/cardLost/cardLost'
    }
  }
})
