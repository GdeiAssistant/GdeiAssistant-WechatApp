const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function queryBook(password) {
  return request({
    url: endpoints.library.bookQuery,
    authRequired: true,
    data: { password }
  })
}

function renewBook(id, sn, password) {
  return request({
    url: endpoints.library.bookRenew,
    authRequired: true,
    data: { id, sn, password }
  })
}

function normalizeCollectionResult(result) {
  const list = result.collectionList || (result.data && result.data.collectionList) || []
  const sumPage = result.sumPage || (result.data && result.data.sumPage) || 0

  return {
    success: !!result.success,
    message: result.message,
    collectionList: list,
    sumPage
  }
}

function queryCollection(bookname, page) {
  return request({
    url: endpoints.library.collectionQuery,
    data: { bookname, page }
  }).then(normalizeCollectionResult)
}

function queryCollectionDetail(payload) {
  return request({
    url: endpoints.library.collectionDetail,
    data: payload
  }).then((result) => {
    return {
      success: !!result.success,
      message: result.message,
      data: result.data || result.detail || null
    }
  })
}

module.exports = {
  queryBook,
  renewBook,
  queryCollection,
  queryCollectionDetail
}
