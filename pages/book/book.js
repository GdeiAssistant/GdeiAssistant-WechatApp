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
        navTitle: i18n.t('bookPage.navTitle')
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
      pageUtils.showTopTips(this, '请输入图书馆密码')
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
        throw new Error(result.message || '查询失败')
      }
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message || '查询失败')
      this.setData({
        errorMessage: error.message || '查询失败'
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
      this.setData({ renewErrorMessage: '请输入图书馆密码' })
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
      throw new Error(result.message || '续借失败')
    }).then((result) => {
      if (!result || !result.success) {
        throw new Error((result && result.message) || '借阅记录刷新失败')
      }

      this.setData({
        result: Array.isArray(result.data) ? result.data : [],
        hasQueriedBorrow: true,
        renewDialogVisible: false,
        renewPassword: '',
        renewCode: '',
        renewSn: ''
      })
      utils.showNoActionModal('续借成功', '已成功续借图书')
    }).catch((error) => {
      this.setData({
        renewErrorMessage: error.message || '续借失败'
      })
    })
  },

  noop: function() {},

  onShareAppMessage: function() {
    return {
      title: '图书馆',
      path: '/pages/book/book'
    }
  }
})
