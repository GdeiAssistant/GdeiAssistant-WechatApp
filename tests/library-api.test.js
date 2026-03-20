const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const REQUEST_MODULE = path.join(ROOT, 'services/request.js')
const LIBRARY_MODULE = path.join(ROOT, 'services/apis/library.js')

function loadLibraryApi(requestImpl) {
  clearModule(LIBRARY_MODULE)
  stubModule(REQUEST_MODULE, { request: requestImpl })
  return require(LIBRARY_MODULE)
}

test('library api uses canonical borrow and renew contracts', async function() {
  const calls = []
  const libraryApi = loadLibraryApi(function(options) {
    calls.push(options)
    return Promise.resolve({ success: true })
  })

  await libraryApi.queryBook('library123')
  await libraryApi.renewBook('CODE-1', 'SN-1', 'library123')

  assert.deepEqual(calls, [
    {
      url: '/api/library/borrow',
      method: 'GET',
      authRequired: true,
      data: { password: 'library123' }
    },
    {
      url: '/api/library/renew',
      method: 'POST',
      authRequired: true,
      data: {
        code: 'CODE-1',
        sn: 'SN-1',
        password: 'library123'
      }
    }
  ])
})

test('queryCollection normalizes nested collection payloads', async function() {
  const libraryApi = loadLibraryApi(function() {
    return Promise.resolve({
      success: true,
      message: 'ok',
      data: {
        collectionList: [{ id: 'book-1' }],
        sumPage: 3
      }
    })
  })

  const result = await libraryApi.queryCollection('java', 2)

  assert.deepEqual(result, {
    success: true,
    message: 'ok',
    collectionList: [{ id: 'book-1' }],
    sumPage: 3
  })
})

test('queryCollectionDetail builds detailURL from canonical payload fields', async function() {
  const calls = []
  const libraryApi = loadLibraryApi(function(options) {
    calls.push(options)
    return Promise.resolve({
      success: true,
      message: 'ok',
      data: { title: '高等数学' }
    })
  })

  const result = await libraryApi.queryCollectionDetail({
    opacUrl: 'https://example.test/opac',
    page: 2,
    schoolId: 3,
    search: 'math',
    searchtype: 'title',
    xc: 0
  })

  assert.equal(calls[0].url, '/api/library/detail')
  assert.equal(calls[0].method, 'GET')
  assert.deepEqual(calls[0].data, {
    detailURL: 'opacUrl=https://example.test/opac&page=2&schoolId=3&search=math&searchtype=title&xc=0'
  })
  assert.deepEqual(result, {
    success: true,
    message: 'ok',
    data: { title: '高等数学' }
  })
})
