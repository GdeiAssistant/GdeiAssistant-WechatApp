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

function updateNickname(nickname) {
  return request({
    url: endpoints.user.nickname,
    method: 'POST',
    authRequired: true,
    data: {
      nickname: nickname
    }
  })
}

function updateIntroduction(introduction) {
  return request({
    url: endpoints.user.introduction,
    method: 'POST',
    authRequired: true,
    data: {
      introduction: introduction
    }
  })
}

function updateBirthday(payload) {
  return request({
    url: endpoints.user.birthday,
    method: 'POST',
    authRequired: true,
    data: payload
  })
}

function updateFaculty(facultyIndex) {
  return request({
    url: endpoints.user.faculty,
    method: 'POST',
    authRequired: true,
    data: {
      faculty: facultyIndex
    }
  })
}

function updateMajor(major) {
  return request({
    url: endpoints.user.major,
    method: 'POST',
    authRequired: true,
    data: {
      major: major
    }
  })
}

function updateEnrollment(year) {
  return request({
    url: endpoints.user.enrollment,
    method: 'POST',
    authRequired: true,
    data: {
      year: year
    }
  })
}

function updateLocation(payload) {
  return request({
    url: endpoints.user.location,
    method: 'POST',
    authRequired: true,
    data: payload
  })
}

function updateHometown(payload) {
  return request({
    url: endpoints.user.hometown,
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
  return request({
    url: endpoints.user.avatar,
    method: 'POST',
    authRequired: true,
    data: {
      avatarKey: avatarKey,
      avatarHdKey: avatarHdKey
    }
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
  updateNickname,
  updateIntroduction,
  updateBirthday,
  updateFaculty,
  updateMajor,
  updateEnrollment,
  updateLocation,
  updateHometown,
  getLocationList,
  getProfileOptions,
  updateAvatar,
  deleteAvatar
}
