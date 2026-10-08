const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')
const { clearModule, stubModule } = require('./helpers/module.js')
const ROOT = path.resolve(__dirname, '..')
function setup() {
  let token = 'alice'
  let failed = false
  let direct = 5
  stubModule(path.join(ROOT, 'services/auth.js'), { getSessionToken: () => token })
  stubModule(path.join(ROOT, 'services/apis/messages.js'), {
    getCategoriesUnread: () =>
      failed
        ? Promise.reject(new Error('offline'))
        : Promise.resolve({ success: true, data: { interaction: 3, service: 2 } }),
    getAnnouncementUnread: () => Promise.resolve({ success: true, data: 4 })
  })
  stubModule(path.join(ROOT, 'services/apis/social.js'), {
    getUnread: () => Promise.resolve({ success: true, data: { total: direct } })
  })
  const modulePath = path.join(ROOT, 'utils/tab-bar.js')
  clearModule(modulePath)
  const util = require(modulePath)
  const bar = {
    update(data) {
      Object.assign(this, data)
    }
  }
  return {
    bar,
    refresh: () => util.refreshUnreadBadge({ getTabBar: () => bar }),
    fail: () => {
      failed = true
      direct = 0
    },
    switchIdentity: () => {
      token = 'bob'
      failed = true
      direct = 0
    }
  }
}
test('partial unread failure preserves only failed sources while successful sources update', async () => {
  const fixture = setup()
  await fixture.refresh()
  assert.equal(fixture.bar.badge, '14')
  fixture.fail()
  await fixture.refresh()
  assert.equal(fixture.bar.badge, '9')
})
test('identity change clears previous user unread counts before refreshing', async () => {
  const fixture = setup()
  await fixture.refresh()
  fixture.switchIdentity()
  await fixture.refresh()
  assert.equal(fixture.bar.badge, '4')
})
