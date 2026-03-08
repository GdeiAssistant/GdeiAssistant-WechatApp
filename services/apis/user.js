const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function getAvatar() {
  return request({
    url: endpoints.user.avatar,
    method: 'GET',
    authRequired: true
  })
}

function getProfile() {
  return request({
    url: endpoints.user.profile,
    method: 'GET',
    authRequired: true
  })
}

module.exports = {
  getAvatar,
  getProfile
}
