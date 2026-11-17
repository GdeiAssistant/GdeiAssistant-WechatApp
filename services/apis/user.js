const endpoints = require('../endpoints.js')
const { request } = require('../request.js')
const { requestForm } = require('../request-form.js')
const { encodeForm } = require('../../utils/form.js')

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

// Aligns with atomic PATCH /api/profile; ProfilePatchController accepts both PATCH and POST
// because WeChat wx.request only guarantees OPTIONS/GET/HEAD/POST/PUT/DELETE/TRACE/CONNECT.
function updateProfile(payload) {
  return request({
    url: endpoints.user.patch,
    method: 'POST',
    authRequired: true,
    data: payload
  })
}

function getLocationList() {
  return request({
    url: endpoints.user.locations,
    method: 'GET',
    authRequired: true
  })
}

function getProfileOptions() {
  return request({
    url: endpoints.user.options,
    method: 'GET',
    authRequired: true
  })
}

function updateAvatar(avatarKey, avatarHdKey) {
  return requestForm({
    url: endpoints.user.avatar,
    method: 'POST',
    authRequired: true,
    data: encodeForm({
      avatarKey: avatarKey,
      avatarHdKey: avatarHdKey
    })
  })
}

function deleteAvatar() {
  return request({
    url: endpoints.user.avatar,
    method: 'DELETE',
    authRequired: true
  })
}

module.exports = {
  getAvatar,
  getProfile,
  updateProfile,
  getLocationList,
  getProfileOptions,
  updateAvatar,
  deleteAvatar
}
