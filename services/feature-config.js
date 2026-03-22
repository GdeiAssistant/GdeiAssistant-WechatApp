const storageKeys = require('../constants/storage.js')
const { FEATURE_DEFS, getFeatureList, getFeatureSections, getFeatureMap, getDefaultFeatureVisibility } = require('../constants/features.js')

function normalizeFeatureVisibility(rawValue) {
  const defaults = getDefaultFeatureVisibility()
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return defaults
  }

  FEATURE_DEFS.forEach(function(def) {
    if (typeof rawValue[def.id] === 'boolean') {
      defaults[def.id] = rawValue[def.id]
    }
  })

  return defaults
}

function getFeatureVisibility() {
  try {
    return normalizeFeatureVisibility(wx.getStorageSync(storageKeys.featureVisibility))
  } catch (error) {
    return getDefaultFeatureVisibility()
  }
}

function saveFeatureVisibility(featureVisibility) {
  const normalizedValue = normalizeFeatureVisibility(featureVisibility)
  try {
    wx.setStorageSync(storageKeys.featureVisibility, normalizedValue)
  } catch (error) {
    // Ignore feature visibility storage write failures.
  }
  return normalizedValue
}

function setFeatureVisible(featureId, visible) {
  const featureVisibility = getFeatureVisibility()
  const featureMap = getFeatureMap()
  if (featureMap[featureId]) {
    featureVisibility[featureId] = !!visible
  }
  return saveFeatureVisibility(featureVisibility)
}

function getHomeSections() {
  const featureVisibility = getFeatureVisibility()
  const featureMap = getFeatureMap()

  return getFeatureSections().map(function(section) {
    return {
      id: section.id,
      title: section.title,
      features: section.featureIds
        .filter(function(featureId) {
          return featureVisibility[featureId] !== false
        })
        .map(function(featureId) {
          return featureMap[featureId]
        })
    }
  }).filter(function(section) {
    return section.features.length > 0
  })
}

module.exports = {
  getFeatureVisibility,
  saveFeatureVisibility,
  setFeatureVisible,
  getHomeSections
}
