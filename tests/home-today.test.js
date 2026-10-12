const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')
const { setImmediate } = require('node:timers')
const { stubModule, freshRequire } = require('./helpers/module.js')
const root = path.resolve(__dirname, '..')
const sourcePage = path.join(root, 'pages/index/index.js')

function setup(token, sections) {
  const pending = []
  stubModule(path.join(root, 'services/auth.js'), { getSessionToken: () => token })
  stubModule(path.join(root, 'services/apis/campus.js'), {
    getSchedule: () => new Promise((resolve, reject) => pending.push({ resolve, reject }))
  })
  stubModule(path.join(root, 'services/data-source.js'), { getDataSourceLabel: () => '真实接口' })
  stubModule(path.join(root, 'services/feature-config.js'), {
    getHomeSections: () =>
      sections || [
        { id: 'campus', features: [{ id: 'schedule', page: '/pages/schedule/schedule' }] }
      ]
  })
  let definition
  global.Page = (value) => {
    definition = value
  }
  freshRequire(sourcePage)
  const page = Object.assign({}, definition, {
    data: Object.assign({}, definition.data),
    setData(value) {
      Object.assign(this.data, value)
    }
  })
  page.loadHomeSections()
  return { page, pending }
}
const settle = () => new Promise((resolve) => setImmediate(resolve))

test('a schedule excluded by the original home configuration neither displays nor requests today', () => {
  const { page, pending } = setup('saved-test-token', [
    { id: 'campus', features: [{ id: 'grade' }] }
  ])
  page.loadTodaySchedule()
  assert.equal(page.data.todayVisible, false)
  assert.equal(pending.length, 0)
})

test('hiddenFeatureIds also gates the card and its request', () => {
  const { page, pending } = setup('saved-test-token')
  page.data.hiddenFeatureIds = ['schedule']
  page.loadHomeSections()
  page.loadTodaySchedule()
  assert.equal(page.data.todayVisible, false)
  assert.equal(pending.length, 0)
})

test('a previously allowed response is ignored after the schedule becomes hidden', async () => {
  const { page, pending } = setup('saved-test-token')
  page.loadTodaySchedule()
  page.data.hiddenFeatureIds = ['schedule']
  page.loadHomeSections()
  pending[0].resolve({ success: true, data: { week: 5, scheduleList: [] } })
  await settle()
  assert.equal(page.data.todayVisible, false)
  assert.equal(page.data.today.status, 'loading')
})

test('does not request the authenticated timetable without an existing token', () => {
  const { page, pending } = setup('')
  page.loadTodaySchedule()
  assert.equal(pending.length, 0)
  assert.equal(page.data.today.status, 'unavailable')
})

test('failure remains unavailable rather than a successful empty day', async () => {
  const { page, pending } = setup('saved-test-token')
  page.loadTodaySchedule()
  pending[0].resolve({ success: false })
  await settle()
  assert.equal(page.data.today.status, 'unavailable')
  page.loadTodaySchedule()
  pending[1].reject(new Error('offline'))
  await settle()
  assert.equal(page.data.today.status, 'unavailable')
})

test('a stale request cannot replace the current success', async () => {
  const { page, pending } = setup('saved-test-token')
  page.loadTodaySchedule()
  page.loadTodaySchedule()
  pending[1].resolve({ success: true, data: { week: 5, scheduleList: [] } })
  await settle()
  assert.equal(page.data.today.status, 'empty')
  pending[0].reject(new Error('old request'))
  await settle()
  assert.equal(page.data.today.status, 'empty')
})

test('hidden or unloaded pages ignore late timetable responses', async () => {
  for (const lifecycle of ['onHide', 'onUnload']) {
    const { page, pending } = setup('saved-test-token')
    page.loadTodaySchedule()
    page[lifecycle]()
    pending[0].resolve({ success: true, data: { week: 5, scheduleList: [] } })
    await settle()
    assert.equal(page.data.today.status, 'loading')
  }
})

test('theme asset selection preserves existing routes and feature visibility metadata', () => {
  const { page } = setup('saved-test-token')
  const original = {
    id: 'schedule',
    title: '课表',
    page: '/pages/schedule/schedule',
    section: 'campus'
  }
  const result = page.withHomeIcon(original)
  assert.equal(result.page, original.page)
  assert.equal(result.icon, '/image/linear/light/calendar.svg')
  assert.equal(result.iconDark, '/image/linear/dark/calendar.svg')
  assert.equal(original.icon, undefined)
})
