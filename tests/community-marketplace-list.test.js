const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const test = require('node:test')
const assert = require('node:assert/strict')
const { getCommunityModule, getCommunityModules } = require('../constants/community.js')

const template = fs.readFileSync(
  path.join(__dirname, '../pages/communityList/communityList.wxml'),
  'utf8'
)
const marketSection = template.match(
  /<view class="list_section" wx:if="\{\{([^}]+)\}\}">\s*<view[^>]*class="market_card"/
)
assert.ok(marketSection, 'the marketplace card section must exist')

function showsMarketplaceCards(moduleId) {
  return vm.runInNewContext(marketSection[1], { moduleId })
}

test('the registered marketplace module shows its item cards', function () {
  const moduleConfig = getCommunityModule('marketplace')
  assert.ok(moduleConfig)
  assert.equal(showsMarketplaceCards(moduleConfig.id), true)
})

test('other community modules do not show marketplace cards', function () {
  for (const moduleConfig of getCommunityModules()) {
    if (moduleConfig.id !== 'marketplace') {
      assert.equal(showsMarketplaceCards(moduleConfig.id), false, moduleConfig.id)
    }
  }
})
