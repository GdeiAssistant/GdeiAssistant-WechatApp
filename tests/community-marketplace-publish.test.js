const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')
const { getCommunityModules } = require('../constants/community.js')

const registeredIds = new Set(getCommunityModules().map((m) => m.id))
const pageFiles = [
  'pages/communityPublish/communityPublish.js',
  'pages/communityPublish/communityPublish.wxml',
  'pages/communityDetail/communityDetail.js',
  'pages/communityDetail/communityDetail.wxml',
  'pages/communityCenter/communityCenter.js'
]

function read(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
}

test('marketplace is the registered module id', function () {
  assert.ok(registeredIds.has('marketplace'))
  assert.ok(!registeredIds.has('ershou'))
})

test('community pages compare moduleId only against registered ids', function () {
  const pattern = /moduleId\s*[!=]==\s*'([a-z]+)'/g
  for (const file of pageFiles) {
    for (const match of read(file).matchAll(pattern)) {
      assert.ok(registeredIds.has(match[1]), file + ' uses unregistered module id ' + match[1])
    }
  }
})

test('marketplace items are editable and update through the secondhand API', function () {
  const source = read('pages/communityPublish/communityPublish.js')
  assert.match(source, /EDITABLE_MODULE_IDS = \['marketplace', 'lostandfound'\]/)
  assert.match(
    source,
    /moduleId === 'marketplace'\) \{\s*return communityApi\.updateSecondhandItem/
  )
})
