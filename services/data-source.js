const storageKeys = require('../constants/storage.js')
const i18n = require('../utils/i18n.js')
const config = require('../config/index.js')

const DATA_SOURCE_MODES = {
  remote: 'remote',
  mock: 'mock'
}

function canUseDemoMode() {
  return !!config.allowRuntimeDebugOptions
}

function getDataSourceMode() {
  if (!canUseDemoMode()) {
    return DATA_SOURCE_MODES.remote
  }

  try {
    const mode = wx.getStorageSync(storageKeys.dataSourceMode)
    if (mode === DATA_SOURCE_MODES.mock || mode === DATA_SOURCE_MODES.remote) {
      return mode
    }
  } catch (error) {
    // Ignore data source storage read failures.
  }

  return DATA_SOURCE_MODES.remote
}

function setDataSourceMode(mode) {
  const nextMode =
    canUseDemoMode() && mode === DATA_SOURCE_MODES.mock
      ? DATA_SOURCE_MODES.mock
      : DATA_SOURCE_MODES.remote
  try {
    if (!canUseDemoMode() && wx.removeStorageSync) {
      wx.removeStorageSync(storageKeys.dataSourceMode)
    } else {
      wx.setStorageSync(storageKeys.dataSourceMode, nextMode)
    }
  } catch (error) {
    // Ignore data source storage write failures.
  }
  return nextMode
}

function toggleDataSourceMode() {
  return setDataSourceMode(isMockMode() ? DATA_SOURCE_MODES.remote : DATA_SOURCE_MODES.mock)
}

function isMockMode() {
  return getDataSourceMode() === DATA_SOURCE_MODES.mock
}

function getDataSourceLabel() {
  return isMockMode() ? i18n.t('dataSource.mock') : i18n.t('dataSource.remote')
}

module.exports = {
  DATA_SOURCE_MODES,
  canUseDemoMode,
  getDataSourceMode,
  setDataSourceMode,
  toggleDataSourceMode,
  isMockMode,
  getDataSourceLabel
}
