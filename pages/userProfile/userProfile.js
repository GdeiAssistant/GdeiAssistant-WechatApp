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
    user: null,
    relationshipText: '',
    permissionHint: '',
    isFollowing: false,
    loading: true,
    acting: false,
    errorMessage: null
  },

  refreshI18n: function () {
    this.setData({
      t: {
        navTitle: i18n.t('social.profile.navTitle'),
        loading: i18n.t('common.loading'),
        noIntro: i18n.t('social.common.noIntro'),
        following: i18n.t('social.stats.following'),
        followers: i18n.t('social.stats.followers'),
        friends: i18n.t('social.stats.friends'),
        follow: i18n.t('social.actions.follow'),
        unfollow: i18n.t('social.actions.unfollow'),
        message: i18n.t('social.actions.message'),
        block: i18n.t('social.actions.block'),
        unblock: i18n.t('social.actions.unblock'),
        notFound: i18n.t('social.errors.userNotFound')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },

  applyUser: function (user) {
    return socialAvatar.attachDisplayAvatar(user).then((resolved) => {
      this.setData({
        user: resolved,
        relationshipText: socialUtils.relationshipLabel(resolved && resolved.relationship),
        permissionHint: socialUtils.permissionMessage(resolved && resolved.messagePermissionReason),
        isFollowing: !!(
          resolved &&
          (resolved.relationship === 'FOLLOWING' || resolved.relationship === 'MUTUAL')
        ),
        loading: false
      })
    })
  },

  loadUser: function () {
    return pageUtils
      .runWithNavigationLoading(this, () => socialApi.getUser(this.data.userId))
      .then((result) => {
        if (!result.success) {
          throw new Error(result.message)
        }
        return this.applyUser(result.data)
      })
      .catch((error) => {
        this.setData({ loading: false, user: null })
        pageUtils.showTopTips(this, error.message)
      })
  },

  toggleFollow: function () {
    if (this.data.acting || !this.data.user) {
      return
    }
    this.setData({ acting: true })
    const action = this.data.isFollowing
      ? socialApi.unfollowUser(this.data.userId)
      : socialApi.followUser(this.data.userId)
    action
      .then((result) => {
        if (!result.success) {
          throw new Error(result.message)
        }
        return this.applyUser(result.data)
      })
      .catch((error) => {
        pageUtils.showTopTips(this, error.message || socialUtils.permissionMessage(error.errorCode))
      })
      .finally(() => {
        this.setData({ acting: false })
      })
  },

  toggleBlock: function () {
    if (this.data.acting || !this.data.user) {
      return
    }
    const blocked = !!this.data.user.blockedByMe
    const self = this
    wx.showModal({
      title: blocked ? i18n.t('social.actions.unblock') : i18n.t('social.actions.block'),
      content: blocked
        ? i18n.t('social.actions.unblockConfirm')
        : i18n.t('social.actions.blockConfirm'),
      success: function (res) {
        if (!res.confirm) {
          return
        }
        self.setData({ acting: true })
        const action = blocked
          ? socialApi.unblockUser(self.data.userId)
          : socialApi.blockUser(self.data.userId)
        action
          .then((result) => {
            if (!result.success) {
              throw new Error(result.message)
            }
            return self.loadUser()
          })
          .catch((error) => {
            pageUtils.showTopTips(self, error.message)
          })
          .finally(() => {
            self.setData({ acting: false })
          })
      }
    })
  },

  openMessage: function () {
    if (!this.data.user || !this.data.user.canMessage) {
      pageUtils.showTopTips(this, this.data.permissionHint)
      return
    }
    socialApi
      .createConversation(this.data.userId)
      .then((result) => {
        if (!result.success) {
          throw new Error(result.message)
        }
        socialUtils.openChat(result.data.id, this.data.userId)
      })
      .catch((error) => {
        pageUtils.showTopTips(this, error.message || socialUtils.permissionMessage(error.errorCode))
      })
  },

  openRelationships: function (event) {
    const kind = event.currentTarget.dataset.kind
    wx.navigateTo({
      url:
        '/pages/relationshipList/relationshipList?id=' +
        encodeURIComponent(this.data.userId) +
        '&kind=' +
        encodeURIComponent(kind)
    })
  },

  onLoad: function (options) {
    this.setData({ userId: String((options && options.id) || '') })
    this.loadUser()
  },

  onShow: function () {
    themeUtil.applyTheme(this)
    this.refreshI18n()
  },

  onPullDownRefresh: function () {
    this.loadUser().finally(function () {
      wx.stopPullDownRefresh()
    })
  }
})
