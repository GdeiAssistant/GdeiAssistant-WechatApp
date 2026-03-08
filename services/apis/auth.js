const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function loginWithCampus(payload) {
  return request({
    url: endpoints.auth.login,
    method: 'POST',
    data: {
      username: payload.username,
      password: payload.password
    }
  })
}

function getOpenIdByCode(code) {
  return request({
    url: endpoints.auth.wechatOpenId,
    method: 'POST',
    data: { code },
    contentType: 'application/x-www-form-urlencoded'
  })
}

function extractOpenId(result) {
  if (!result || !result.data) {
    return null
  }
  return result.data.openid || result.data.unionid || result.data.userId || null
}

module.exports = {
  loginWithCampus,
  getOpenIdByCode,
  extractOpenId
}
