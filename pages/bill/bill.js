const utils = require('../../utils/util.js')
const campusApi = require('../../services/apis/campus.js')

Page({
  data: {
    date: null,
    start: null,
    end: null,
    result: null,
    loading: false,
    errorMessage: null
  },

  reset: function() {
    this.setData({
      date: null,
      result: null,
      loading: false
    })
  },

  showTopTips: function(content) {
    const that = this
    this.setData({ errorMessage: content })
    setTimeout(function() {
      that.setData({ errorMessage: null })
    }, 3000)
  },

  submit: function() {
    if (!this.data.date) {
      this.showTopTips('请选择需要查询的日期')
      return
    }

    const dateStringArray = this.data.date.split('-')
    wx.showNavigationBarLoading()
    this.setData({ loading: true })

    campusApi.getCardBill(dateStringArray[0], dateStringArray[1], dateStringArray[2]).then((result) => {
      wx.hideNavigationBarLoading()
      this.setData({ loading: false })
      if (result.success) {
        this.setData({ result: result.data.cardList })
      } else {
        utils.showModal('查询失败', result.message)
      }
    }).catch((error) => {
      wx.hideNavigationBarLoading()
      this.setData({ loading: false })
      utils.showModal('查询失败', error.message)
    })
  },

  bindDateChange: function(event) {
    this.setData({ date: event.detail.value })
  },

  onLoad: function() {
    const todayDate = new Date()
    const lastYearDate = new Date(todayDate - 365 * 24 * 60 * 60 * 1000)
    this.setData({
      end: todayDate.getFullYear() + '-' + (todayDate.getMonth() + 1) + '-' + todayDate.getDate(),
      start: lastYearDate.getFullYear() + '-' + (lastYearDate.getMonth() + 1) + '-' + lastYearDate.getDate()
    })
  },

  onShareAppMessage: function() {
    wx.showShareMenu({
      showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
    })
  }
})
