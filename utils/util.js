function showNoActionModal(title, content) {
  wx.showModal({
    title,
    content,
    showCancel: false
  })
}

function showModal(title, content) {
  wx.showModal({
    title,
    content,
    showCancel: false,
    success: function (res) {
      if (res.confirm) {
        wx.navigateBack({
          delta: 1
        })
      }
    }
  })
}

module.exports = {
  showModal,
  showNoActionModal
}
