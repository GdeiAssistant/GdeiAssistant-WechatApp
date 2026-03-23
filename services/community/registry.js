var marketplaceHandler = require('./module-handlers/marketplace.js')
var lostandfoundHandler = require('./module-handlers/lostandfound.js')
var secretHandler = require('./module-handlers/secret.js')
var expressHandler = require('./module-handlers/express.js')

var COMMUNITY_MODULES = {
  marketplace: marketplaceHandler,
  ershou: marketplaceHandler,       // legacy alias used by some pages
  lostandfound: lostandfoundHandler,
  secret: secretHandler,
  express: expressHandler
}

function getModuleHandler(moduleId) {
  return COMMUNITY_MODULES[moduleId] || null
}

module.exports = {
  COMMUNITY_MODULES: COMMUNITY_MODULES,
  getModuleHandler: getModuleHandler
}
