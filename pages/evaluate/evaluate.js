const utils = require('../../utils/util.js')
const campusApi = require('../../services/apis/campus.js')

Page({
  data: {
    checked: false,
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

  formSubmit: function() {
    this.setData({ loading: true })
    wx.showNavigationBarLoading()

    campusApi.evaluate(this.data.checked).then((result) => {
      this.setData({ loading: false })
      wx.hideNavigationBarLoading()
      if (result.success) {
        if (this.data.checked) {
          utils.showModal('一键评教成功', '一键评教成功，评教信息已提交')
        } else {
          utils.showModal('一键评教成功', '一键评教成功，请登录教务系统进行最终确认')
        }
      } else {
        this.showTopTips(result.message)
      }
    }).catch((error) => {
      this.setData({ loading: false })
      wx.hideNavigationBarLoading()
      this.showTopTips(error.message)
    })
  },

  changeSwitch: function(e) {
    this.setData({ checked: e.detail.value })
  },

  onShareAppMessage: function() {
    wx.showShareMenu({
      showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
    })
  }
})
