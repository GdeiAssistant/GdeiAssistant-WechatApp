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
        basicInfo: i18n.t('collectionDetailPage.basicInfo'),
        bookName: i18n.t('collectionDetailPage.bookName'),
        author: i18n.t('collectionDetailPage.author'),
        heading: i18n.t('collectionDetailPage.heading'),
        responsible: i18n.t('collectionDetailPage.responsible'),
        headingResponsible: i18n.t('collectionDetailPage.headingResponsible'),
        publisher: i18n.t('collectionDetailPage.publisher'),
        publishYear: i18n.t('collectionDetailPage.publishYear'),
        publisherYear: i18n.t('collectionDetailPage.publisherYear'),
        isbn: i18n.t('collectionDetailPage.isbn'),
        fixedPrice: i18n.t('collectionDetailPage.fixedPrice'),
        isbnPrice: i18n.t('collectionDetailPage.isbnPrice'),
        physicalDesc: i18n.t('collectionDetailPage.physicalDesc'),
        personalResp: i18n.t('collectionDetailPage.personalResp'),
        subjectTheme: i18n.t('collectionDetailPage.subjectTheme'),
        clcNumber: i18n.t('collectionDetailPage.clcNumber'),
        collectionInfo: i18n.t('collectionDetailPage.collectionInfo'),
        location: i18n.t('collectionDetailPage.location'),
        callNumber: i18n.t('collectionDetailPage.callNumber'),
        barcodeNumber: i18n.t('collectionDetailPage.barcodeNumber'),
        status: i18n.t('collectionDetailPage.status'),
        shareTitle: i18n.t('collectionDetailPage.shareTitle')
      }
    })
  },
  data: {
    themeClass: '',
    t: {},
    query: null,
    result: null,
    errorMessage: null
  },

  onLoad: function(options) {
    wx.setNavigationBarTitle({
      title: options.bookname
    })

    const query = options.detailURL ? {
      detailURL: options.detailURL
    } : {
      opacUrl: options.opacUrl,
      page: options.page,
      schoolId: options.schoolId,
      search: options.search,
      searchtype: options.searchtype,
      xc: options.xc
    }

    this.setData({ query })
    pageUtils.runWithNavigationLoading(this, () => {
      return libraryApi.queryCollectionDetail(query)
    }, { loadingKey: null }).then((result) => {
      if (!result.success) {
        pageUtils.showTopTips(this, result.message)
        return
      }

      const detail = result.data
      if (detail.principal && detail.principal.split(' ').length !== 1) {
        detail.autograph = detail.principal.split(' ')[0]
        detail.director = detail.principal.split(' ')[1]
      }
      if (detail.publishingHouse && detail.publishingHouse.split(' ').length !== 1) {
        detail.house = detail.publishingHouse.split(' ')[0]
        detail.year = detail.publishingHouse.split(' ')[1]
      }
      if (detail.price && detail.price.split(' ').length !== 1) {
        detail.ISBN = detail.price.split(' ')[0]
        detail.priceValue = detail.price.split(' ')[1]
      }
      this.setData({ result: detail })
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  onShareAppMessage: function() {
    return {
      title: this.data.t.shareTitle,
      path: '/pages/collection/collection'
    }
  }
})
