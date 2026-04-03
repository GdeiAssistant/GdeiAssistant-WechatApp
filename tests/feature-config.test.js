const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { freshRequire } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const FEATURE_CONFIG_MODULE = path.join(ROOT, 'services/feature-config.js')
const STORAGE_KEYS = require(path.join(ROOT, 'constants/storage.js'))

function loadFeatureConfig(initialStorage = {}) {
  const storage = { ...initialStorage }

  global.wx = {
    getStorageSync: function (key) {
      return storage[key]
    },
    setStorageSync: function (key, value) {
      storage[key] = value
    }
  }

  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }

  return {
    storage,
    featureConfig: freshRequire(FEATURE_CONFIG_MODULE)
  }
}

test('getFeatureVisibility falls back to defaults when storage value is invalid', function () {
  const { featureConfig } = loadFeatureConfig({
    [STORAGE_KEYS.featureVisibility]: 'not-an-object'
  })

  const visibility = featureConfig.getFeatureVisibility()

  assert.equal(visibility.grade, true)
  assert.equal(visibility.news, true)
  assert.equal(visibility.photograph, true)
})

test('saveFeatureVisibility only persists declared feature flags', function () {
  const { storage, featureConfig } = loadFeatureConfig()

  const result = featureConfig.saveFeatureVisibility({
    grade: false,
    news: true,
    unknownFeature: false
  })

  assert.equal(result.grade, false)
  assert.equal(result.news, true)
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'unknownFeature'), false)
  assert.deepEqual(storage[STORAGE_KEYS.featureVisibility], result)
})

test('getHomeSections hides disabled features and drops empty sections', function () {
  const { featureConfig } = loadFeatureConfig({
    [STORAGE_KEYS.featureVisibility]: {
      grade: false,
      schedule: false,
      cet: false,
      graduateExam: false,
      spare: false,
      bill: false,
      card: false,
      cardLost: false,
      evaluate: false,
      collection: false,
      book: false,
      data: false,
      news: false,
      marketplace: true,
      lostandfound: true,
      secret: false,
      express: false,
      topic: false,
      delivery: false,
      dating: false,
      photograph: false
    }
  })

  const sections = featureConfig.getHomeSections()

  assert.equal(sections.length, 1)
  assert.equal(sections[0].id, 'community')
  assert.deepEqual(
    sections[0].features.map(function (feature) {
      return feature.id
    }),
    ['marketplace', 'lostandfound']
  )
})

test('setFeatureVisible ignores unknown feature ids', function () {
  const { featureConfig } = loadFeatureConfig()

  const before = featureConfig.getFeatureVisibility()
  const after = featureConfig.setFeatureVisible('unknown-feature', false)

  assert.deepEqual(after, before)
})
