// Keep the custom tab bar (首页 / 消息 / 我的) in sync with the calling tab page.
var messagesApi = require('../services/apis/messages.js')
var socialApi = require('../services/apis/social.js')

function syncTabBar(page, selected) {
  if (!page || typeof page.getTabBar !== 'function') {
    return
  }
  var bar = page.getTabBar()
  if (!bar || typeof bar.update !== 'function') {
    return
  }
  bar.update({ selected: selected })
}

// Each failed source retains its own previous count; categories never overlap.
function refreshUnreadBadge(page) {
  if (!page || typeof page.getTabBar !== 'function') return Promise.resolve()
  var bar = page.getTabBar()
  if (!bar || typeof bar.update !== 'function') return Promise.resolve()
  var token = require('../services/auth.js').getSessionToken()
  if (bar._unreadToken !== token) {
    bar._unreadToken = token
    bar._unreadCounts = { interaction: 0, service: 0, announcement: 0, direct: 0 }
  }
  var epoch = (bar._unreadEpoch = (bar._unreadEpoch || 0) + 1)
  return Promise.allSettled([
    messagesApi.getCategoriesUnread(),
    messagesApi.getAnnouncementUnread(),
    socialApi.getUnread()
  ]).then(function (results) {
    if (
      bar._unreadEpoch !== epoch ||
      bar._unreadToken !== require('../services/auth.js').getSessionToken()
    )
      return
    var keys = [['interaction', 'service'], ['announcement'], ['direct']]
    results.forEach(function (result, index) {
      var response = result.status === 'fulfilled' ? result.value : null
      if (!response || !response.success) return
      var values =
        index === 0
          ? response.data
          : { [keys[index][0]]: index === 1 ? response.data : response.data && response.data.total }
      keys[index].forEach(function (key) {
        if (values && Number.isInteger(values[key]) && values[key] >= 0)
          bar._unreadCounts[key] = values[key]
      })
    })
    var total = Object.values(bar._unreadCounts).reduce(function (sum, value) {
      return sum + value
    }, 0)
    bar.update({ badge: total > 99 ? '99+' : total > 0 ? String(total) : '' })
  })
}
module.exports = { syncTabBar, refreshUnreadBadge }
