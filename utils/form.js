function appendFormValue(result, key, value) {
  if (value === undefined || value === null || value === '') {
    return result
  }

  if (Array.isArray(value)) {
    value.forEach(function(item) {
      appendFormValue(result, key, item)
    })
    return result
  }

  result.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  return result
}

function encodeForm(data) {
  if (!data || typeof data !== 'object') {
    return ''
  }

  return Object.keys(data).reduce(function(result, key) {
    return appendFormValue(result, key, data[key])
  }, []).join('&')
}

module.exports = {
  encodeForm
}
