const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const CONFIG_MODULE = path.join(ROOT, 'config/index.js')
const DATA_SOURCE_MODULE = path.join(ROOT, 'services/data-source.js')
const STORAGE_MODULE = path.join(ROOT, 'constants/storage.js')

function loadDataSource(envVersion, initialStorage) {
  const storage = Object.assign({}, initialStorage)
  const storageKeys = require(STORAGE_MODULE)

  delete process.env.NODE_ENV
  global.wx = {
    getAccountInfoSync() {
      return { miniProgram: { envVersion } }
    },
    getStorageSync(key) {
      return storage[key]
    },
    setStorageSync(key, value) {
      storage[key] = value
    },
    removeStorageSync(key) {
      delete storage[key]
    }
  }

  clearModule(CONFIG_MODULE)
  clearModule(DATA_SOURCE_MODULE)
  return {
    dataSource: require(DATA_SOURCE_MODULE),
    storage,
    storageKeys
  }
}

test('release runtime forces remote data source even when mock was stored', function () {
  const { dataSource, storage, storageKeys } = loadDataSource('release', {
    dataSourceMode: 'mock'
  })

  assert.equal(dataSource.canUseDemoMode(), false)
  assert.equal(dataSource.getDataSourceMode(), dataSource.DATA_SOURCE_MODES.remote)
  assert.equal(dataSource.isMockMode(), false)
  assert.equal(
    dataSource.setDataSourceMode(dataSource.DATA_SOURCE_MODES.mock),
    dataSource.DATA_SOURCE_MODES.remote
  )
  assert.equal(storage[storageKeys.dataSourceMode], undefined)
})

test('develop runtime can opt into mock data source', function () {
  const { dataSource, storage, storageKeys } = loadDataSource('develop')

  assert.equal(dataSource.canUseDemoMode(), true)
  assert.equal(
    dataSource.setDataSourceMode(dataSource.DATA_SOURCE_MODES.mock),
    dataSource.DATA_SOURCE_MODES.mock
  )
  assert.equal(storage[storageKeys.dataSourceMode], dataSource.DATA_SOURCE_MODES.mock)
  assert.equal(dataSource.isMockMode(), true)
})
