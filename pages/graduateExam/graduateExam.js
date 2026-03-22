const infoApi = require('../../services/apis/info.js')
const pageUtils = require('../../utils/page.js')
var themeUtil = require('../../utils/theme')
var i18n = require('../../utils/i18n')

Page({
  onShow: function () {
    themeUtil.applyTheme(this)
    this.refreshI18n()
  },
  refreshI18n: function () {
    this.setData({
      t: {
        navTitle: i18n.t('graduateExamPage.navTitle'),
        queryInfo: i18n.t('graduateExamPage.queryInfo'),
        nameLabel: i18n.t('graduateExamPage.nameLabel'),
        namePlaceholder: i18n.t('graduateExamPage.namePlaceholder'),
        examNumberLabel: i18n.t('graduateExamPage.examNumberLabel'),
        examNumberPlaceholder: i18n.t('graduateExamPage.examNumberPlaceholder'),
        idNumberLabel: i18n.t('graduateExamPage.idNumberLabel'),
        idNumberPlaceholder: i18n.t('graduateExamPage.idNumberPlaceholder'),
        queryButton: i18n.t('graduateExamPage.queryButton'),
        fillAllFields: i18n.t('graduateExamPage.fillAllFields'),
        resultTitle: i18n.t('graduateExamPage.resultTitle'),
        resultName: i18n.t('graduateExamPage.resultName'),
        signUpNumber: i18n.t('graduateExamPage.signUpNumber'),
        resultExamNumber: i18n.t('graduateExamPage.resultExamNumber'),
        totalScore: i18n.t('graduateExamPage.totalScore'),
        firstScore: i18n.t('graduateExamPage.firstScore'),
        secondScore: i18n.t('graduateExamPage.secondScore'),
        thirdScore: i18n.t('graduateExamPage.thirdScore'),
        fourthScore: i18n.t('graduateExamPage.fourthScore'),
        reQuery: i18n.t('graduateExamPage.reQuery'),
        shareTitle: i18n.t('graduateExamPage.shareTitle')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },
  data: {
    themeClass: '',
    t: {},
    name: '',
    examNumber: '',
    idNumber: '',
    result: null,
    loading: false,
    errorMessage: null
  },

  setFieldValue: function(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [field]: event.detail.value
    })
  },

  submitQuery: function() {
    const payload = {
      name: String(this.data.name || '').trim(),
      examNumber: String(this.data.examNumber || '').trim(),
      idNumber: String(this.data.idNumber || '').trim()
    }

    if (!payload.name || !payload.examNumber || !payload.idNumber) {
      pageUtils.showTopTips(this, i18n.t('graduateExamPage.fillAllFields'))
      return
    }

    pageUtils.runWithNavigationLoading(this, () => {
      return infoApi.queryGraduateExam(payload)
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
    this.setData({ result: null })
  },

  onShareAppMessage: function() {
    return {
      title: i18n.t('graduateExamPage.shareTitle'),
      path: '/pages/graduateExam/graduateExam'
    }
  }
})
