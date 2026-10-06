const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const test = require('node:test')
const assert = require('node:assert/strict')

const ROOT = path.resolve(__dirname, '..')
const LOCALES = ['zh-CN', 'zh-HK', 'zh-TW', 'en', 'ja', 'ko']

// WeChat registers JavaScript modules; Node's built-in JSON loader is unavailable.
function createRuntime() {
  const storage = {}
  const app = { globalData: { locale: 'zh-CN' } }
  const cache = new Map()
  const context = vm.createContext({
    getApp: function () {
      return app
    },
    wx: {
      getStorageSync: function (key) {
        return storage[key]
      },
      setStorageSync: function (key, value) {
        storage[key] = value
      },
      getSystemInfoSync: function () {
        return { language: 'zh-CN' }
      }
    }
  })

  function loadModule(filename) {
    assert.equal(path.extname(filename), '.js', 'runtime cannot require JSON: ' + filename)
    if (cache.has(filename)) return cache.get(filename).exports
    const module = { exports: {} }
    cache.set(filename, module)
    const wrapper = vm.runInContext(
      '(function (require, module, exports) {\n' + fs.readFileSync(filename, 'utf8') + '\n})',
      context,
      { filename: filename }
    )
    wrapper(
      function (specifier) {
        const resolved = path.resolve(path.dirname(filename), specifier)
        return loadModule(path.extname(resolved) ? resolved : resolved + '.js')
      },
      module,
      module.exports
    )
    return module.exports
  }

  return { i18n: loadModule(path.join(ROOT, 'utils/i18n.js')), app: app, storage: storage }
}

function leaves(catalog, prefix) {
  const result = []
  Object.keys(catalog).forEach(function (key) {
    const next = prefix ? prefix + '.' + key : key
    if (catalog[key] && typeof catalog[key] === 'object' && !Array.isArray(catalog[key])) {
      result.push(...leaves(catalog[key], next))
    } else {
      result.push([next, catalog[key]])
    }
  })
  return result
}

test('six languages translate from JavaScript modules without a JSON loader', function () {
  const runtime = createRuntime()
  LOCALES.forEach(function (locale) {
    runtime.i18n.setLocale(locale)
    assert.equal(runtime.app.globalData.locale, locale)
    assert.equal(runtime.storage.locale, locale)
    const catalog = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'locales', locale + '.json'), 'utf8')
    )
    leaves(catalog, '').forEach(function ([key, expected]) {
      assert.deepEqual(
        JSON.parse(JSON.stringify(runtime.i18n.t(key))),
        expected,
        locale + ':' + key
      )
    })
  })
})

test('JavaScript-only runtime preserves fallback and interpolation after locale switching', function () {
  const runtime = createRuntime()
  runtime.i18n.setLocale('zh-Hant-HK')
  assert.equal(runtime.i18n.t('social.privacy.desc.following'), '得你關注嘅人先可以私訊你')
  runtime.i18n.setLocale('ja')
  assert.equal(
    runtime.i18n.tReplace('schedule.currentWeek', { week: 5 }),
    runtime.i18n.t('schedule.currentWeek').replace('{{week}}', '5')
  )
  runtime.i18n.setLocale('unsupported')
  assert.equal(runtime.i18n.t('login.button'), '登录')
  assert.equal(runtime.i18n.t('missing.runtime.key'), 'missing.runtime.key')
})
