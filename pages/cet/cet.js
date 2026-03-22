const cetApi = require('../../services/apis/cet.js')
const dataSource = require('../../services/data-source.js')
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
        navTitle: i18n.t('cetPage.navTitle'),
        queryInfo: i18n.t('cetPage.queryInfo'),
        ticketNumber: i18n.t('cetPage.ticketNumber'),
        ticketPlaceholder: i18n.t('cetPage.ticketPlaceholder'),
        name: i18n.t('cetPage.name'),
        namePlaceholder: i18n.t('cetPage.namePlaceholder'),
        captcha: i18n.t('cetPage.captcha'),
        captchaPlaceholder: i18n.t('cetPage.captchaPlaceholder'),
        refresh: i18n.t('cetPage.refresh'),
        query: i18n.t('cetPage.query'),
        saveTicket: i18n.t('cetPage.saveTicket'),
        loadSavedTicket: i18n.t('cetPage.loadSavedTicket'),
        examType: i18n.t('cetPage.examType'),
        school: i18n.t('cetPage.school'),
        admissionCard: i18n.t('cetPage.admissionCard'),
        scoreInfo: i18n.t('cetPage.scoreInfo'),
        totalScore: i18n.t('cetPage.totalScore'),
        listening: i18n.t('cetPage.listening'),
        reading: i18n.t('cetPage.reading'),
        writingTranslation: i18n.t('cetPage.writingTranslation'),
        queryAgain: i18n.t('cetPage.queryAgain')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },
  data: {
    themeClass: '',
    t: {},
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
      pageUtils.showTopTips(this, i18n.t('cetPage.ticketValidation'))
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
          title: i18n.t('cetPage.saveSuccess'),
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
      pageUtils.showTopTips(this, i18n.t('cetPage.ticketFormatError'))
      return
    }

    if (!name) {
      pageUtils.showTopTips(this, i18n.t('cetPage.nameRequired'))
      return
    }

    if (!checkcode) {
      pageUtils.showTopTips(this, i18n.t('cetPage.captchaRequired'))
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
      title: i18n.t('cetPage.shareTitle'),
      path: '/pages/cet/cet'
    }
  }
})
