const utils = require('../../utils/util.js')
const campusApi = require('../../services/apis/campus.js')

Page({
  data: {
    tabs: ['大一', '大二', '大三', '大四'],
    firstTermGradeList: null,
    secondTermGradeList: null,
    activeIndex: -1
  },

  tabClick: function(e) {
    this.setData({
      activeIndex: Number(e.currentTarget.id)
    })
    this.getGrade()
  },

  getGrade: function() {
    const page = this
    wx.showNavigationBarLoading()
    campusApi.getGrade(this.data.activeIndex).then((result) => {
      wx.hideNavigationBarLoading()
      if (result.success) {
        page.setData({
          firstTermGradeList: result.data.firstTermGradeList,
          secondTermGradeList: result.data.secondTermGradeList,
          activeIndex: result.data.year
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
    this.getGrade()
  },

  onShareAppMessage: function() {
    wx.showShareMenu({
      showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
    })
  }
})
