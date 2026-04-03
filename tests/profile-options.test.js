const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const USER_API_MODULE = path.join(ROOT, 'services/apis/user.js')
const PROFILE_MODULE = path.join(ROOT, 'constants/profile.js')
const COMMUNITY_MODULE = path.join(ROOT, 'constants/community.js')

function loadProfileModules(getProfileOptions) {
  global.wx = {
    getStorageSync: function () {
      return ''
    },
    setStorageSync: function () {},
    getSystemInfoSync: function () {
      return { language: 'zh-CN' }
    }
  }
  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }
  clearModule(COMMUNITY_MODULE)
  clearModule(PROFILE_MODULE)
  stubModule(USER_API_MODULE, { getProfileOptions })

  return {
    profile: require(PROFILE_MODULE),
    community: require(COMMUNITY_MODULE)
  }
}

test('remote profile options drive faculty and community dictionaries together', async function () {
  const { profile, community } = loadProfileModules(function () {
    return Promise.resolve({
      success: true,
      data: {
        faculties: [
          { code: 0, label: '未选择', majors: ['未选择'] },
          { code: 3, label: '中文系', majors: ['未选择', '汉语言文学'] }
        ],
        marketplaceItemTypes: [
          { code: 0, label: '校园代步' },
          { code: 1, label: '桌面风扇' }
        ],
        lostFoundItemTypes: [
          { code: 0, label: '手机' },
          { code: 9, label: '运动健身' }
        ],
        lostFoundModes: [
          { code: 0, label: '寻物启事' },
          { code: 1, label: '失物招领' }
        ]
      }
    })
  })

  const options = await profile.fetchProfileOptions(true)

  // Remote '未选择' should be normalized to the internal NOT_SELECTED sentinel
  var NS = '__not_selected__'
  assert.deepEqual(options.faculties, [
    {
      code: 0,
      label: NS,
      majors: [{ code: 'unselected', label: NS }]
    },
    {
      code: 3,
      label: '中文系',
      majors: [
        { code: 'unselected', label: NS },
        { code: 'chinese_language_literature', label: '汉语言文学' }
      ]
    }
  ])
  assert.deepEqual(profile.getFacultyOptions(), [NS, '中文系'])
  assert.equal(profile.getFacultyCodeByLabel(' 中文系 '), 3)
  assert.deepEqual(profile.getMajorOptions('中文系'), [NS, '汉语言文学'])
  assert.equal(profile.getMajorCodeByLabel('中文系', '汉语言文学'), 'chinese_language_literature')
  // Community options are now i18n-resolved from static definitions, not remote profile data
  var secondhandOptions = community.getSecondhandCategoryOptions()
  assert.ok(secondhandOptions.length > 0, 'secondhand category options should not be empty')
  assert.deepEqual(secondhandOptions[0], { label: '全部', value: -1 })

  var lostFoundOptions = community.getLostFoundItemDictionaryOptions()
  assert.ok(lostFoundOptions.length > 0, 'lost-found item options should not be empty')
  assert.equal(lostFoundOptions[0].value, 0)
})

test('invalid remote profile options fall back to canonical defaults', async function () {
  const { profile, community } = loadProfileModules(function () {
    return Promise.resolve({
      success: true,
      data: {
        faculties: [{ code: 'x', label: '', majors: [] }],
        marketplaceItemTypes: [{ code: null, label: '' }],
        lostFoundItemTypes: [{ code: undefined, label: '' }],
        lostFoundModes: [{ code: '', label: '' }]
      }
    })
  })

  const options = await profile.fetchProfileOptions(true)

  assert.equal(options.faculties[1].label, '教育学院')
  assert.deepEqual(profile.getMajorOptions('教育学院'), [
    '__not_selected__',
    '教育学',
    '学前教育',
    '小学教育',
    '特殊教育'
  ])
  assert.equal(community.getSecondhandCategoryOptions()[1].label, '校园代步')
  assert.equal(community.getLostFoundModeDictionaryOptions()[1].label, '失物招领')
})

test('canonical defaults follow current locale', async function () {
  global.wx = {
    getStorageSync: function () {
      return ''
    },
    setStorageSync: function () {},
    getSystemInfoSync: function () {
      return { language: 'en-US' }
    }
  }
  global.getApp = function () {
    return { globalData: { locale: 'en-US' } }
  }
  clearModule(COMMUNITY_MODULE)
  clearModule(PROFILE_MODULE)
  stubModule(USER_API_MODULE, {
    getProfileOptions: function () {
      return Promise.reject(new Error('skip remote'))
    }
  })

  const profile = require(PROFILE_MODULE)
  const options = profile.getCachedProfileOptions()

  assert.equal(options.faculties[11].label, 'Department of Computer Science')
  assert.deepEqual(profile.getMajorOptions('Department of Computer Science'), [
    '__not_selected__',
    'Software Engineering',
    'Network Engineering',
    'Computer Science and Technology',
    'Internet of Things Engineering'
  ])
  assert.equal(options.lostFoundModes[1].label, 'Found Item Notice')
})

test('code-only remote profile options resolve labels from catalog', async function () {
  const { profile } = loadProfileModules(function () {
    return Promise.resolve({
      success: true,
      data: {
        faculties: [
          { code: 0, majors: ['unselected'] },
          { code: 11, majors: ['unselected', 'software_engineering'] }
        ],
        marketplaceItemTypes: [0, 11],
        lostFoundItemTypes: [0, 9],
        lostFoundModes: [0, 1]
      }
    })
  })

  const options = await profile.fetchProfileOptions(true)
  const NS = '__not_selected__'

  assert.deepEqual(options.faculties, [
    {
      code: 0,
      label: NS,
      majors: [{ code: 'unselected', label: NS }]
    },
    {
      code: 11,
      label: '计算机科学系',
      majors: [
        { code: 'unselected', label: NS },
        { code: 'software_engineering', label: '软件工程' }
      ]
    }
  ])
  assert.deepEqual(options.marketplaceItemTypes, [
    { code: 0, label: '校园代步' },
    { code: 11, label: '其他' }
  ])
  assert.equal(profile.getMajorCodeByLabel('计算机科学系', '软件工程'), 'software_engineering')
})

test('cached remote profile options are re-localized when locale changes', async function () {
  let app = { globalData: { locale: 'zh-CN' } }
  global.wx = {
    getStorageSync: function () {
      return app.globalData.locale
    },
    setStorageSync: function (key, value) {
      if (key === 'locale') {
        app.globalData.locale = value
      }
    },
    getSystemInfoSync: function () {
      return { language: app.globalData.locale }
    }
  }
  global.getApp = function () {
    return app
  }
  clearModule(COMMUNITY_MODULE)
  clearModule(PROFILE_MODULE)
  stubModule(USER_API_MODULE, {
    getProfileOptions: function () {
      return Promise.resolve({
        success: true,
        data: {
          faculties: [
            { code: 0, majors: ['unselected'] },
            { code: 11, majors: ['unselected', 'software_engineering'] }
          ],
          marketplaceItemTypes: [0, 11],
          lostFoundItemTypes: [0, 9],
          lostFoundModes: [0, 1]
        }
      })
    }
  })

  const profile = require(PROFILE_MODULE)
  await profile.fetchProfileOptions(true)
  assert.deepEqual(profile.getMajorOptions('计算机科学系'), ['__not_selected__', '软件工程'])

  app.globalData.locale = 'en'
  assert.deepEqual(profile.getMajorOptions('Department of Computer Science'), [
    '__not_selected__',
    'Software Engineering'
  ])
  assert.equal(profile.getMarketplaceItemOptions()[0].label, 'Campus Transportation')
})
