const { request } = require('./request.js')
const { encodeForm } = require('../utils/form.js')

// Form posts are the only requests that must switch Content-Type. Keeping the
// literal here (and nowhere else) means a new form endpoint cannot silently
// post urlencoded data with a JSON content type.
const FORM_CONTENT_TYPE = 'application/x-www-form-urlencoded'

function requestForm(options) {
  return request(Object.assign({}, options, { contentType: FORM_CONTENT_TYPE }))
}

function postForm(url, payload) {
  return requestForm({
    url: url,
    method: 'POST',
    authRequired: true,
    data: encodeForm(payload)
  })
}

module.exports = { FORM_CONTENT_TYPE, requestForm, postForm }
