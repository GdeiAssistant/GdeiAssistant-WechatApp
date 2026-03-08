const utils = require('../../utils/util.js')
const campusApi = require('../../services/apis/campus.js')

Page({
  data: {
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
        utils.showModal('查询失败', result.message)
      }
    }).catch((error) => {
      wx.hideNavigationBarLoading()
      utils.showModal('查询失败', error.message)
    })
  },

  onLoad: function() {
    this.getCardInfo()
  },

  onShareAppMessage: function() {
    wx.showShareMenu({
      showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
    })
  }
})
