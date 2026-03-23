var marketplaceHandler = require('./module-handlers/marketplace.js')
var lostandfoundHandler = require('./module-handlers/lostandfound.js')
var secretHandler = require('./module-handlers/secret.js')
var expressHandler = require('./module-handlers/express.js')
var topicHandler = require('./module-handlers/topic.js')
var photographHandler = require('./module-handlers/photograph.js')
var deliveryHandler = require('./module-handlers/delivery.js')
var datingHandler = require('./module-handlers/dating.js')

var COMMUNITY_MODULES = {
  marketplace: marketplaceHandler,
  ershou: marketplaceHandler,       // legacy alias used by some pages
  lostandfound: lostandfoundHandler,
  secret: secretHandler,
  express: expressHandler,
  topic: topicHandler,
  photograph: photographHandler,
  delivery: deliveryHandler,
  dating: datingHandler
}

function getModuleHandler(moduleId) {
  return COMMUNITY_MODULES[moduleId] || null
}

module.exports = {
  COMMUNITY_MODULES: COMMUNITY_MODULES,
  getModuleHandler: getModuleHandler
}
