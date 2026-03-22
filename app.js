if (!Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const PromiseConstructor = this.constructor
    return this.then(
      function(value) {
        return PromiseConstructor.resolve(callback()).then(function() {
          return value
        })
      },
      function(reason) {
        return PromiseConstructor.resolve(callback()).then(function() {
          throw reason
        })
      }
    )
  }
}

if (!Promise.allSettled) {
  Promise.allSettled = function(promises) {
    const list = Array.isArray(promises) ? promises : []
    return Promise.all(list.map(function(item) {
      return Promise.resolve(item).then(function(value) {
        return {
          status: 'fulfilled',
          value: value
        }
      }).catch(function(reason) {
        return {
          status: 'rejected',
          reason: reason
        }
      })
    }))
  }
}

if (!String.prototype.padStart) {
  String.prototype.padStart = function(targetLength, padString) {
    const source = String(this)
    const length = Number(targetLength) || 0
    const padding = String(padString === undefined ? ' ' : padString)

    if (source.length >= length || !padding) {
      return source
    }

    let prefix = ''
    while (prefix.length + source.length < length) {
      prefix += padding
    }

    return prefix.slice(0, length - source.length) + source
  }
}

var i18n = require('./utils/i18n')
var themeUtil = require('./utils/theme')

App({
  onLaunch: function () {
    // Restore locale from storage so all pages pick it up
    var savedLocale = i18n.getCurrentLocale()
    this.globalData.locale = savedLocale

    // Restore theme and font settings
    this.globalData.theme = themeUtil.getEffectiveTheme()
    this.globalData.fontScaleStep = themeUtil.getFontScaleStep()
    themeUtil.initThemeListener()
  },
  globalData: {
    userInfo: null,
    locale: 'zh-CN',
    theme: 'light',
    fontScaleStep: 1
  }
})
