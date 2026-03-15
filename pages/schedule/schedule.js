const utils = require('../../utils/util.js')
const campusApi = require('../../services/apis/campus.js')

Page({
  data: {
    index: 0,
    array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    scheduleList: null,
    week: null,
    tabs: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    activeIndex: 0
  },

  bindPickerChange: function(e) {
    this.setData({
      week: parseInt(e.detail.value, 10) + 1
    })
    this.getDataList()
  },

  tabClick: function(e) {
    this.setData({
      activeIndex: Number(e.currentTarget.id)
    })
  },

  getDataList: function() {
    const page = this
    wx.showNavigationBarLoading()
    campusApi.getSchedule(this.data.week).then((result) => {
      wx.hideNavigationBarLoading()
      if (!result.success) {
        utils.showModal('查询失败', result.message)
        return
      }

      const list = [[], [], [], [], [], [], []]
      result.data.scheduleList.forEach(function(item) {
        list[item.column].push(item)
      })

      if (!page.data.week) {
        page.setData({
          index: parseInt(result.data.week, 10) - 1
        })
      }

      page.setData({
        scheduleList: list,
        week: result.data.week
      })
    }).catch((error) => {
      wx.hideNavigationBarLoading()
      utils.showModal('查询失败', error.message)
    })
  },

  onLoad: function() {
    this.getDataList()
    const day = new Date().getDay()
    this.setData({
      activeIndex: day === 0 ? 6 : day - 1
    })
  },

  onShareAppMessage: function() {
    return {
      title: '课表查询',
      path: '/pages/schedule/schedule'
    }
  }
})
