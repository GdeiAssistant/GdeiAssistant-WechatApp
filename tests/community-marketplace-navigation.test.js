const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')
const { stubModule, clearModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const profilePath = path.join(ROOT, 'constants/profile.js')
stubModule(profilePath, {
  ...require(profilePath),
  fetchProfileOptions: function () {
    return Promise.resolve()
  }
})

const { getModuleHandler } = require('../services/community/registry.js')

function createPage(name) {
  const modals = []
  global.wx = {
    setNavigationBarTitle: function () {},
    showModal: function (options) {
      modals.push(options)
    }
  }
  let config
  global.Page = function (value) {
    config = value
  }
  const pagePath = path.join(ROOT, 'pages', name, name + '.js')
  clearModule(pagePath)
  require(pagePath)
  const page = Object.create(config)
  page.data = JSON.parse(JSON.stringify(config.data))
  page.setData = function (patch) {
    Object.assign(page.data, patch)
  }
  page.refreshI18n = function () {}
  page.ensureProfileOptions = function () {
    return Promise.resolve()
  }
  const loads = []
  for (const method of ['loadDetail', 'loadFeed', 'loadCenter', 'loadEditItem']) {
    page[method] = function () {
      loads.push({ method, moduleId: page.data.moduleId })
    }
  }
  page.loadStatsIfNeeded = function () {}
  return { page, modals, loads }
}

const pageCases = [
  ['communityDetail', 'loadDetail', { id: '101' }],
  ['communityList', 'loadFeed', {}],
  ['communityCenter', 'loadCenter', {}],
  ['communityPublish', 'loadEditItem', { mode: 'edit', id: '101' }]
]

for (const [name, loadMethod, options] of pageCases) {
  for (const moduleId of ['ershou', 'secondhand', 'marketplace']) {
    test(`${name} accepts ${moduleId} and loads the registered marketplace module`, async function () {
      const { page, modals, loads } = createPage(name)
      page.onLoad({ module: moduleId, ...options })
      // onLoad schedules profile-option continuations without returning their promise.
      await new Promise(function (resolve) {
        setTimeout(resolve, 0)
      })

      assert.deepEqual(modals, [])
      assert.equal(page.data.moduleId, 'marketplace')
      assert.equal(page.data.moduleConfig.id, 'marketplace')
      assert.ok(getModuleHandler(page.data.moduleId))
      assert.deepEqual(loads, [{ method: loadMethod, moduleId: 'marketplace' }])
      if (name === 'communityPublish') {
        assert.equal(page.data.isEditMode, true)
        assert.equal(page.data.editItemId, '101')
      } else {
        assert.match(page.onShareAppMessage().path, /[?&]module=marketplace(?:&|$)/)
      }
    })
  }

  test(`${name} still rejects an unknown community module`, function () {
    const { page, modals, loads } = createPage(name)
    page.onLoad({ module: 'unknown', ...options })
    assert.equal(modals.length, 1)
    assert.equal(page.data.moduleId, '')
    assert.deepEqual(loads, [])
  })
}
