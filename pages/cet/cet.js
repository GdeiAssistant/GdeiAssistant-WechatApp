const cetApi = require('../../services/apis/cet.js')
const dataSource = require('../../services/data-source.js')
const pageUtils = require('../../utils/page.js')

Page({
  data: {
    ticketNumber: '',
    name: '',
    checkcode: '',
    checkcodeImage: '',
    mockCaptchaHint: '',
    result: null,
    loading: false,
    errorMessage: null
  },

  setFieldValue: function(event) {
    const field = event.currentTarget.dataset.field
    this.setData({ [field]: event.detail.value })
  },

  loadSavedNumber: function() {
    cetApi.getCetNumber().then((result) => {
      if (result.success && result.data) {
        this.setData({
          ticketNumber: result.data.number || '',
          name: result.data.name || ''
        })
      }
    }).catch(() => {})
  },

  loadCheckcodeImage: function() {
    cetApi.getCetCheckcode().then((result) => {
      const checkcodeImage = result.success && result.data ? `data:image/jpg;base64,${result.data}` : ''
      this.setData({
        checkcodeImage: checkcodeImage,
        mockCaptchaHint: checkcodeImage ? '' : (dataSource.isMockMode() ? 'GD26' : '')
      })
    }).catch(() => {
      this.setData({
        checkcodeImage: '',
        mockCaptchaHint: dataSource.isMockMode() ? 'GD26' : ''
      })
    })
  },

  saveTicketNumber: function() {
    const ticketNumber = String(this.data.ticketNumber || '').trim()
    if (!/^\d{15}$/.test(ticketNumber)) {
      pageUtils.showTopTips(this, '准考证号必须为 15 位数字')
      return
    }

    pageUtils.runWithNavigationLoading(this, () => {
      return cetApi.saveCetNumber({
        number: ticketNumber,
        name: String(this.data.name || '').trim()
      })
    }).then((result) => {
      if (result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
      } else {
        pageUtils.showTopTips(this, result.message)
      }
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  submitQuery: function() {
    const ticketNumber = String(this.data.ticketNumber || '').trim()
    const name = String(this.data.name || '').trim()
    const checkcode = String(this.data.checkcode || '').trim()

    if (!/^\d{15}$/.test(ticketNumber)) {
      pageUtils.showTopTips(this, '请填写 15 位准考证号')
      return
    }

    if (!name) {
      pageUtils.showTopTips(this, '请填写姓名')
      return
    }

    if (!checkcode) {
      pageUtils.showTopTips(this, '请输入验证码')
      return
    }

    pageUtils.runWithNavigationLoading(this, () => {
      return cetApi.queryCetScore(ticketNumber, name, checkcode)
    }).then((result) => {
      if (result.success) {
        this.setData({
          result: result.data
        })
        this.loadCheckcodeImage()
      } else {
        pageUtils.showTopTips(this, result.message)
      }
    }).catch((error) => {
      this.loadCheckcodeImage()
      pageUtils.showTopTips(this, error.message)
    })
  },

  resetQuery: function() {
    this.setData({
      checkcode: '',
      result: null
    })
    this.loadCheckcodeImage()
  },

  onLoad: function() {
    this.loadSavedNumber()
    this.loadCheckcodeImage()
  },

  onShareAppMessage: function() {
    return {
      title: '四六级查询',
      path: '/pages/cet/cet'
    }
  }
})
