const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function queryElectricFees(payload) {
  return request({
    url: endpoints.data.electricFees,
    method: 'POST',
    data: payload,
    contentType: 'application/x-www-form-urlencoded'
  })
}

function getYellowPage() {
  return request({
    url: endpoints.data.yellowPage,
    method: 'GET'
  })
}

module.exports = {
  queryElectricFees,
  getYellowPage
}
