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
function validateRequestAccess() {
  if (!validateAccessToken()) {
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
  return Math.floor((expireTime - new Date().getTime()) / (3600 * 1000)) >= 1
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

//将字符串编码为UTF-8
function encodeUTF8(s) {
  var i, r = [], c, x;
  for (i = 0; i < s.length; i++)
    if ((c = s.charCodeAt(i)) < 0x80) r.push(c);
    else if (c < 0x800) r.push(0xC0 + (c >> 6 & 0x1F), 0x80 + (c & 0x3F));
    else {
      if ((x = c ^ 0xD800) >> 10 == 0) //对四字节UTF-16转换为Unicode
        c = (x << 10) + (s.charCodeAt(++i) ^ 0xDC00) + 0x10000,
          r.push(0xF0 + (c >> 18 & 0x7), 0x80 + (c >> 12 & 0x3F));
      else r.push(0xE0 + (c >> 12 & 0xF));
      r.push(0x80 + (c >> 6 & 0x3F), 0x80 + (c & 0x3F));
    };
  return r;
};

//SHA1哈希映射字符串
function sha1Hex(s) {
  var data = new Uint8Array(encodeUTF8(s))
  var i, j, t;
  var l = ((data.length + 8) >>> 6 << 4) + 16,
    s = new Uint8Array(l << 2);
  s.set(new Uint8Array(data.buffer)), s = new Uint32Array(s.buffer);
  for (t = new DataView(s.buffer), i = 0; i < l; i++) s[i] = t.getUint32(i << 2);
  s[data.length >> 2] |= 0x80 << (24 - (data.length & 3) * 8);
  s[l - 1] = data.length << 3;
  var w = [],
    f = [
      function() {
        return m[1] & m[2] | ~m[1] & m[3];
      },
      function() {
        return m[1] ^ m[2] ^ m[3];
      },
      function() {
        return m[1] & m[2] | m[1] & m[3] | m[2] & m[3];
      },
      function() {
        return m[1] ^ m[2] ^ m[3];
      }
    ],
    rol = function(n, c) {
      return n << c | n >>> (32 - c);
    },
    k = [1518500249, 1859775393, -1894007588, -899497514],
    m = [1732584193, -271733879, null, null, -1009589776];
  m[2] = ~m[0], m[3] = ~m[1];
  for (i = 0; i < s.length; i += 16) {
    var o = m.slice(0);
    for (j = 0; j < 80; j++)
      w[j] = j < 16 ? s[i + j] : rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1),
      t = rol(m[0], 5) + f[j / 20 | 0]() + m[4] + w[j] + k[j / 20 | 0] | 0,
      m[1] = rol(m[1], 30), m.pop(), m.unshift(t);
    for (j = 0; j < 5; j++) m[j] = m[j] + o[j] | 0;
  };
  t = new DataView(new Uint32Array(m).buffer);
  for (var i = 0; i < 5; i++) m[i] = t.getUint32(i << 2);

  var hex = Array.prototype.map.call(new Uint8Array(new Uint32Array(m).buffer), function(e) {
    return (e < 16 ? "0" : "") + e.toString(16);
  }).join("");

  return hex;
};

module.exports = {
  formatTime: formatTime,
  showModal: showModal,
  showNoActionModal: showNoActionModal,
  validateRequestAccess: validateRequestAccess,
  validateTokenTimestamp: validateTokenTimestamp,
  sha1Hex: sha1Hex
}