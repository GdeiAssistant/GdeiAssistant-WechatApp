function clearModule(modulePath) {
  const resolvedPath = require.resolve(modulePath)
  delete require.cache[resolvedPath]
  return resolvedPath
}

function stubModule(modulePath, exports) {
  const resolvedPath = clearModule(modulePath)
  require.cache[resolvedPath] = {
    id: resolvedPath,
    filename: resolvedPath,
    loaded: true,
    exports
  }
  return resolvedPath
}

function freshRequire(modulePath) {
  clearModule(modulePath)
  return require(modulePath)
}

module.exports = {
  clearModule,
  stubModule,
  freshRequire
}
