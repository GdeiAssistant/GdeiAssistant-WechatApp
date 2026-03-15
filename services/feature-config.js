const storageKeys = require('../constants/storage.js')
const { FEATURE_LIST, FEATURE_SECTIONS, FEATURE_MAP, getDefaultFeatureVisibility } = require('../constants/features.js')

function normalizeFeatureVisibility(rawValue) {
  const defaults = getDefaultFeatureVisibility()
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return defaults
  }

  FEATURE_LIST.forEach(function(feature) {
    if (typeof rawValue[feature.id] === 'boolean') {
      defaults[feature.id] = rawValue[feature.id]
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
  if (FEATURE_MAP[featureId]) {
    featureVisibility[featureId] = !!visible
  }
  return saveFeatureVisibility(featureVisibility)
}

function getHomeSections() {
  const featureVisibility = getFeatureVisibility()

  return FEATURE_SECTIONS.map(function(section) {
    return {
      id: section.id,
      title: section.title,
      features: section.featureIds
        .filter(function(featureId) {
          return featureVisibility[featureId] !== false
        })
        .map(function(featureId) {
          return FEATURE_MAP[featureId]
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
