/**
 * 防抖工具：防止按钮重复提交。
 *
 * 用法一：在 Page 的 tap handler 中调用
 *   const { guardSubmit } = require('../../utils/debounce.js')
 *
 *   Page({
 *     submitComment: guardSubmit(function () {
 *       // 你的提交逻辑（返回 Promise）
 *       return communityApi.submitComment(this.data.commentText)
 *         .then(res => { ... })
 *     })
 *   })
 *
 * 用法二：手动检查
 *   const { createSubmitGuard } = require('../../utils/debounce.js')
 *   const guard = createSubmitGuard()
 *
 *   Page({
 *     submitComment() {
 *       if (!guard.acquire()) return
 *       doSomethingAsync().finally(() => guard.release())
 *     }
 *   })
 */

/**
 * 创建一个提交锁。acquire() 返回 true 时表示可以提交，返回 false 表示正在提交中。
 * @param {number} [cooldownMs=1000] 最小冷却时间（毫秒），即使 Promise 秒完也至少等这么久
 */
function createSubmitGuard(cooldownMs) {
  cooldownMs = cooldownMs || 1000
  var submitting = false
  return {
    acquire: function () {
      if (submitting) return false
      submitting = true
      return true
    },
    release: function () {
      setTimeout(function () {
        submitting = false
      }, cooldownMs)
    },
    isSubmitting: function () {
      return submitting
    }
  }
}

/**
 * 高阶函数：包装一个返回 Promise 的 handler，使其在执行期间不可重入。
 * @param {Function} fn  被包装的函数，this 指向 Page 实例，应返回 Promise
 * @param {number} [cooldownMs=1000] 冷却时间
 * @returns {Function} 可直接赋值给 Page method 的 tap handler
 */
function guardSubmit(fn, cooldownMs) {
  var guard = createSubmitGuard(cooldownMs)
  return function () {
    if (!guard.acquire()) return
    var self = this
    var args = arguments
    try {
      var result = fn.apply(self, args)
      if (result && typeof result.then === 'function') {
        result.finally(function () {
          guard.release()
        })
      } else {
        guard.release()
      }
    } catch (e) {
      guard.release()
      throw e
    }
  }
}

module.exports = {
  createSubmitGuard: createSubmitGuard,
  guardSubmit: guardSubmit
}
