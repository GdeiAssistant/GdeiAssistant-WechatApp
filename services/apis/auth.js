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

module.exports = {
  loginWithCampus
}
