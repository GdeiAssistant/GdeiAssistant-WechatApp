const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const USER_API_MODULE = path.join(ROOT, 'services/apis/user.js')
const PROFILE_MODULE = path.join(ROOT, 'constants/profile.js')
const COMMUNITY_MODULE = path.join(ROOT, 'constants/community.js')

function loadProfileModules(getProfileOptions) {
  clearModule(COMMUNITY_MODULE)
  clearModule(PROFILE_MODULE)
  stubModule(USER_API_MODULE, { getProfileOptions })

  return {
    profile: require(PROFILE_MODULE),
    community: require(COMMUNITY_MODULE)
  }
}

test('remote profile options drive faculty and community dictionaries together', async function() {
  const { profile, community } = loadProfileModules(function() {
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

  assert.deepEqual(options.faculties, [
    { code: 0, label: '未选择', majors: ['未选择'] },
    { code: 3, label: '中文系', majors: ['未选择', '汉语言文学'] }
  ])
  assert.deepEqual(profile.getFacultyOptions(), ['未选择', '中文系'])
  assert.equal(profile.getFacultyCodeByLabel(' 中文系 '), 3)
  assert.deepEqual(profile.getMajorOptions('中文系'), ['未选择', '汉语言文学'])
  assert.deepEqual(
    community.getSecondhandCategoryOptions(),
    [
      { label: '全部', value: -1 },
      { label: '校园代步', value: 0 },
      { label: '桌面风扇', value: 1 }
    ]
  )
  assert.deepEqual(
    community.getLostFoundItemDictionaryOptions(),
    [
      { label: '手机', value: 0 },
      { label: '运动健身', value: 9 }
    ]
  )
})

test('invalid remote profile options fall back to canonical defaults', async function() {
  const { profile, community } = loadProfileModules(function() {
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
  assert.deepEqual(profile.getMajorOptions('教育学院'), ['未选择', '教育学', '学前教育', '小学教育', '特殊教育'])
  assert.equal(community.getSecondhandCategoryOptions()[1].label, '校园代步')
  assert.equal(community.getLostFoundModeDictionaryOptions()[1].label, '失物招领')
})
