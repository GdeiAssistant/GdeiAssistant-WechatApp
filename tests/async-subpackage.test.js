const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const MOCK_ENTRY = path.join(ROOT, 'mock/index.js')
const LOCATION_ENTRY = path.join(ROOT, 'subpackages/location/location-regions.js')
const REQUEST_MODULE = path.join(ROOT, 'services/request.js')
const AUTH_MODULE = path.join(ROOT, 'services/auth.js')
const SOCIAL_API_MODULE = path.join(ROOT, 'services/apis/social.js')
const PROFILE_MODULE = path.join(ROOT, 'constants/profile.js')
const DATA_SOURCE_MODULE = path.join(ROOT, 'services/data-source.js')
const CONFIG_MODULE = path.join(ROOT, 'config/index.js')

function collectMainPackageJsFiles() {
  const dirs = ['components', 'config', 'constants', 'custom-tab-bar', 'pages', 'services', 'utils']
  const files = [path.join(ROOT, 'app.js')]

  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.name.endsWith('.js')) {
        files.push(full)
      }
    }
  }

  dirs.forEach(function (dir) {
    walk(path.join(ROOT, dir))
  })
  return files
}

function clearSubpackageCaches() {
  Object.keys(require.cache).forEach(function (cacheKey) {
    if (cacheKey.startsWith(path.join(ROOT, 'mock') + path.sep) || cacheKey === LOCATION_ENTRY) {
      delete require.cache[cacheKey]
    }
  })
}

test('app.json declares mock and location subpackages and main package has no static requires to them', function () {
  const appConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'))
  const roots = (appConfig.subpackages || []).map(function (pkg) {
    return pkg.root
  })
  assert.ok(roots.includes('mock'), 'mock should be configured as a subpackage')
  assert.ok(
    roots.includes('subpackages/location'),
    'subpackages/location should be configured as a subpackage'
  )
  assert.equal(fs.existsSync(path.join(ROOT, 'constants/location-regions.js')), false)
  assert.equal(fs.existsSync(LOCATION_ENTRY), true)

  const offenders = []
  collectMainPackageJsFiles().forEach(function (filePath) {
    const source = fs.readFileSync(filePath, 'utf8')
    const staticRequireMatches = source.match(/\brequire\s*\(\s*['"][^'"]+['"]\s*\)/g) || []
    staticRequireMatches.forEach(function (match) {
      if (match.includes('mock/index') || match.includes('location-regions')) {
        offenders.push(path.relative(ROOT, filePath) + ': ' + match)
      }
    })
  })
  assert.deepEqual(offenders, [])
})

test('remote production paths load zero mock or location-regions modules', async function () {
  clearSubpackageCaches()

  const storage = { sessionToken: 'prod-token' }
  global.wx = {
    getDeviceInfo: function () {
      return { deviceId: 'prod-device' }
    },
    getStorageSync: function (key) {
      return storage[key] || ''
    },
    setStorageSync: function (key, val) {
      storage[key] = val
    },
    removeStorageSync: function (key) {
      delete storage[key]
    },
    request: function (opts) {
      if (opts.url.includes('/api/auth/validate')) {
        opts.success({ statusCode: 200, data: { code: 200, success: true, data: null } })
        if (opts.complete) opts.complete({ statusCode: 200 })
        return
      }
      if (opts.success) {
        opts.success({ statusCode: 200, data: { code: 200, success: true, data: { ok: true } } })
      }
      if (opts.complete) {
        opts.complete({ statusCode: 200 })
      }
    },
    uploadFile: function (opts) {
      opts.success({ statusCode: 200, data: JSON.stringify({ success: true, data: { id: '1' } }) })
    }
  }
  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }

  stubModule(CONFIG_MODULE, {
    currentEnv: 'prod',
    allowRuntimeDebugOptions: false,
    requestTimeout: 5000,
    resourceDomain: 'https://example.com/'
  })
  clearModule(DATA_SOURCE_MODULE)
  clearModule(AUTH_MODULE)
  clearModule(REQUEST_MODULE)
  clearModule(SOCIAL_API_MODULE)
  clearModule(PROFILE_MODULE)

  const auth = require(AUTH_MODULE)
  const { request } = require(REQUEST_MODULE)
  const socialApi = require(SOCIAL_API_MODULE)
  require(PROFILE_MODULE)

  assert.equal(await auth.validateSessionToken(), true)
  const res = await request({ url: '/api/test', authRequired: true })
  assert.equal(res.success, true)
  const uploadRes = await socialApi.sendImageMessage('9001', 'cid-1', '/tmp/photo.png')
  assert.equal(uploadRes.success, true)
  await auth.logout()

  assert.equal(require.cache[MOCK_ENTRY], undefined)
  assert.equal(require.cache[LOCATION_ENTRY], undefined)
})

test('lostandfound.validateForm validates required and max length fields in one pass', function () {
  global.wx = {
    getStorageSync: function () {
      return ''
    },
    getSystemInfoSync: function () {
      return { language: 'zh-CN' }
    }
  }
  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }

  const formatModulePath = path.join(ROOT, 'services/community/format.js')
  const lostandfoundPath = path.join(ROOT, 'services/community/module-handlers/lostandfound.js')
  const realFormat = require(formatModulePath)
  let maxLengthCalls = 0
  stubModule(formatModulePath, {
    trimValue: realFormat.trimValue,
    findLabel: realFormat.findLabel,
    formatPrice: realFormat.formatPrice,
    getMaxLengthMessage: function (value, maxLength, message) {
      maxLengthCalls += 1
      return realFormat.getMaxLengthMessage(value, maxLength, message)
    }
  })
  clearModule(lostandfoundPath)
  const lostandfound = require(lostandfoundPath)

  assert.equal(lostandfound.validateForm({ form: {} }), '请输入物品名称')
  assert.equal(
    lostandfound.validateForm({ form: { name: 'x'.repeat(26) } }),
    '物品名称不能超过25个字符'
  )
  assert.equal(lostandfound.validateForm({ form: { name: '校园卡' } }), '请输入物品描述')
  assert.equal(
    lostandfound.validateForm({
      form: { name: '校园卡', description: 'd'.repeat(101) }
    }),
    '物品描述不能超过100个字符'
  )
  assert.equal(
    lostandfound.validateForm({ form: { name: '校园卡', description: '蓝色卡套' } }),
    '请输入地点'
  )
  assert.equal(
    lostandfound.validateForm({
      form: { name: '校园卡', description: '蓝色卡套', location: 'l'.repeat(31) }
    }),
    '地点不能超过30个字符'
  )
  assert.equal(
    lostandfound.validateForm({
      form: {
        name: '校园卡',
        description: '蓝色卡套',
        location: '图书馆',
        qq: '1'.repeat(21)
      }
    }),
    'QQ 不能超过20个字符'
  )
  assert.equal(
    lostandfound.validateForm({
      form: {
        name: '校园卡',
        description: '蓝色卡套',
        location: '图书馆',
        wechat: 'w'.repeat(21)
      }
    }),
    '微信不能超过20个字符'
  )
  assert.equal(
    lostandfound.validateForm({
      form: {
        name: '校园卡',
        description: '蓝色卡套',
        location: '图书馆',
        phone: '1'.repeat(12)
      }
    }),
    '电话不能超过11个字符'
  )
  assert.equal(
    lostandfound.validateForm({
      form: { name: '校园卡', description: '蓝色卡套', location: '图书馆' }
    }),
    '请至少填写一种联系方式'
  )
  assert.equal(
    lostandfound.validateForm({
      form: { name: '校园卡', description: '蓝色卡套', location: '图书馆', phone: '13800138000' },
      images: []
    }),
    '请至少上传一张图片'
  )

  maxLengthCalls = 0
  assert.equal(
    lostandfound.validateForm({
      form: { name: '校园卡', description: '蓝色卡套', location: '图书馆', phone: '13800138000' },
      isEditMode: true,
      images: []
    }),
    ''
  )
  assert.equal(maxLengthCalls, 6)

  clearModule(formatModulePath)
  clearModule(lostandfoundPath)
})
