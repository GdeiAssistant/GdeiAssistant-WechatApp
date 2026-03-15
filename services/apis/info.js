const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function getReadingList() {
  return request({
    url: endpoints.info.reading,
    method: 'GET'
  })
}

function getNewsList(type, start, size) {
  return request({
    url: endpoints.info.news(type, start, size),
    method: 'GET'
  })
}

function queryGraduateExam(payload) {
  return request({
    url: endpoints.info.graduateExam,
    method: 'POST',
    data: payload
  })
}

function querySpareRoom(payload) {
  return request({
    url: endpoints.info.spareRoom,
    method: 'POST',
    authRequired: true,
    data: payload
  })
}

module.exports = {
  getReadingList,
  getNewsList,
  queryGraduateExam,
  querySpareRoom
}
