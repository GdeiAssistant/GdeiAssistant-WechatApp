const utils = require('../../utils/util.js')
const libraryApi = require('../../services/apis/library.js')
const pageUtils = require('../../utils/page.js')

Page({
  data: {
    password: null,
    result: null,
    errorMessage: null,
    loading: false
  },

  submit: function(e) {
    const password = e.detail.value.password
    this.setData({ password })

    pageUtils.runWithNavigationLoading(this, () => {
      return libraryApi.queryBook(password)
    }).then((result) => {
      if (result.success) {
        this.setData({ result: result.data })
      } else {
        utils.showModal('查询失败', result.message)
      }
    }).catch((error) => {
      utils.showModal('查询失败', error.message)
    })
  },

  renewBook: function(event) {
    const index = event.currentTarget.dataset.index
    const code = event.currentTarget.dataset.code
    const sn = event.currentTarget.dataset.sn
    const password = this.data.password

    pageUtils.runWithNavigationLoading(this, () => {
      return libraryApi.renewBook(code, sn, password)
    }).then((result) => {
      if (result.success) {
        utils.showNoActionModal('续借成功', '已成功续借图书')
        const list = this.data.result
        list[index].renewTime++
        this.setData({ result: list })
      } else {
        utils.showNoActionModal('续借失败', result.message)
      }
    }).catch((error) => {
      utils.showNoActionModal('续借失败', error.message)
    })
  },

  onShareAppMessage: function() {
    return {
      title: '借阅查询',
      path: '/pages/book/book'
    }
  }
})
