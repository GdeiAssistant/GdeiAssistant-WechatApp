const storageKeys = require('../../constants/storage.js')
const infoApi = require('../../services/apis/info.js')
const messagesApi = require('../../services/apis/messages.js')
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
        loadingDetail: i18n.t('newsDetailPage.loadingDetail'),
        loadFailed: i18n.t('newsDetailPage.loadFailed'),
        noContent: i18n.t('newsDetailPage.noContent'),
        announcement: i18n.t('newsDetailPage.announcement'),
        news: i18n.t('newsDetailPage.news')
      }
    })
    // Re-set navigation bar title based on mode
    if (this.data.mode === 'announcement') {
      wx.setNavigationBarTitle({ title: this.data.t.announcement })
    } else {
      wx.setNavigationBarTitle({ title: this.data.t.news })
    }
  },
  data: {
    themeClass: '',
    t: {},
    newsItem: null,
    loading: false,
    errorMessage: null,
    mode: 'news'
  },

  loadDetail: function(id, mode) {
    if (!id) {
      return Promise.resolve()
    }

    const requestTask = mode === 'announcement'
      ? function() { return messagesApi.getAnnouncementDetail(id) }
      : function() { return infoApi.getNewsDetail(id) }

    return pageUtils.runWithNavigationLoading(this, requestTask, {
      loadingKey: 'loading'
    }).then((result) => {
      if (!result.success) {
        throw new Error(result.message || this.data.t.loadFailed)
      }

      const payload = result.data || {}
      const currentItem = this.data.newsItem || {}
      this.setData({
        newsItem: Object.assign({}, currentItem, payload, {
          publishDate: payload.publishDate || payload.publishTime || currentItem.publishDate || '',
          navigationTitle: mode === 'announcement' ? this.data.t.announcement : this.data.t.news
        }),
        errorMessage: null
      })
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message || this.data.t.loadFailed)
      this.setData({
        errorMessage: error.message || this.data.t.loadFailed
      })
    })
  },

  onLoad: function(options) {
    const newsItem = wx.getStorageSync(storageKeys.newsDetailItem)
    const mode = options && options.mode === 'announcement' ? 'announcement' : 'news'
    const detailId = options && options.id ? decodeURIComponent(options.id) : ''
    this.setData({
      newsItem: newsItem || null,
      mode: mode
    })

    wx.setNavigationBarTitle({
      title: mode === 'announcement' ? this.data.t.announcement : this.data.t.news
    })

    this.loadDetail(detailId || (newsItem && newsItem.id) || '', mode)
  },

  onShareAppMessage: function() {
    const navigationTitle = this.data.newsItem && this.data.newsItem.navigationTitle
    return {
      title: this.data.newsItem && this.data.newsItem.title ? this.data.newsItem.title : this.data.t.news,
      path: navigationTitle === this.data.t.announcement ? '/pages/inbox/inbox' : '/pages/news/news'
    }
  }
})
