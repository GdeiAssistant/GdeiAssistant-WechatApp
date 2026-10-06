const socialApi = require('../../services/apis/social.js')
const pageUtils = require('../../utils/page.js')
const socialUtils = require('../../utils/social.js')
const themeUtil = require('../../utils/theme')
const i18n = require('../../utils/i18n.js')

Page({
  data: {
    themeClass: '',
    t: {},
    dmPolicy: 'MUTUAL',
    options: [],
    errorMessage: null
  },

  refreshI18n: function () {
    this.setData({
      t: {
        navTitle: i18n.t('social.privacy.navTitle'),
        hint: i18n.t('social.privacy.hint'),
        selected: i18n.t('social.privacy.selected')
      },
      options: socialUtils.DM_POLICY_OPTIONS.map(function (value) {
        return {
          value: value,
          label: socialUtils.dmPolicyLabel(value),
          desc: i18n.t('social.privacy.desc.' + value.toLowerCase())
        }
      })
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },

  loadPrivacy: function () {
    return socialApi
      .getPrivacy()
      .then((result) => {
        if (!result.success) {
          throw new Error(result.message)
        }
        this.setData({
          dmPolicy: result.data.dmPolicy || 'MUTUAL'
        })
      })
      .catch((error) => {
        pageUtils.showTopTips(this, error.message)
      })
  },

  selectPolicy: function (event) {
    const value = event.currentTarget.dataset.value
    if (!value || value === this.data.dmPolicy) {
      return
    }
    socialApi
      .updatePrivacy(value)
      .then((result) => {
        if (!result.success) {
          throw new Error(result.message)
        }
        this.setData({ dmPolicy: result.data.dmPolicy })
        wx.showToast({ title: i18n.t('social.privacy.saved'), icon: 'success' })
      })
      .catch((error) => {
        pageUtils.showTopTips(this, error.message)
      })
  },

  onShow: function () {
    themeUtil.applyTheme(this)
    this.refreshI18n()
    this.loadPrivacy()
  }
})
