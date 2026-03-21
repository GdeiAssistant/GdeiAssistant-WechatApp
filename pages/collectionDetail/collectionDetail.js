const libraryApi = require('../../services/apis/library.js')
const pageUtils = require('../../utils/page.js')
var themeUtil = require('../../utils/theme')

Page({
  onShow: function () {
    themeUtil.applyTheme(this)
  },
  data: {
    themeClass: '',
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
      title: '馆藏详情',
      path: '/pages/collection/collection'
    }
  }
})
