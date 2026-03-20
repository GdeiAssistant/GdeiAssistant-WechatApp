const infoApi = require('../../services/apis/info.js')
const pageUtils = require('../../utils/page.js')

Page({
  data: {
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
      pageUtils.showTopTips(this, '请完整填写考研查询信息')
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
      title: '考研查询',
      path: '/pages/graduateExam/graduateExam'
    }
  }
})
