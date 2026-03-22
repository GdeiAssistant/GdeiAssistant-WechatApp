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
        navTitle: i18n.t('collectionPage.navTitle'),
        myLoans: i18n.t('collectionPage.myLoans'),
        myLoansDesc: i18n.t('collectionPage.myLoansDesc'),
        bookNameLabel: i18n.t('collectionPage.bookNameLabel'),
        bookNamePlaceholder: i18n.t('collectionPage.bookNamePlaceholder'),
        bookNameValidation: i18n.t('collectionPage.bookNameValidation'),
        queryButton: i18n.t('collectionPage.queryButton'),
        noBooks: i18n.t('collectionPage.noBooks'),
        queryResult: i18n.t('collectionPage.queryResult'),
        loadMore: i18n.t('collectionPage.loadMore'),
        noMoreBooks: i18n.t('collectionPage.noMoreBooks'),
        loadingData: i18n.t('collectionPage.loadingData'),
        shareTitle: i18n.t('collectionPage.shareTitle')
      }
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  },
  data: {
    themeClass: '',
    t: {},
    list: [],
    keyword: null,
    currentPage: 0,
    sumPage: 0,
    hasMore: false,
    loading: false,
    errorMessage: null
  },

  formSubmit: function(e) {
    const keyword = e.detail.value.keyword
    if (!keyword) {
      pageUtils.showTopTips(this, i18n.t('collectionPage.bookNameValidation'))
      return
    }

    this.setData({
      loading: true,
      list: [],
      keyword,
      currentPage: 0,
      sumPage: 0
    })
    pageUtils.runWithNavigationLoading(this, () => {
      return libraryApi.queryCollection(keyword, 1)
    }).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message)
        return
      }

      if (!result.collectionList || result.collectionList.length === 0) {
        pageUtils.showTopTips(this, i18n.t('collectionPage.noBooks'))
        return
      }

      this.setData({
        list: result.collectionList,
        currentPage: 1,
        sumPage: result.sumPage,
        hasMore: 1 < result.sumPage
      })
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  loadMore: function() {
    if (!this.data.keyword || this.data.currentPage >= this.data.sumPage) {
      pageUtils.showTopTips(this, i18n.t('collectionPage.noMoreBooks'))
      return
    }

    wx.showLoading({ title: i18n.t('collectionPage.loadingData'), mask: true })
    const nextPage = this.data.currentPage + 1

    libraryApi.queryCollection(this.data.keyword, nextPage).then((result) => {
      wx.hideLoading()
      if (!result.success) {
        pageUtils.showTopTips(this, result.message)
        return
      }

      if (!result.collectionList || result.collectionList.length === 0) {
        pageUtils.showTopTips(this, i18n.t('collectionPage.noMoreBooks'))
        return
      }

      this.setData({
        list: this.data.list.concat(result.collectionList),
        currentPage: nextPage,
        hasMore: nextPage < this.data.sumPage
      })
    }).catch((error) => {
      wx.hideLoading()
      pageUtils.showTopTips(this, error.message)
    })
  },

  onShareAppMessage: function() {
    return {
      title: i18n.t('collectionPage.shareTitle'),
      path: '/pages/collection/collection'
    }
  }
})
