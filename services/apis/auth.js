const config = require('../../config/index.js')
const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function loginWithCampus(payload) {
  return request({
    url: endpoints.auth.login,
    method: 'POST',
    data: payload
  })
}

function getOpenIdByCode(code) {
  const systemInfo = wx.getSystemInfoSync()
  const endpoint = systemInfo.AppPlatform === 'qq' ? endpoints.auth.qqOpenId : endpoints.auth.wechatOpenId
  return request({
    url: endpoint,
    method: 'POST',
    data: { code }
  })
}

function extractOpenId(result) {
  if (!result || !result.data) {
    return null
  }
  return result.data.openid || result.data.unionid || result.data.userId || null
}

function buildLoginSignature(utils) {
  const nonce = Math.random().toString(36).substr(2, 15)
  const timestamp = Date.now()
  const signature = utils.sha1Hex(timestamp + nonce + config.requestValidateToken)
  return { nonce, timestamp, signature }
}

module.exports = {
  loginWithCampus,
  getOpenIdByCode,
  extractOpenId,
  buildLoginSignature
}
