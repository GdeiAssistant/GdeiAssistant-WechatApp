const test = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')
const { setImmediate } = require('node:timers')

function deferred() {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

async function flush() {
  await new Promise((done) => setImmediate(done))
}

for (const name of ['grade', 'schedule']) {
  test(`${name} ignores stale responses and responses after unload`, async () => {
    let definition
    const requests = []
    const api = new Proxy(
      {},
      {
        get: () => () => {
          const pending = deferred()
          requests.push(pending)
          return pending.promise
        }
      }
    )
    let updates = 0
    const context = {
      Page: (page) => {
        definition = page
      },
      wx: { showNavigationBarLoading() {}, hideNavigationBarLoading() {} },
      require: (module) => (module.includes('/apis/') ? api : { showModal() {}, t: () => '' })
    }
    vm.runInNewContext(
      fs.readFileSync(path.join(__dirname, `../pages/${name}/${name}.js`), 'utf8'),
      context
    )
    const page = {
      ...definition,
      data: { ...definition.data },
      setData(value) {
        Object.assign(this.data, value)
        updates++
      }
    }
    const load = name === 'grade' ? 'getGrade' : 'getDataList'
    const result = (index) =>
      name === 'grade'
        ? {
            success: true,
            data: { year: index, firstTermGradeList: [index], secondTermGradeList: [] }
          }
        : {
            success: true,
            data: { week: index, scheduleList: [{ column: 0, scheduleName: String(index) }] }
          }
    page[load]()
    page[load]()
    requests[1].resolve(result(2))
    await flush()
    const current = JSON.stringify(page.data)
    const confirmedUpdates = updates
    requests[0].resolve(result(1))
    await flush()
    assert.equal(JSON.stringify(page.data), current)
    assert.equal(updates, confirmedUpdates)
    page[load]()
    page.onUnload()
    requests[2].resolve(result(3))
    await flush()
    assert.equal(JSON.stringify(page.data), current)
    assert.equal(updates, confirmedUpdates)
  })
}
