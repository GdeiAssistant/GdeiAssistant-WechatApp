function showTopTips(page, content, options) {
  if (!page || typeof page.setData !== 'function') {
    return
  }

  const config = options || {}
  const dataKey = config.dataKey || 'errorMessage'
  const duration = typeof config.duration === 'number' ? config.duration : 3000

  if (page.__topTipsTimer) {
    clearTimeout(page.__topTipsTimer)
    page.__topTipsTimer = null
  }

  page.setData({ [dataKey]: content })
  page.__topTipsTimer = setTimeout(function() {
    page.setData({ [dataKey]: null })
    page.__topTipsTimer = null
  }, duration)
}

function runWithNavigationLoading(page, task, options) {
  const config = options || {}
  const loadingKey = config.loadingKey === undefined ? 'loading' : config.loadingKey
  const manageLoading = typeof loadingKey === 'string' && loadingKey.length > 0

  if (manageLoading && page && typeof page.setData === 'function') {
    page.setData({ [loadingKey]: true })
  }
  wx.showNavigationBarLoading()

  return Promise.resolve()
    .then(function() {
      return typeof task === 'function' ? task() : task
    })
    .finally(function() {
      wx.hideNavigationBarLoading()
      if (manageLoading && page && typeof page.setData === 'function') {
        page.setData({ [loadingKey]: false })
      }
    })
}

module.exports = {
  showTopTips,
  runWithNavigationLoading
}
