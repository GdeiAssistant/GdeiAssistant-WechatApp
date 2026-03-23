var marketplaceHandler = require('./module-handlers/marketplace.js')
var lostandfoundHandler = require('./module-handlers/lostandfound.js')

var COMMUNITY_MODULES = {
  marketplace: marketplaceHandler,
  ershou: marketplaceHandler,       // legacy alias used by some pages
  lostandfound: lostandfoundHandler
}

function getModuleHandler(moduleId) {
  return COMMUNITY_MODULES[moduleId] || null
}

module.exports = {
  COMMUNITY_MODULES: COMMUNITY_MODULES,
  getModuleHandler: getModuleHandler
}
