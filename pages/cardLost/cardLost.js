const campusApi = require('../../services/apis/campus.js')
const pageUtils = require('../../utils/page.js')

Page({
  data: {
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
    wx.showShareMenu({
      showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
    })
  }
})
