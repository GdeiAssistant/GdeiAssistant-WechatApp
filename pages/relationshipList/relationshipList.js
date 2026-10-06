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
    userId: '',
    kind: 'following',
    users: [],
    nextCursor: null,
    hasMore: false,
    loading: false,
    errorMessage: null
  },

  refreshI18n: function () {
    const kind = this.data.kind
    const titleKey =
      kind === 'followers'
        ? 'social.stats.followers'
        : kind === 'friends'
          ? 'social.stats.friends'
          : 'social.stats.following'
    this.setData({
      t: {
        navTitle: i18n.t(titleKey),
        empty: i18n.t('social.common.emptyList'),
        loading: i18n.t('common.loading')
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
      .getRelationships(this.data.userId, {
        kind: this.data.kind,
        cursor: reset ? null : this.data.nextCursor,
        limit: 20
      })
      .then((result) => {
        if (!result.success) {
          throw new Error(result.message)
        }
        const page = socialUtils.normalizePage(result.data)
        return socialAvatar.attachDisplayAvatars(page.items).then((resolved) => {
          const users = resolved.map(function (item) {
            return Object.assign({}, item, {
              // Subtitle shows the user's own introduction (signature);
              // fall back to the mutual-follow badge only when there is no bio.
              subtitle: item.introduction
                || (item.relationship === 'MUTUAL' ? socialUtils.relationshipLabel('MUTUAL') : '')
            })
          })
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

  onLoad: function (options) {
    this.setData({
      userId: String((options && options.id) || ''),
      kind: String((options && options.kind) || 'following')
    })
    this.loadList(true)
  },

  onShow: function () {
    themeUtil.applyTheme(this)
    this.refreshI18n()
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
