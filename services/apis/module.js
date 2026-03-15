const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function getModuleStateDetail() {
  return request({
    url: endpoints.module.stateDetail,
    method: 'GET'
  })
}

module.exports = {
  getModuleStateDetail
}
