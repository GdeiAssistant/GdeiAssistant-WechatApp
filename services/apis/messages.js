const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function getAnnouncementList(start, size) {
  return request({
    url: endpoints.messages.announcements(start, size),
    method: 'GET',
    authRequired: true
  })
}

function getAnnouncementDetail(id) {
  return request({
    url: endpoints.messages.announcementDetail(id),
    method: 'GET',
    authRequired: true
  })
}

function getInteractionList(start, size) {
  return request({
    url: endpoints.messages.interactionList(start, size),
    method: 'GET',
    authRequired: true
  })
}

function getUnreadCount() {
  return request({
    url: endpoints.messages.unreadCount,
    method: 'GET',
    authRequired: true
  })
}

function markMessageRead(messageId) {
  return request({
    url: endpoints.messages.markRead(messageId),
    method: 'POST',
    authRequired: true
  })
}

function markAllMessagesRead() {
  return request({
    url: endpoints.messages.markAllRead,
    method: 'POST',
    authRequired: true
  })
}

function getCategoriesUnread() {
  return request({
    url: '/api/information/message/categories/unread',
    method: 'GET',
    authRequired: true
  })
}
function getAnnouncementUnread() {
  return request({ url: '/api/information/announcement/unread', method: 'GET', authRequired: true })
}
function getCategoryList(category, start, size) {
  return request({
    url: '/api/information/message/' + category + '/start/' + start + '/size/' + size,
    method: 'GET',
    authRequired: true
  })
}
function markCategoryRead(category) {
  return request({
    url: '/api/information/message/' + category + '/readall',
    method: 'POST',
    authRequired: true
  })
}
function markAnnouncementRead(id) {
  return request({
    url: '/api/information/announcement/id/' + encodeURIComponent(id) + '/read',
    method: 'POST',
    authRequired: true
  })
}
module.exports = {
  getCategoriesUnread,
  getAnnouncementUnread,
  getCategoryList,
  markCategoryRead,
  markAnnouncementRead,
  getAnnouncementList,
  getAnnouncementDetail,
  getInteractionList,
  getUnreadCount,
  markMessageRead,
  markAllMessagesRead
}
