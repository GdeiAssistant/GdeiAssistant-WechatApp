const utils = require('../../utils/util.js')
const libraryApi = require('../../services/apis/library.js')

Page({
  data: {
    password: null,
    result: null,
    errorMessage: null,
    loading: false
  },

  showTopTips: function(content) {
    const that = this
    this.setData({ errorMessage: content })
    setTimeout(function() {
      that.setData({ errorMessage: null })
    }, 3000)
  },

  submit: function(e) {
    const password = e.detail.value.password
    this.setData({ password, loading: true })
    wx.showNavigationBarLoading()

    libraryApi.queryBook(password).then((result) => {
      wx.hideNavigationBarLoading()
      this.setData({ loading: false })
      if (result.success) {
        this.setData({ result: result.data })
      } else {
        utils.showModal('查询失败', result.message)
      }
    }).catch((error) => {
      wx.hideNavigationBarLoading()
      this.setData({ loading: false })
      utils.showModal('查询失败', error.message)
    })
  },

  renewBook: function(event) {
    const index = event.currentTarget.dataset.index
    const id = event.currentTarget.dataset.id
    const sn = event.currentTarget.dataset.sn
    const password = this.data.password

    wx.showNavigationBarLoading()
    this.setData({ loading: true })

    libraryApi.renewBook(id, sn, password).then((result) => {
      wx.hideNavigationBarLoading()
      this.setData({ loading: false })
      if (result.success) {
        utils.showNoActionModal('续借成功', '已成功续借图书')
        const list = this.data.result
        list[index].renewTime++
        this.setData({ result: list })
      } else {
        utils.showNoActionModal('续借失败', result.message)
      }
    }).catch((error) => {
      wx.hideNavigationBarLoading()
      this.setData({ loading: false })
      utils.showNoActionModal('续借失败', error.message)
    })
  },

  onShareAppMessage: function() {
    wx.showShareMenu({
      showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
    })
  }
})
