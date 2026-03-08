const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function getAvatar(username) {
  return request({
    url: `${endpoints.user.avatar}${username}`,
    method: 'GET'
  })
}

function getProfile() {
  return request({
    url: endpoints.user.profile,
    authRequired: true
  })
}

function getAccessList() {
  return request({
    url: endpoints.user.access,
    authRequired: true
  })
}

module.exports = {
  getAvatar,
  getProfile,
  getAccessList
}
