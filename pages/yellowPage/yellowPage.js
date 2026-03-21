const dataApi = require('../../services/apis/data.js')
const pageUtils = require('../../utils/page.js')
var themeUtil = require('../../utils/theme')

function groupYellowPage(result) {
  const typeList = result.type || []
  const pageList = result.data || []

  return typeList.map(function(typeItem) {
    return {
      typeCode: typeItem.typeCode,
      typeName: typeItem.typeName,
      items: pageList.filter(function(pageItem) {
        return pageItem.typeCode === typeItem.typeCode
      })
    }
  }).filter(function(group) {
    return group.items.length > 0
  })
}

Page({
  onShow: function () {
    themeUtil.applyTheme(this)
  },
  data: {
    themeClass: '',
    loading: false,
    groupedYellowPages: [],
    errorMessage: null
  },

  loadYellowPage: function() {
    pageUtils.runWithNavigationLoading(this, () => {
      return dataApi.getYellowPage()
    }).then((result) => {
      if (result.success && result.data) {
        this.setData({
          groupedYellowPages: groupYellowPage(result.data)
        })
      } else {
        pageUtils.showTopTips(this, result.message)
      }
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  handleItemTap: function(event) {
    const phoneNumber = event.currentTarget.dataset.phone
    if (!phoneNumber) {
      return
    }

    wx.makePhoneCall({
      phoneNumber: phoneNumber
    })
  },

  onLoad: function() {
    this.loadYellowPage()
  },

  onShareAppMessage: function() {
    return {
      title: '黄页查询',
      path: '/pages/yellowPage/yellowPage'
    }
  }
})
