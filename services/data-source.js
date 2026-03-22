const storageKeys = require('../constants/storage.js')
const i18n = require('../utils/i18n.js')

const DATA_SOURCE_MODES = {
  remote: 'remote',
  mock: 'mock'
}

function getDataSourceMode() {
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
  const nextMode = mode === DATA_SOURCE_MODES.mock ? DATA_SOURCE_MODES.mock : DATA_SOURCE_MODES.remote
  try {
    wx.setStorageSync(storageKeys.dataSourceMode, nextMode)
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
  getDataSourceMode,
  setDataSourceMode,
  toggleDataSourceMode,
  isMockMode,
  getDataSourceLabel
}
