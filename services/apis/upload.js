const endpoints = require('../endpoints.js')
const { request } = require('../request.js')

function getPresignedUploadUrl(fileName, contentType) {
  return request({
    url: endpoints.upload.presignedUrl,
    method: 'GET',
    authRequired: true,
    data: {
      fileName: fileName,
      contentType: contentType
    }
  })
}

module.exports = {
  getPresignedUploadUrl
}
