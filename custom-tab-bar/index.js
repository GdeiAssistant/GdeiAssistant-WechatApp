var i18n = require('../utils/i18n')
var themeUtil = require('../utils/theme')

Component({
  data: {
    themeClass: '',
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', icon: 'home', labelKey: 'home' },
      { pagePath: '/pages/conversationList/conversationList', icon: 'messages', labelKey: 'messages' },
      { pagePath: '/pages/profile/profile', icon: 'profile', labelKey: 'profile' }
    ],
    t: {
      home: '',
      messages: '',
      profile: ''
    }
  },

  lifetimes: {
    attached: function () {
      this.update()
    }
  },

  methods: {
    // Called by tab pages on show so labels, theme and selection stay fresh.
    update: function (options) {
      var patch = {
        themeClass: themeUtil.getEffectiveTheme() === 'dark' ? 'theme-dark' : '',
        t: {
          home: i18n.t('tabBar.home'),
          messages: i18n.t('tabBar.messages'),
          profile: i18n.t('tabBar.profile')
        }
      }
      if (options && typeof options.selected === 'number') {
        patch.selected = options.selected
      }
      this.setData(patch)
    },

    switchTab: function (event) {
      var index = event.currentTarget.dataset.index
      var item = this.data.list[index]
      if (!item || index === this.data.selected) {
        return
      }
      wx.switchTab({ url: item.pagePath })
    }
  }
})
