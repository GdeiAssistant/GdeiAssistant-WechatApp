const utils = require('../../utils/util.js')
const campusApi = require('../../services/apis/campus.js')
const pageUtils = require('../../utils/page.js')

Page({
  data: {
    checked: false,
    loading: false,
    errorMessage: null
  },

  formSubmit: function() {
    pageUtils.runWithNavigationLoading(this, () => {
      return campusApi.evaluate(this.data.checked)
    }).then((result) => {
      if (result.success) {
        if (this.data.checked) {
          utils.showModal('一键评教成功', '一键评教成功，评教信息已提交')
        } else {
          utils.showModal('一键评教成功', '一键评教成功，请登录教务系统进行最终确认')
        }
      } else {
        pageUtils.showTopTips(this, result.message)
      }
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  changeSwitch: function(e) {
    this.setData({ checked: e.detail.value })
  },

  onShareAppMessage: function() {
    return {
      title: '教学评价',
      path: '/pages/evaluate/evaluate'
    }
  }
})
