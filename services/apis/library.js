const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function queryBook(password) {
  return request({
    url: endpoints.library.bookQuery,
    method: 'GET',
    authRequired: true,
    data: { password }
  })
}

function renewBook(code, sn, password) {
  return request({
    url: endpoints.library.bookRenew,
    method: 'POST',
    authRequired: true,
    data: { code, sn, password }
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

function queryCollection(keyword, page) {
  return request({
    url: endpoints.library.collectionQuery,
    method: 'GET',
    data: { keyword: keyword, page }
  }).then(normalizeCollectionResult)
}

function buildDetailURL(payload) {
  if (!payload) {
    return ''
  }

  if (payload.detailURL) {
    return payload.detailURL
  }

  const keys = ['opacUrl', 'page', 'schoolId', 'search', 'searchtype', 'xc']
  const query = keys
    .filter((key) => payload[key] !== undefined && payload[key] !== null && payload[key] !== '')
    .map((key) => `${key}=${payload[key]}`)
    .join('&')
  return query
}

function queryCollectionDetail(payload) {
  const detailURL = buildDetailURL(payload)
  return request({
    url: endpoints.library.collectionDetail,
    method: 'GET',
    data: { detailURL }
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
