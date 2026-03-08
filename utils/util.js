const auth = require('../services/auth.js')

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

function validateRequestAccess() {
  return auth.ensureAccessTokenSignature().then(() => true).catch(() => false)
}

function validateTokenTimestamp(expireTime) {
  return auth.validateTokenTimestamp(expireTime)
}

function showReLaunchModal(title, content) {
  wx.showModal({
    title,
    content,
    showCancel: false,
    success: function(res) {
      if (res.confirm) {
        wx.reLaunch({
          url: '/pages/login/login'
        })
      }
    }
  })
}

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
    success: function(res) {
      if (res.confirm) {
        wx.navigateBack({
          delta: 1
        })
      }
    }
  })
}

function encodeUTF8(s) {
  var i, r = [], c, x;
  for (i = 0; i < s.length; i++) {
    if ((c = s.charCodeAt(i)) < 0x80) {
      r.push(c)
    } else if (c < 0x800) {
      r.push(0xC0 + (c >> 6 & 0x1F), 0x80 + (c & 0x3F))
    } else {
      if ((x = c ^ 0xD800) >> 10 == 0) {
        c = (x << 10) + (s.charCodeAt(++i) ^ 0xDC00) + 0x10000
        r.push(0xF0 + (c >> 18 & 0x7), 0x80 + (c >> 12 & 0x3F))
      } else {
        r.push(0xE0 + (c >> 12 & 0xF))
      }
      r.push(0x80 + (c >> 6 & 0x3F), 0x80 + (c & 0x3F))
    }
  }
  return r
}

function sha1Hex(s) {
  var data = new Uint8Array(encodeUTF8(s))
  var i, j, t
  var l = ((data.length + 8) >>> 6 << 4) + 16
  var buf = new Uint8Array(l << 2)
  buf.set(new Uint8Array(data.buffer))
  var s32 = new Uint32Array(buf.buffer)
  for (t = new DataView(s32.buffer), i = 0; i < l; i++) s32[i] = t.getUint32(i << 2)
  s32[data.length >> 2] |= 0x80 << (24 - (data.length & 3) * 8)
  s32[l - 1] = data.length << 3
  var w = []
  var m = [1732584193, -271733879, null, null, -1009589776]
  var f = [
    function() { return m[1] & m[2] | ~m[1] & m[3] },
    function() { return m[1] ^ m[2] ^ m[3] },
    function() { return m[1] & m[2] | m[1] & m[3] | m[2] & m[3] },
    function() { return m[1] ^ m[2] ^ m[3] }
  ]
  var rol = function(n, c) { return n << c | n >>> (32 - c) }
  var k = [1518500249, 1859775393, -1894007588, -899497514]
  m[2] = ~m[0]
  m[3] = ~m[1]

  for (i = 0; i < s32.length; i += 16) {
    var o = m.slice(0)
    for (j = 0; j < 80; j++) {
      w[j] = j < 16 ? s32[i + j] : rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1)
      t = rol(m[0], 5) + f[j / 20 | 0]() + m[4] + w[j] + k[j / 20 | 0] | 0
      m[1] = rol(m[1], 30)
      m.pop()
      m.unshift(t)
    }
    for (j = 0; j < 5; j++) m[j] = m[j] + o[j] | 0
  }
  t = new DataView(new Uint32Array(m).buffer)
  for (i = 0; i < 5; i++) m[i] = t.getUint32(i << 2)

  return Array.prototype.map.call(new Uint8Array(new Uint32Array(m).buffer), function(e) {
    return (e < 16 ? '0' : '') + e.toString(16)
  }).join('')
}

module.exports = {
  formatTime,
  showModal,
  showNoActionModal,
  showReLaunchModal,
  validateRequestAccess,
  validateTokenTimestamp,
  sha1Hex
}
