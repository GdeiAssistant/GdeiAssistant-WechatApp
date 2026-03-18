const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function getGrade(year) {
  return request({
    url: endpoints.campus.grade,
    method: 'GET',
    authRequired: true,
    data: typeof year === 'number' && year >= 0 ? { year } : {}
  })
}

function getSchedule(week) {
  return request({
    url: endpoints.campus.schedule,
    method: 'GET',
    authRequired: true,
    data: week ? { week } : {}
  })
}

function getCardInfo() {
  return request({
    url: endpoints.campus.cardInfo,
    method: 'GET',
    authRequired: true
  })
}

function getCardBill(year, month, date) {
  return request({
    url: endpoints.campus.cardBill,
    method: 'POST',
    authRequired: true,
    data: { year, month, date }
  })
}

function evaluate(directSubmit) {
  return request({
    url: endpoints.campus.evaluate,
    method: 'POST',
    authRequired: true,
    data: { directSubmit: directSubmit }
  })
}

function setCardLost(cardPassword) {
  return request({
    url: endpoints.campus.cardLost,
    method: 'POST',
    authRequired: true,
    data: { cardPassword }
  })
}

module.exports = {
  getGrade,
  getSchedule,
  getCardInfo,
  getCardBill,
  evaluate,
  setCardLost
}
