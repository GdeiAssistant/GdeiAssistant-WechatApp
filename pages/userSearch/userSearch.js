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
    query: '',
    users: [],
    nextCursor: null,
    hasMore: false,
    loading: false,
    searched: false,
    errorMessage: null
  },

  refreshI18n: function () {
    this.setData({
      t: {
        navTitle: i18n.t('social.search.navTitle'),
        searchPlaceholder: i18n.t('social.search.placeholder'),
        noIntro: i18n.t('social.common.noIntro'),
        empty: i18n.t('social.search.empty'),
        loading: i18n.t('common.loading'),
        loadMore: i18n.t('common.more')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },

  onQueryInput: function (event) {
    this.setData({ query: event.detail.value })
  },

  onSearch: function () {
    this.loadUsers(true)
  },

  loadUsers: function (reset) {
    if (this.data.loading) {
      return Promise.resolve()
    }
    const query = String(this.data.query || '').trim()
    this.setData({ loading: true, searched: true })
    return socialApi
      .searchUsers({
        query: query,
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

  loadMore: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadUsers(false)
    }
  },

  openProfile: function (event) {
    socialUtils.openUserProfile(event.currentTarget.dataset.id)
  },

  onShow: function () {
    themeUtil.applyTheme(this)
    this.refreshI18n()
  },

  onLoad: function () {
    this.loadUsers(true)
  },

  onReachBottom: function () {
    this.loadMore()
  }
})
