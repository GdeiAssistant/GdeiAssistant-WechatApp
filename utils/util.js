const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/**
 * 检测API调用权限
 * 若权限令牌过期或无则默认使用刷新令牌进行刷新
 * 若刷新令牌过期或无则要求用户重新验证身份
 */
function validateRequestAccess(){
  if(!validateAccessToken()){
    return refreshAccessToken()
  }
  return true;
}

/**
 * 校验权限令牌可用性
 */
function validateAccessToken() {
  let accessToken = wx.getStorageSync("accessToken")
  if (accessToken) {
    if (validateTokenTimestamp(accessToken.expireTime)) {
      return true;
    }
  }
  return false;
}

/**
 * 使用刷新令牌，刷新权限令牌
 */
function refreshAccessToken() {
  let refreshToken = wx.getStorageSync("refreshToken")
  if (refreshToken) {
    if (validateTokenTimestamp(refreshToken.expireTime)) {
      wx.request({
        url: "https://www.gdeiassistant.cn/rest/token/refresh",
        method: "POST",
        data: {
          token: refreshToken.signature
        },
        success: function(result) {
          if (result.statusCode == 200) {
            //更新令牌信息
            wx.setStorageSync("accessToken", result.data.data.accessToken)
            wx.setStorageSync("refreshToken", result.data.data.refreshToken)
            return true;
          } else {
            showModal('更新令牌失败', '服务暂不可用，请稍后再试')
          }
        },
        fail: function() {
          showModal('更新令牌失败', '网络连接超时，请重试')
        }
      })
    } else {
      //令牌过期，要求用户重新进行身份认证
      wx.clearStorageSync()
      showReLaunchModal('令牌过期', '用户登录凭证已过期，请重新登录')
    }
  } else {
    //令牌过期，要求用户重新进行身份认证
    wx.clearStorageSync()
    showReLaunchModal('令牌过期', '用户登录凭证已过期，请重新登录')
  }
  return false;
}

/**
 * 校验令牌时间戳
 */
function validateTokenTimestamp(expireTime) {
  return Math.floor(((new Date().getTime - expireTime) % (3600 * 1000))) <= 1
}

/**
 * 弹出提示框信息，关闭所有页面，打开到应用的登录页面
 */
function showReLaunchModal(title, content) {
  wx.showModal({
    title: title,
    content: content,
    showCancel: false,
    success: function(res) {
      if (res.confirm) {
        wx.reLaunch({
          url: '../login/login'
        })
      }
    }
  })
}

/**
 * 弹出提示框信息，无点击确认按钮的回调动作
 */
function showNoActionModal(title, content) {
  wx.showModal({
    title: title,
    content: content,
    showCancel: false
  })
}

/**
 * 弹出提示框信息
 */
function showModal(title, content) {
  wx.showModal({
    title: title,
    content: content,
    showCancel: false,
    success: function(res) {
      if (res.confirm) {
        wx.navigateBack({
          delta: 1
        })
      }
    }
  })
}

module.exports = {
  formatTime: formatTime,
  showModal: showModal,
  showNoActionModal: showNoActionModal,
  validateRequestAccess: validateRequestAccess,
  validateTokenTimestamp: validateTokenTimestamp
}