const utils = require('../../utils/util.js')
const libraryApi = require('../../services/apis/library.js')
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
        navTitle: i18n.t('bookPage.navTitle'),
        passwordLabel: i18n.t('bookPage.passwordLabel'),
        passwordPlaceholder: i18n.t('bookPage.passwordPlaceholder'),
        passwordRequired: i18n.t('bookPage.passwordRequired'),
        queryFailed: i18n.t('bookPage.queryFailed'),
        tip: i18n.t('bookPage.tip'),
        refreshBorrow: i18n.t('bookPage.refreshBorrow'),
        queryBorrow: i18n.t('bookPage.queryBorrow'),
        emptyHint: i18n.t('bookPage.emptyHint'),
        emptyResult: i18n.t('bookPage.emptyResult'),
        borrowListTitle: i18n.t('bookPage.borrowListTitle'),
        barcode: i18n.t('bookPage.barcode'),
        snNumber: i18n.t('bookPage.snNumber'),
        author: i18n.t('bookPage.author'),
        borrowDate: i18n.t('bookPage.borrowDate'),
        returnDate: i18n.t('bookPage.returnDate'),
        renewCount: i18n.t('bookPage.renewCount'),
        renewButton: i18n.t('bookPage.renewButton'),
        renewDialogTitle: i18n.t('bookPage.renewDialogTitle'),
        renewDialogMessage: i18n.t('bookPage.renewDialogMessage'),
        renewFailed: i18n.t('bookPage.renewFailed'),
        renewRefreshFailed: i18n.t('bookPage.renewRefreshFailed'),
        renewSuccessTitle: i18n.t('bookPage.renewSuccessTitle'),
        renewSuccessContent: i18n.t('bookPage.renewSuccessContent'),
        confirmRenew: i18n.t('bookPage.confirmRenew'),
        cancel: i18n.t('common.cancel'),
        shareTitle: i18n.t('bookPage.shareTitle')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },
  data: {
    themeClass: '',
    t: {},
    password: '',
    result: [],
    hasQueriedBorrow: false,
    errorMessage: null,
    loading: false,
    renewDialogVisible: false,
    renewPassword: '',
    renewErrorMessage: null,
    renewSubmitting: false,
    renewCode: '',
    renewSn: ''
  },

  onPasswordInput: function(event) {
    this.setData({
      password: event.detail.value,
      errorMessage: null
    })
  },

  submit: function(e) {
    const password = String((e.detail.value && e.detail.value.password) || this.data.password || '').trim()
    if (!password) {
      pageUtils.showTopTips(this, this.data.t.passwordRequired)
      return Promise.resolve()
    }

    this.setData({
      password: password,
      errorMessage: null
    })

    pageUtils.runWithNavigationLoading(this, () => {
      return libraryApi.queryBook(password)
    }).then((result) => {
      if (result.success) {
        this.setData({
          result: Array.isArray(result.data) ? result.data : [],
          hasQueriedBorrow: true,
          errorMessage: null
        })
      } else {
        throw new Error(result.message || this.data.t.queryFailed)
      }
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message || this.data.t.queryFailed)
      this.setData({
        errorMessage: error.message || this.data.t.queryFailed
      })
    })
  },

  openRenewDialog: function(event) {
    this.setData({
      renewDialogVisible: true,
      renewPassword: this.data.password || '',
      renewErrorMessage: null,
      renewCode: event.currentTarget.dataset.code || '',
      renewSn: event.currentTarget.dataset.sn || ''
    })
  },

  closeRenewDialog: function() {
    if (this.data.renewSubmitting) {
      return
    }

    this.setData({
      renewDialogVisible: false,
      renewPassword: '',
      renewErrorMessage: null,
      renewCode: '',
      renewSn: ''
    })
  },

  onRenewPasswordInput: function(event) {
    this.setData({
      renewPassword: event.detail.value,
      renewErrorMessage: null
    })
  },

  confirmRenew: function() {
    const code = this.data.renewCode
    const sn = this.data.renewSn
    const password = String(this.data.renewPassword || '').trim()

    if (!password) {
      this.setData({ renewErrorMessage: this.data.t.passwordRequired })
      return
    }

    pageUtils.runWithNavigationLoading(this, () => {
      return libraryApi.renewBook(code, sn, password)
    }, {
      loadingKey: 'renewSubmitting'
    }).then((result) => {
      if (result.success) {
        this.setData({
          password: password,
          renewErrorMessage: null
        })
        return libraryApi.queryBook(password)
      }
      throw new Error(result.message || this.data.t.renewFailed)
    }).then((result) => {
      if (!result || !result.success) {
        throw new Error((result && result.message) || this.data.t.renewRefreshFailed)
      }

      this.setData({
        result: Array.isArray(result.data) ? result.data : [],
        hasQueriedBorrow: true,
        renewDialogVisible: false,
        renewPassword: '',
        renewCode: '',
        renewSn: ''
      })
      utils.showNoActionModal(this.data.t.renewSuccessTitle, this.data.t.renewSuccessContent)
    }).catch((error) => {
      this.setData({
        renewErrorMessage: error.message || this.data.t.renewFailed
      })
    })
  },

  noop: function() {},

  onShareAppMessage: function() {
    return {
      title: this.data.t.shareTitle,
      path: '/pages/book/book'
    }
  }
})
