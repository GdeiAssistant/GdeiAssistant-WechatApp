const endpoints = require('../endpoints.js')
const { request } = require('../request.js')
const { requestForm } = require('../request-form.js')

function queryElectricFees(payload) {
  return requestForm({
    url: endpoints.data.electricFees,
    method: 'POST',
    data: payload
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
