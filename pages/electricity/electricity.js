const dataApi = require('../../services/apis/data.js')
const pageUtils = require('../../utils/page.js')
var themeUtil = require('../../utils/theme')
var i18n = require('../../utils/i18n')

function buildYearOptions() {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear; year >= 2016; year--) {
    years.push(year)
  }
  return years
}

Page({
  onShow: function () {
    themeUtil.applyTheme(this)
    this.refreshI18n()
  },
  refreshI18n: function () {
    this.setData({
      t: {
        navTitle: i18n.t('electricityPage.navTitle')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },
  data: {
    themeClass: '',
    t: {},
    yearOptions: buildYearOptions(),
    yearIndex: 0,
    name: '',
    number: '',
    result: null,
    loading: false,
    errorMessage: null
  },

  handlePickerChange: function(event) {
    this.setData({
      yearIndex: Number(event.detail.value)
    })
  },

  setFieldValue: function(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [field]: event.detail.value
    })
  },

  submitQuery: function() {
    const payload = {
      year: this.data.yearOptions[this.data.yearIndex],
      name: String(this.data.name || '').trim(),
      number: String(this.data.number || '').trim()
    }

    if (!payload.name || !payload.number) {
      pageUtils.showTopTips(this, '请完整填写姓名和学号')
      return
    }

    if (!/^\d{8,12}$/.test(payload.number)) {
      pageUtils.showTopTips(this, '请输入正确的学号')
      return
    }

    pageUtils.runWithNavigationLoading(this, () => {
      return dataApi.queryElectricFees(payload)
    }).then((result) => {
      if (result.success) {
        this.setData({ result: result.data })
      } else {
        pageUtils.showTopTips(this, result.message)
      }
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  resetQuery: function() {
    this.setData({
      result: null
    })
  },

  onShareAppMessage: function() {
    return {
      title: '电费查询',
      path: '/pages/electricity/electricity'
    }
  }
})
