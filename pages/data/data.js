var themeUtil = require('../../utils/theme')
Page({
  onShow: function () {
    themeUtil.applyTheme(this)
  },
  onShareAppMessage: function() {
    return {
      title: '数据查询',
      path: '/pages/data/data'
    }
  }
})
