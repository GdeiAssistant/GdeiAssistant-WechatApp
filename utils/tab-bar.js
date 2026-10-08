// Keep the custom tab bar (首页 / 消息 / 我的) in sync with the calling tab page.
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

module.exports = {
  syncTabBar: syncTabBar
}
