const socialApi = require('../../services/apis/social.js')
const socialAvatar = require('../../services/social-avatar.js')
const pageUtils = require('../../utils/page.js')
const socialUtils = require('../../utils/social.js')
const themeUtil = require('../../utils/theme')
const i18n = require('../../utils/i18n.js')

Page({
  data: {
    themeClass: '',
    t: {},
    users: [],
    nextCursor: null,
    hasMore: false,
    loading: false,
    errorMessage: null
  },

  refreshI18n: function () {
    this.setData({
      t: {
        navTitle: i18n.t('social.blocks.navTitle'),
        empty: i18n.t('social.blocks.empty'),
        unblock: i18n.t('social.actions.unblock')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },

  loadList: function (reset) {
    if (this.data.loading) {
      return Promise.resolve()
    }
    this.setData({ loading: true })
    return socialApi
      .getBlocks({
        cursor: reset ? null : this.data.nextCursor,
        limit: 20
      })
      .then((result) => {
        if (!result.success) {
          throw new Error(result.message)
        }
        const page = socialUtils.normalizePage(result.data)
        return socialAvatar.attachDisplayAvatars(page.items).then((users) => {
          this.setData({
            users: reset ? users : this.data.users.concat(users),
            nextCursor: page.nextCursor,
            hasMore: page.hasMore,
            loading: false
          })
        })
      })
      .catch((error) => {
        this.setData({ loading: false })
        pageUtils.showTopTips(this, error.message)
      })
  },

  openProfile: function (event) {
    socialUtils.openUserProfile(event.currentTarget.dataset.id)
  },

  unblock: function (event) {
    const userId = event.currentTarget.dataset.id
    socialApi
      .unblockUser(userId)
      .then((result) => {
        if (!result.success) {
          throw new Error(result.message)
        }
        return this.loadList(true)
      })
      .catch((error) => {
        pageUtils.showTopTips(this, error.message)
      })
  },

  onShow: function () {
    themeUtil.applyTheme(this)
    this.refreshI18n()
    this.loadList(true)
  },

  onPullDownRefresh: function () {
    this.loadList(true).finally(function () {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadList(false)
    }
  }
})
