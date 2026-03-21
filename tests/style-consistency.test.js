var test = require('node:test')
var assert = require('node:assert/strict')
var fs = require('fs')
var path = require('path')

var ROOT = path.resolve(__dirname, '..')

var pages = [
  'pages/profile/profile.wxss',
  'pages/news/news.wxss',
  'pages/communityCenter/communityCenter.wxss',
  'pages/communityDetail/communityDetail.wxss',
  'pages/communityList/communityList.wxss',
  'pages/communityPublish/communityPublish.wxss',
  'pages/inbox/inbox.wxss'
]

pages.forEach(function(pagePath) {
  test(path.basename(pagePath) + ' uses standard background', function() {
    var fullPath = path.join(ROOT, pagePath)
    var content = fs.readFileSync(fullPath, 'utf8')
    if (content.includes('background')) {
      var bgMatches = content.match(/background(?:-color)?:\s*([^;]+)/g) || []
      bgMatches.forEach(function(match) {
        var nonStandard = ['#f5f5f5', '#f7f7f7', '#eee', '#eeeeee']
        nonStandard.forEach(function(bad) {
          assert.ok(!match.toLowerCase().includes(bad),
            pagePath + ' uses non-standard background ' + bad + ': ' + match)
        })
      })
    }
  })
})
