const utils = require('../../utils/util.js')
const campusApi = require('../../services/apis/campus.js')
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
        navTitle: i18n.t('cardPage.navTitle'),
        transactionHistory: i18n.t('cardPage.transactionHistory'),
        transactionHistoryDesc: i18n.t('cardPage.transactionHistoryDesc'),
        reportLost: i18n.t('cardPage.reportLost'),
        reportLostDesc: i18n.t('cardPage.reportLostDesc'),
        basicInfo: i18n.t('cardPage.basicInfo'),
        name: i18n.t('cardPage.name'),
        studentId: i18n.t('cardPage.studentId'),
        cardNumber: i18n.t('cardPage.cardNumber'),
        balanceInfo: i18n.t('cardPage.balanceInfo'),
        balance: i18n.t('cardPage.balance'),
        interimBalance: i18n.t('cardPage.interimBalance'),
        statusInfo: i18n.t('cardPage.statusInfo'),
        freezeStatus: i18n.t('cardPage.freezeStatus'),
        lostStatus: i18n.t('cardPage.lostStatus')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },
  data: {
    themeClass: '',
    t: {},
    card: null
  },

  getCardInfo: function() {
    const page = this
    wx.showNavigationBarLoading()
    campusApi.getCardInfo().then((result) => {
      wx.hideNavigationBarLoading()
      if (result.success) {
        page.setData({
          card: {
            name: result.data.name,
            number: result.data.number,
            cardBalance: result.data.cardBalance,
            cardInterimBalance: result.data.cardInterimBalance,
            cardNumber: result.data.cardNumber,
            cardLostState: result.data.cardLostState,
            cardFreezeState: result.data.cardFreezeState
          }
        })
      } else {
        utils.showModal(i18n.t('cardPage.queryFailed'), result.message)
      }
    }).catch((error) => {
      wx.hideNavigationBarLoading()
      utils.showModal(i18n.t('cardPage.queryFailed'), error.message)
    })
  },

  onLoad: function() {
    this.getCardInfo()
  },

  onShareAppMessage: function() {
    return {
      title: i18n.t('cardPage.shareTitle'),
      path: '/pages/card/card'
    }
  }
})
