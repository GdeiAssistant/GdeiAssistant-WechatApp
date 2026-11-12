// Pure presentation helpers shared by the community module handlers.
// These used to be redefined in up to six handlers, and the findLabel copies
// had already diverged: some matched `feedValue`, others did not.

function trimValue(value) {
  return String(value || '').trim()
}

function getMaxLengthMessage(value, maxLength, message) {
  return trimValue(value).length > maxLength ? message : ''
}

function findLabel(options, value, fallback) {
  var item = (options || []).filter(function (optionItem) {
    if (Number(optionItem.value) === Number(value)) {
      return true
    }
    return optionItem.feedValue !== undefined && Number(optionItem.feedValue) === Number(value)
  })[0]
  return item ? item.label : fallback || ''
}

function formatPrice(value) {
  var price = Number(value || 0)
  return price ? price.toFixed(2) : '0.00'
}

module.exports = { trimValue, getMaxLengthMessage, findLabel, formatPrice }
