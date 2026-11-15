const privacyUtil = require('../../utils/privacy.js')
const i18n = require('../../utils/i18n.js')

Component({
  data: {
    visible: false,
    contractName: '',
    t: {}
  },

  lifetimes: {
    attached: function () {
      this.refreshI18n()
      this._unsubscribePrivacy = privacyUtil.subscribe((state) => {
        this.setData({
          visible: !!state.visible,
          contractName: state.contractName || ''
        })
      })
    },
    detached: function () {
      if (typeof this._unsubscribePrivacy === 'function') {
        this._unsubscribePrivacy()
        this._unsubscribePrivacy = null
      }
    }
  },

  pageLifetimes: {
    show: function () {
      this.refreshI18n()
    }
  },

  methods: {
    refreshI18n: function () {
      this.setData({
        t: {
          title: i18n.t('privacyPopup.title'),
          desc: i18n.t('privacyPopup.desc'),
          contractFallback: i18n.t('privacyPopup.contractFallback'),
          disagree: i18n.t('privacyPopup.disagree'),
          agree: i18n.t('privacyPopup.agree')
        }
      })
    },

    openContract: function () {
      privacyUtil.openPrivacyContract()
    },

    handleDisagree: function () {
      privacyUtil.disagreePrivacy()
    },

    handleAgree: function () {
      privacyUtil.agreePrivacy('agree-btn')
    }
  }
})
