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
        navTitle: i18n.t('electricityPage.navTitle'),
        queryInfo: i18n.t('electricityPage.queryInfo'),
        yearLabel: i18n.t('electricityPage.yearLabel'),
        nameLabel: i18n.t('electricityPage.nameLabel'),
        namePlaceholder: i18n.t('electricityPage.namePlaceholder'),
        studentIdLabel: i18n.t('electricityPage.studentIdLabel'),
        studentIdPlaceholder: i18n.t('electricityPage.studentIdPlaceholder'),
        fillAllFields: i18n.t('electricityPage.fillAllFields'),
        invalidStudentId: i18n.t('electricityPage.invalidStudentId'),
        queryButton: i18n.t('electricityPage.queryButton'),
        resultTitle: i18n.t('electricityPage.resultTitle'),
        dormitory: i18n.t('electricityPage.dormitory'),
        occupants: i18n.t('electricityPage.occupants'),
        department: i18n.t('electricityPage.department'),
        usedAmount: i18n.t('electricityPage.usedAmount'),
        freeAmount: i18n.t('electricityPage.freeAmount'),
        chargedAmount: i18n.t('electricityPage.chargedAmount'),
        price: i18n.t('electricityPage.price'),
        totalBill: i18n.t('electricityPage.totalBill'),
        averageBill: i18n.t('electricityPage.averageBill'),
        reQuery: i18n.t('electricityPage.reQuery'),
        shareTitle: i18n.t('electricityPage.shareTitle')
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
      pageUtils.showTopTips(this, this.data.t.fillAllFields)
      return
    }

    if (!/^\d{8,12}$/.test(payload.number)) {
      pageUtils.showTopTips(this, this.data.t.invalidStudentId)
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
      title: this.data.t.shareTitle,
      path: '/pages/electricity/electricity'
    }
  }
})
