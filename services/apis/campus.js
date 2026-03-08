const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function getGrade(year) {
  return request({
    url: endpoints.campus.grade,
    authRequired: true,
    data: typeof year === 'number' && year >= 0 ? { year } : {}
  })
}

function getSchedule(week) {
  return request({
    url: endpoints.campus.schedule,
    authRequired: true,
    data: week ? { week } : {}
  })
}

function getCardInfo() {
  return request({
    url: endpoints.campus.cardInfo,
    authRequired: true
  })
}

function getCardBill(year, month, date) {
  return request({
    url: endpoints.campus.cardBill,
    authRequired: true,
    data: { year, month, date }
  })
}

function evaluate(directlySubmit) {
  return request({
    url: endpoints.campus.evaluate,
    authRequired: true,
    data: { directlySubmit }
  })
}

function setCardLost(cardPassword) {
  return request({
    url: endpoints.campus.cardLost,
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
