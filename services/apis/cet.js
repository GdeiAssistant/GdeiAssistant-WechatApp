const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function getCetNumber() {
  return request({
    url: endpoints.cet.number,
    method: 'GET',
    authRequired: true
  })
}

function saveCetNumber(payload) {
  return request({
    url: endpoints.cet.number,
    method: 'POST',
    authRequired: true,
    data: payload
  })
}

function getCetCheckcode() {
  return request({
    url: endpoints.cet.checkcode,
    method: 'GET',
    authRequired: true
  })
}

function queryCetScore(ticketNumber, name, checkcode) {
  const data = {
    ticketNumber,
    name
  }

  if (checkcode) {
    data.checkcode = checkcode
  }

  return request({
    url: endpoints.cet.query,
    method: 'GET',
    authRequired: true,
    data
  })
}

module.exports = {
  getCetNumber,
  saveCetNumber,
  getCetCheckcode,
  queryCetScore
}
