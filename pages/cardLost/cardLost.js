const campusApi = require('../../services/apis/campus.js')

Page({
  data: {
    loading: false,
    errorMessage: null
  },

  showTopTips: function(content) {
    const that = this
    this.setData({ errorMessage: content })
    setTimeout(function() {
      that.setData({ errorMessage: null })
    }, 3000)
  },

  setCardLost: function(e) {
    const cardPassword = e.detail.value.password
    if (!(cardPassword && cardPassword.length === 6 && /^\d+$/.test(cardPassword))) {
      this.showTopTips('请输入正确的校园卡查询密码')
      return
    }

    wx.showNavigationBarLoading()
    this.setData({ loading: true })

    campusApi.setCardLost(cardPassword).then((result) => {
      wx.hideNavigationBarLoading()
      this.setData({ loading: false })
      if (result.success) {
        wx.showModal({
          title: '挂失成功',
          content: '请尽快前往办卡处进行校园卡补办',
          showCancel: false
        })
      } else {
        this.showTopTips(result.message)
      }
    }).catch((error) => {
      wx.hideNavigationBarLoading()
      this.setData({ loading: false })
      this.showTopTips(error.message)
    })
  },

  onShareAppMessage: function() {
    wx.showShareMenu({
      showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
    })
  }
})
