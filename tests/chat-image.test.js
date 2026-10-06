const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const crypto = require('node:crypto')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const STORAGE_KEYS = require(path.join(ROOT, 'constants/storage.js'))
const MOCK_MODULE = path.join(ROOT, 'mock/index.js')
const SOCIAL_DATA = path.join(ROOT, 'mock/social-data.js')
const CHAT_PAGE = path.join(ROOT, 'pages/chat/chat.js')
const SOCIAL_API = path.join(ROOT, 'services/apis/social.js')
const CHAT_IMAGE = path.join(ROOT, 'services/social-chat-image.js')
const SOCIAL_AVATAR = path.join(ROOT, 'services/social-avatar.js')
const AUTH_MODULE = path.join(ROOT, 'services/auth.js')
const REQUEST_MODULE = path.join(ROOT, 'services/request.js')
const DATA_SOURCE = path.join(ROOT, 'services/data-source.js')
const REALTIME = path.join(ROOT, 'services/social-realtime.js')
const CONFIG_MODULE = path.join(ROOT, 'config/index.js')
const USER_API_MODULE = path.join(ROOT, 'services/apis/user.js')
const PROFILE_MODULE = path.join(ROOT, 'constants/profile.js')
const COMMUNITY_MODULE = path.join(ROOT, 'constants/community.js')
const MOCK_DATA_MODULE = path.join(ROOT, 'mock/mock-data.js')
const I18N_MODULE = path.join(ROOT, 'utils/i18n.js')
const SOCIAL_UTILS = path.join(ROOT, 'utils/social.js')
const ENDPOINTS = path.join(ROOT, 'services/endpoints.js')

const DEMO_IMAGE = '/image/logo.png'
const RESOURCE_DOMAIN = 'https://api.example.com/'

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms)
  })
}

function setupRuntime() {
  const storage = {}
  const files = new Map([[DEMO_IMAGE, fs.readFileSync(path.join(ROOT, DEMO_IMAGE))]])
  const unlinked = []
  const imageInfo = {}
  const fileSystem = {
    getFileInfo(opts) {
      const bytes = files.get(opts.filePath)
      if (!bytes) return opts.fail(new Error('missing file'))
      opts.success({ size: bytes.length })
    },
    copyFile(opts) {
      const bytes = files.get(opts.srcPath)
      if (!bytes) return opts.fail(new Error('missing file'))
      files.set(opts.destPath, Buffer.from(bytes))
      opts.success()
    },
    unlink(opts) {
      unlinked.push(opts.filePath)
      files.delete(opts.filePath)
      if (opts.success) opts.success()
    }
  }

  global.wx = {
    env: { USER_DATA_PATH: 'wxfile://user' },
    getFileSystemManager() {
      return fileSystem
    },
    getFileInfo(opts) {
      const bytes = files.get(opts.filePath)
      if (!bytes) return opts.fail(new Error('missing file'))
      opts.success({
        size: bytes.length,
        digest: crypto.createHash(opts.digestAlgorithm).update(bytes).digest('hex')
      })
    },
    getImageInfo(opts) {
      const bytes = files.get(opts.src)
      if (!bytes) return opts.fail(new Error('missing file'))
      const info = imageInfo[opts.src] || {
        type: bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
          ? 'png'
          : 'unknown',
        width: bytes.length >= 24 ? bytes.readUInt32BE(16) : 0,
        height: bytes.length >= 24 ? bytes.readUInt32BE(20) : 0
      }
      opts.success(info)
    },
    getStorageSync(key) {
      return storage[key]
    },
    setStorageSync(key, value) {
      storage[key] = value
    },
    removeStorageSync(key) {
      delete storage[key]
    },
    showNavigationBarLoading() {},
    hideNavigationBarLoading() {},
    showLoading() {},
    hideLoading() {},
    showModal() {},
    reLaunch() {},
    setNavigationBarTitle() {},
    previewImage() {},
    connectSocket() {
      throw new Error('chat image tests use mock mode')
    },
    chooseMedia(opts) {
      if (opts && opts.success) {
        opts.success({
          tempFiles: [
            {
              tempFilePath: DEMO_IMAGE,
              size: 2048,
              fileType: 'image'
            }
          ]
        })
      }
    },
    downloadFile() {}
  }
  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }

  stubModule(DATA_SOURCE, {
    DATA_SOURCE_MODES: { remote: 'remote', mock: 'mock' },
    isMockMode() {
      return true
    },
    canUseDemoMode() {
      return true
    }
  })
  stubModule(CONFIG_MODULE, { resourceDomain: RESOURCE_DOMAIN, requestTimeout: 15000 })
  stubModule(USER_API_MODULE, {
    getProfileOptions() {
      return Promise.resolve({ success: true, data: {} })
    }
  })
  clearModule(I18N_MODULE)
  clearModule(COMMUNITY_MODULE)
  clearModule(PROFILE_MODULE)
  clearModule(MOCK_DATA_MODULE)
  clearModule(MOCK_MODULE)
  clearModule(AUTH_MODULE)
  clearModule(REQUEST_MODULE)
  clearModule(SOCIAL_API)
  clearModule(CHAT_IMAGE)
  clearModule(REALTIME)
  clearModule(SOCIAL_UTILS)

  const mock = require(MOCK_MODULE)
  const socialApi = require(SOCIAL_API)

  return {
    storage: storage,
    files: files,
    unlinked: unlinked,
    fileSystem: fileSystem,
    imageInfo: imageInfo,
    mock: mock,
    socialApi: socialApi
  }
}

async function login(mock, storage) {
  const mockConstants = require(path.join(ROOT, 'constants/mock.js'))
  const result = await mock.handleRequest({
    method: 'POST',
    path: '/api/auth/login',
    data: {
      username: mockConstants.MOCK_ACCOUNT_USERNAME,
      password: mockConstants.MOCK_ACCOUNT_PASSWORD
    }
  })
  assert.equal(result.success, true)
  storage[STORAGE_KEYS.sessionToken] = result.data.token
  storage[STORAGE_KEYS.dataSourceMode] = 'mock'
  return result.data.token
}

function loadChatPage() {
  let captured = null
  global.Page = function (config) {
    captured = config
  }
  clearModule(CHAT_PAGE)
  require(CHAT_PAGE)
  assert.ok(captured)
  return captured
}

function createPageInstance(pageConfig) {
  const instance = Object.create(pageConfig)
  instance.data = JSON.parse(JSON.stringify(pageConfig.data || {}))
  instance.setData = function (patch) {
    Object.assign(instance.data, patch)
  }
  instance._pageVisible = true
  instance._pageEpoch = 1
  return instance
}

test('social endpoints cover image message paths', function () {
  clearModule(ENDPOINTS)
  const endpoints = require(ENDPOINTS)
  assert.equal(
    endpoints.social.messageImage('9001'),
    '/api/social/conversations/9001/messages/image'
  )
  assert.equal(
    endpoints.social.messageImageContent('9001', '10003'),
    '/api/social/conversations/9001/messages/10003/image'
  )
})

test('chat page chooseMedia preview send IMAGE dedupes and privacy retry keeps clientMessageId', async function () {
  const env = setupRuntime()
  const socialData = require(SOCIAL_DATA)
  const token = await login(env.mock, env.storage)

  const conversation = await env.mock.handleRequest({
    method: 'POST',
    path: '/api/social/conversations',
    sessionToken: token,
    data: { peerId: socialData.PEER_A_ID }
  })
  assert.equal(conversation.success, true)
  assert.equal(conversation.data.imageMessagingEnabled, true)
  const conversationId = conversation.data.id
  const clientMessageId = 'c0ffeeee-img1-4000-8000-image00000001'

  const pageConfig = loadChatPage()
  const page = createPageInstance(pageConfig)
  page.setData({
    conversationId: String(conversationId),
    selfId: socialData.SELF_PUBLIC_ID,
    canSend: true,
    imageMessagingEnabled: true,
    sending: false,
    messages: []
  })

  await page.chooseImage()
  const cancelledPath = page.data.imageDraftPath
  assert.ok(cancelledPath.startsWith('wxfile://user/gdei-chat-image-'))
  assert.deepEqual(env.files.get(cancelledPath), env.files.get(DEMO_IMAGE))
  page.cancelImageDraft()
  assert.equal(page.data.imageDraftPath, '')
  assert.ok(env.unlinked.includes(cancelledPath))
  assert.ok(env.files.has(DEMO_IMAGE))

  await page.chooseImage()
  await page.sendImageWithClientId(clientMessageId, page.data.imageDraftPath)

  assert.equal(page.data.sending, false)
  const sent = page.data.messages.filter(function (item) {
    return item.clientMessageId === clientMessageId
  })[0]
  assert.ok(sent)
  assert.equal(sent.type, 'IMAGE')
  assert.equal(sent.status, 'sent')
  assert.ok(sent.id)
  assert.ok(sent.displayPath)
  assert.equal(String(sent.displayPath).indexOf('/api/social/'), -1)
  assert.equal(sent.displayPath, DEMO_IMAGE)
  const committedId = sent.id

  const retry = await env.socialApi.sendImageMessage(conversationId, clientMessageId, DEMO_IMAGE)
  assert.equal(retry.success, true)
  assert.equal(retry.data.id, committedId)
  assert.equal(retry.data.type, 'IMAGE')

  const mockState = global.wx.getStorageSync(STORAGE_KEYS.mockState)
  mockState.social.users.forEach(function (user) {
    if (user.id === socialData.PEER_A_ID) {
      user.dmPolicy = 'NONE'
    }
  })
  global.wx.setStorageSync(STORAGE_KEYS.mockState, mockState)

  page.setData({
    canSend: false,
    messages: [
      page.decorateMessage(
        {
          conversationId: String(conversationId),
          senderId: socialData.SELF_PUBLIC_ID,
          clientMessageId: clientMessageId,
          type: 'IMAGE',
          localPath: DEMO_IMAGE,
          displayPath: DEMO_IMAGE,
          status: 'failed',
          mine: true
        },
        socialData.SELF_PUBLIC_ID
      )
    ]
  })
  page.retryMessage({ currentTarget: { dataset: { clientId: clientMessageId } } })
  await wait(400)
  const recovered = page.data.messages.filter(function (item) {
    return item.clientMessageId === clientMessageId
  })[0]
  assert.equal(recovered.status, 'sent')
  assert.equal(recovered.id, committedId)

  await assert.rejects(
    env.socialApi.sendImageMessage(
      conversationId,
      'c0ffeeee-img2-4000-8000-image00000002',
      DEMO_IMAGE
    ),
    function (error) {
      return error.errorCode === 'PRIVACY_RESTRICTED'
    }
  )
})

test('chat image auth download attaches bearer only for same-origin path and clears on logout', async function () {
  const storage = {}
  storage[STORAGE_KEYS.sessionToken] = 'token-chat-img'
  const downloads = []
  const unlinked = []
  global.wx = {
    getFileSystemManager() {
      return {
        unlink(opts) {
          unlinked.push(opts.filePath)
        }
      }
    },
    getStorageSync(key) {
      return storage[key]
    },
    setStorageSync(key, value) {
      storage[key] = value
    },
    removeStorageSync(key) {
      delete storage[key]
    },
    downloadFile(opts) {
      downloads.push({
        url: opts && opts.url,
        header: Object.assign({}, (opts && opts.header) || {})
      })
      if (opts && opts.success) {
        opts.success({ statusCode: 200, tempFilePath: 'wxfile://chat-img' })
      }
    },
    showModal() {},
    reLaunch() {}
  }
  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }

  stubModule(CONFIG_MODULE, {
    resourceDomain: RESOURCE_DOMAIN,
    requestTimeout: 15000
  })
  stubModule(DATA_SOURCE, {
    isMockMode() {
      return false
    }
  })
  clearModule(AUTH_MODULE)
  clearModule(CHAT_IMAGE)
  const auth = require(AUTH_MODULE)
  const socialChatImage = require(CHAT_IMAGE)

  const apiPath = socialChatImage.imageApiPath('9001', '10003')
  assert.ok(socialChatImage.isChatImagePath(apiPath))
  const absolute = socialChatImage.buildAbsoluteUrl(apiPath)
  assert.equal(socialChatImage.shouldAttachBearer(absolute), true)
  assert.equal(socialChatImage.shouldAttachBearer('https://cdn.example.net/x.png'), false)
  assert.equal(socialChatImage.shouldAttachBearer('https://api.example.com:8443' + apiPath), false)
  ;[
    absolute + '?view=1',
    absolute + '?',
    absolute + '#preview',
    absolute + '#',
    absolute.replace('/9001/', '/someone/'),
    absolute.replace('/10003/', '/10003%2Fsecret/'),
    'https://attacker@api.example.com' + apiPath,
    'https://api.example.com.evil.test' + apiPath
  ].forEach(function (url) {
    assert.equal(socialChatImage.shouldAttachBearer(url), false, url)
  })
  assert.equal(socialChatImage.imageApiPath('someone', '10003'), '')

  const display = await socialChatImage.resolveMessageImage({
    id: '10003',
    conversationId: '9001',
    type: 'IMAGE'
  })
  assert.equal(display, 'wxfile://chat-img')
  assert.equal(downloads.length, 1)
  assert.equal(downloads[0].header.Authorization, 'Bearer token-chat-img')
  assert.equal(String(downloads[0].url).indexOf('token='), -1)

  auth.clearSession()
  assert.deepEqual(unlinked, ['wxfile://chat-img'])
  const afterLogout = await socialChatImage.resolveMessageImage({
    id: '10003',
    conversationId: '9001',
    type: 'IMAGE',
    displayPath: 'wxfile://chat-img',
    localPath: 'wxfile://chat-img'
  })
  assert.equal(afterLogout, '')
  const attached = await socialChatImage.attachDisplayPaths([
    {
      type: 'IMAGE',
      localPath: 'wxfile://chat-img',
      status: 'failed'
    }
  ])
  assert.equal(attached[0].displayPath, '')
})

function remoteRuntime() {
  const env = setupRuntime()
  env.storage[STORAGE_KEYS.sessionToken] = 'image-session-a'
  stubModule(DATA_SOURCE, {
    isMockMode() {
      return false
    }
  })
  clearModule(CHAT_IMAGE)
  clearModule(SOCIAL_AVATAR)
  clearModule(REQUEST_MODULE)
  clearModule(SOCIAL_API)
  env.image = require(CHAT_IMAGE)
  env.socialApi = require(SOCIAL_API)
  return env
}

function createRemoteChatPage(env, context) {
  const listeners = {}
  stubModule(REALTIME, {
    ensureConnected() {},
    on(event, handler) {
      listeners[event] = handler
      return function () {
        delete listeners[event]
      }
    }
  })
  wx.setNavigationBarColor = function () {}
  const page = createPageInstance(loadChatPage())
  page._imageSessionToken = env.storage[STORAGE_KEYS.sessionToken]
  page.setData({
    conversationId: '9001',
    selfId: 'self',
    canSend: true,
    imageMessagingEnabled: true
  })
  page.refreshI18n()
  context.after(function () {
    page.onUnload()
    if (page.__topTipsTimer) clearTimeout(page.__topTipsTimer)
  })
  return page
}

function remoteImageDto(clientMessageId) {
  return {
    id: '10003',
    conversationId: '9001',
    senderId: 'self',
    clientMessageId: clientMessageId,
    seq: '1',
    type: 'IMAGE',
    content: '',
    image: {
      url: 'https://untrusted.example/private.png',
      width: 120,
      height: 120,
      size: 25870,
      contentType: 'image/png'
    }
  }
}

test('remote page selection sends multipart, parses JSON string and previews authenticated download', async function (context) {
  const env = remoteRuntime()
  const uploads = []
  const downloads = []
  const previews = []
  wx.uploadFile = function (opts) {
    uploads.push(opts)
  }
  wx.downloadFile = function (opts) {
    downloads.push(opts)
    env.files.set('wxfile://authenticated-photo', Buffer.from(env.files.get(DEMO_IMAGE)))
    opts.success({ statusCode: 200, tempFilePath: 'wxfile://authenticated-photo' })
  }
  wx.previewImage = function (opts) {
    previews.push(opts)
  }
  const page = createRemoteChatPage(env, context)
  await page.chooseImage()
  const originalCopy = page.data.imageDraftPath
  const originalBytes = Buffer.from(env.files.get(originalCopy))
  page.confirmImageDraft()
  await wait(0)
  assert.equal(uploads.length, 1)
  const upload = uploads[0]
  assert.equal(upload.url, RESOURCE_DOMAIN + 'api/social/conversations/9001/messages/image')
  assert.equal(upload.name, 'image')
  assert.equal(upload.filePath, originalCopy)
  assert.equal(upload.header.Authorization, 'Bearer image-session-a')
  assert.equal(upload.header['Content-Type'], undefined, 'wx generates the multipart boundary')
  assert.match(upload.formData.clientMessageId, /^[0-9a-f-]{36}$/i)
  assert.deepEqual(env.files.get(upload.filePath), originalBytes)
  upload.success({
    statusCode: 200,
    data: JSON.stringify({ success: true, data: remoteImageDto(upload.formData.clientMessageId) })
  })
  await wait(0)
  assert.equal(page.data.sending, false)
  assert.equal(page.data.messages.length, 1)
  const sent = page.data.messages[0]
  assert.equal(sent.id, '10003')
  assert.equal(sent.status, 'sent')
  assert.equal(sent.displayPath, 'wxfile://authenticated-photo')
  assert.equal(downloads.length, 1)
  assert.equal(
    downloads[0].url,
    RESOURCE_DOMAIN + 'api/social/conversations/9001/messages/10003/image'
  )
  assert.equal(downloads[0].header.Authorization, 'Bearer image-session-a')
  await page.onImageTap({
    currentTarget: { dataset: { localKey: sent.localKey, clientId: sent.clientMessageId } }
  })
  assert.deepEqual(previews, [{ current: sent.displayPath, urls: [sent.displayPath] }])
  page.onUnload()
  assert.ok(env.unlinked.includes(originalCopy))
  assert.ok(env.unlinked.includes(sent.displayPath))
  assert.ok(env.files.has(DEMO_IMAGE))
})

test('remote upload malformed JSON preserves original bytes and client id for a privacy-tightened retry', async function (context) {
  const env = remoteRuntime()
  const uploads = []
  wx.uploadFile = function (opts) {
    uploads.push(opts)
  }
  wx.downloadFile = function (opts) {
    opts.success({ statusCode: 200, tempFilePath: 'wxfile://retried-image' })
  }
  const page = createRemoteChatPage(env, context)
  await page.chooseImage()
  const copy = page.data.imageDraftPath
  page.confirmImageDraft()
  await wait(0)
  const clientId = uploads[0].formData.clientMessageId
  uploads[0].success({ statusCode: 200, data: '<html>bad proxy response</html>' })
  await wait(0)
  assert.equal(page.data.sending, false)
  assert.equal(page.data.messages[0].status, 'failed')
  assert.equal(page.data.messages[0].localPath, copy)
  assert.ok(page.data.errorMessage)
  page.setData({ canSend: false })
  page.retryMessage({ currentTarget: { dataset: { clientId: clientId } } })
  await wait(0)
  assert.equal(uploads.length, 2)
  assert.equal(uploads[1].formData.clientMessageId, clientId)
  assert.equal(uploads[1].filePath, copy)
  assert.deepEqual(env.files.get(copy), env.files.get(DEMO_IMAGE))
  uploads[1].success({
    statusCode: 200,
    data: JSON.stringify({ success: true, data: remoteImageDto(clientId) })
  })
  await wait(0)
  assert.equal(page.data.messages.length, 1)
  assert.equal(page.data.messages[0].status, 'sent')
  assert.equal(page.data.messages[0].id, '10003')
})

test('background image upload is confirmed by foreground REST without reupload after privacy changes', async function (context) {
  const env = remoteRuntime()
  const uploads = []
  const requests = []
  let committed
  wx.uploadFile = function (opts) {
    uploads.push(opts)
  }
  wx.downloadFile = function (opts) {
    if (opts.url.endsWith('/messages/10003/image')) {
      opts.success({ statusCode: 200, tempFilePath: 'wxfile://confirmed-image' })
    } else opts.success({ statusCode: 404 })
  }
  wx.request = function (opts) {
    requests.push(opts)
    const isMessages = opts.url.includes('/messages')
    opts.success({
      statusCode: 200,
      data: {
        success: true,
        data: isMessages
          ? { items: [committed], hasMore: false, nextCursor: null }
          : {
              id: '9001',
              canSend: false,
              sendPermissionReason: 'PRIVACY_RESTRICTED',
              imageMessagingEnabled: true,
              peer: { id: 'peer', nickname: '测试用户' }
            }
      }
    })
  }
  const page = createRemoteChatPage(env, context)
  await page.chooseImage()
  const copy = page.data.imageDraftPath
  page.confirmImageDraft()
  await wait(0)
  assert.equal(page.data.messages[0].status, 'pending')
  const clientId = uploads[0].formData.clientMessageId
  page.onHide()
  assert.equal(page.data.messages[0].status, 'failed')
  assert.equal(page.data.messages[0].clientMessageId, clientId)
  assert.ok(env.files.has(copy))
  committed = remoteImageDto(clientId)
  uploads[0].success({ statusCode: 200, data: JSON.stringify({ success: true, data: committed }) })
  await wait(0)
  assert.equal(page.data.messages[0].id, undefined, 'hidden page ignores the upload callback')
  const originalPull = page.pullNewer
  let foregroundSync
  page.pullNewer = function () {
    foregroundSync = originalPull.call(this)
    return foregroundSync
  }
  page.onShow()
  await foregroundSync
  assert.equal(page.data.canSend, false)
  assert.equal(page.data.sending, false)
  assert.equal(page.data.messages.length, 1)
  assert.equal(page.data.messages[0].id, '10003')
  assert.equal(page.data.messages[0].status, 'sent')
  assert.equal(page.data.messages[0].clientMessageId, clientId)
  assert.equal(page.data.messages[0].displayPath, 'wxfile://confirmed-image')
  assert.equal(uploads.length, 1, 'foreground confirmation uses REST rather than a new send')
  assert.equal(requests.length, 2)
  assert.ok(
    requests.every(function (request) {
      return request.header.Authorization === 'Bearer image-session-a'
    })
  )
})

test('picker cancellation or an empty result preserves the current draft and cannot send a new image', async function (context) {
  const env = remoteRuntime()
  const page = createRemoteChatPage(env, context)
  await page.chooseImage()
  const copy = page.data.imageDraftPath
  let pickerCalls = 0
  let uploadCalls = 0
  wx.uploadFile = function () {
    uploadCalls += 1
  }
  wx.chooseMedia = function (opts) {
    pickerCalls += 1
    opts.fail({ errMsg: 'chooseMedia:fail cancel' })
  }
  await page.chooseImage()
  assert.equal(page.data.imageDraftPath, copy)
  wx.chooseMedia = function (opts) {
    pickerCalls += 1
    opts.success({ tempFiles: [] })
  }
  await page.chooseImage()
  assert.equal(page.data.imageDraftPath, copy)
  assert.equal(env.unlinked.length, 0)
  page.setData({ imageMessagingEnabled: false })
  await page.chooseImage()
  assert.equal(pickerCalls, 2)
  page.setData({ canSend: false })
  page.confirmImageDraft()
  assert.equal(uploadCalls, 0)
  assert.ok(env.files.has(copy))
})

test('unloaded chat cannot start a private download from a late history response', async function (context) {
  const env = remoteRuntime()
  const page = createRemoteChatPage(env, context)
  let request
  let downloadCalls = 0
  wx.request = function (opts) {
    request = opts
  }
  wx.downloadFile = function (opts) {
    downloadCalls += 1
    env.files.set('wxfile://late-history-image', Buffer.from(env.files.get(DEMO_IMAGE)))
    opts.success({ statusCode: 200, tempFilePath: 'wxfile://late-history-image' })
  }
  await page.chooseImage()
  const ownedDraft = page.data.imageDraftPath
  page.setData({ hasMoreEarlier: true, earlierCursor: '2' })
  page.loadEarlier()
  await wait(0)
  assert.ok(request)
  page.onUnload()
  assert.ok(env.unlinked.includes(ownedDraft))
  assert.equal(env.files.has(ownedDraft), false)
  const unloadedState = JSON.stringify(page.data)
  request.success({
    statusCode: 200,
    data: {
      success: true,
      data: { items: [remoteImageDto('older-client')], hasMore: false, nextCursor: null }
    }
  })
  await wait(0)
  assert.equal(downloadCalls, 0, 'a removed page must not recreate private files after cleanup')
  assert.equal(env.files.has('wxfile://late-history-image'), false)
  assert.equal(env.files.size, 1, 'only the original demo image remains')
  assert.equal(page.data.messages.length, 0)
  assert.equal(JSON.stringify(page.data), unloadedState)
})

test('late image downloads remove private files after token change or cache clear', async function () {
  const env = remoteRuntime()
  const callbacks = []
  wx.downloadFile = function (opts) {
    callbacks.push(opts)
  }
  const message = { id: '10003', conversationId: '9001', type: 'IMAGE' }
  const pending = env.image.resolveMessageImage(message)
  env.storage[STORAGE_KEYS.sessionToken] = 'image-session-b'
  callbacks[0].success({ statusCode: 200, tempFilePath: 'wxfile://late-a' })
  assert.equal(await pending, '')
  assert.ok(env.unlinked.includes('wxfile://late-a'))

  const next = env.image.resolveMessageImage(
    Object.assign({}, message, {
      displayPath: 'wxfile://previous-account'
    })
  )
  assert.equal(callbacks.length, 2, 'displayPath cannot bypass current-session download')
  assert.equal(callbacks[1].header.Authorization, 'Bearer image-session-b')
  env.image.clearCache()
  callbacks[1].success({ statusCode: 200, tempFilePath: 'wxfile://late-b' })
  assert.equal(await next, '')
  assert.ok(env.unlinked.includes('wxfile://late-b'))
  env.image.releaseFile(DEMO_IMAGE)
  assert.ok(env.files.has(DEMO_IMAGE), 'never delete an unowned original image')
})

test('invalid image responses also unlink their downloaded temp file', async function () {
  const env = remoteRuntime()
  wx.downloadFile = function (opts) {
    opts.success({ statusCode: 403, tempFilePath: 'wxfile://denied-image' })
  }
  assert.equal(await env.image.resolveMessageImage({ id: '1', conversationId: '2' }), '')
  assert.deepEqual(env.unlinked, ['wxfile://denied-image'])
})

test('selected images validate actual type, dimensions, pixels and file size before copying', async function () {
  const env = setupRuntime()
  env.storage[STORAGE_KEYS.sessionToken] = 'image-session'
  const image = require(CHAT_IMAGE)
  for (const info of [
    { type: 'webp', width: 120, height: 120, expected: 'imageTypeInvalid' },
    { type: 'png', width: 4097, height: 1, expected: 'imageTooLarge' },
    { type: 'png', width: 4001, height: 4000, expected: 'imageTooLarge' },
    { type: 'png', width: 0, height: 120, expected: 'imageTooLarge' }
  ]) {
    env.imageInfo[DEMO_IMAGE] = info
    await assert.rejects(image.prepareImage(DEMO_IMAGE, 'image-session'), function (error) {
      return error.imageError === info.expected
    })
  }
  env.imageInfo[DEMO_IMAGE] = { type: 'png', width: 4000, height: 4000 }
  env.fileSystem.getFileInfo = function (opts) {
    opts.success({ size: 5 * 1024 * 1024 + 1 })
  }
  await assert.rejects(image.prepareImage(DEMO_IMAGE, 'image-session'), function (error) {
    return error.imageError === 'imageTooLarge'
  })
  assert.equal(env.files.size, 1, 'invalid images never create owned copies')
  env.fileSystem.getFileInfo = function (opts) {
    opts.success({ size: 5 * 1024 * 1024 })
  }
  const copy = await image.prepareImage(DEMO_IMAGE, 'image-session')
  const originalBytes = Buffer.from(env.files.get(copy))
  env.files.set(DEMO_IMAGE, Buffer.from('album contents changed'))
  assert.deepEqual(
    env.files.get(copy),
    originalBytes,
    'retry copy keeps the selected original bytes'
  )
  image.clearCache()
  assert.ok(env.unlinked.includes(copy))
  assert.ok(env.files.has(DEMO_IMAGE))
})

test('native picker hide preserves valid selection and page unload rejects its late callback', async function () {
  const env = setupRuntime()
  env.storage[STORAGE_KEYS.sessionToken] = 'image-session'
  const page = createPageInstance(loadChatPage())
  page.setData({ canSend: true, imageMessagingEnabled: true })
  const callbacks = []
  wx.chooseMedia = function (opts) {
    callbacks.push(opts)
  }
  const selection = page.chooseImage()
  page.onHide()
  callbacks[0].success({ tempFiles: [{ tempFilePath: DEMO_IMAGE, size: 1 }] })
  await selection
  const copy = page.data.imageDraftPath
  assert.ok(copy.startsWith('wxfile://user/gdei-chat-image-'))
  assert.deepEqual(env.files.get(copy), env.files.get(DEMO_IMAGE))
  page._pageVisible = true
  const next = page.chooseImage()
  page.onUnload()
  const snapshot = JSON.stringify(page.data)
  callbacks[1].success({ tempFiles: [{ tempFilePath: DEMO_IMAGE, size: 1 }] })
  await next
  assert.equal(JSON.stringify(page.data), snapshot)
  assert.ok(env.unlinked.includes(copy))
  assert.ok(env.files.has(DEMO_IMAGE))
})

test('failed copy removes its own partial destination and preserves the original', async function () {
  const env = setupRuntime()
  env.storage[STORAGE_KEYS.sessionToken] = 'image-session'
  env.fileSystem.copyFile = function (opts) {
    env.files.set(opts.destPath, Buffer.from('partial image'))
    opts.fail(new Error('copy failed'))
  }
  await assert.rejects(
    require(CHAT_IMAGE).prepareImage(DEMO_IMAGE, 'image-session'),
    function (error) {
      return error.imageError === 'imageReadFailed'
    }
  )
  assert.equal(env.files.size, 1)
  assert.equal(env.unlinked.length, 1)
  assert.ok(env.unlinked[0].startsWith('wxfile://user/gdei-chat-image-'))
  assert.ok(env.files.has(DEMO_IMAGE))
})

test('copy completing after unload or account change deletes only the new owned file', async function () {
  for (const invalidate of ['unload', 'token']) {
    const env = setupRuntime()
    env.storage[STORAGE_KEYS.sessionToken] = 'image-session-a'
    const page = createPageInstance(loadChatPage())
    page.setData({ canSend: true, imageMessagingEnabled: true })
    let copyCallback
    env.fileSystem.copyFile = function (opts) {
      copyCallback = opts
      env.files.set(opts.destPath, Buffer.from(env.files.get(opts.srcPath)))
    }
    const pending = page.chooseImage()
    assert.ok(copyCallback)
    if (invalidate === 'unload') page.onUnload()
    else env.storage[STORAGE_KEYS.sessionToken] = 'image-session-b'
    const snapshot = JSON.stringify(page.data)
    copyCallback.success()
    await pending
    assert.equal(JSON.stringify(page.data), snapshot)
    assert.ok(env.unlinked.includes(copyCallback.destPath))
    assert.ok(env.files.has(DEMO_IMAGE))
  }
})

test('late image send success or failure cannot mutate unloaded or different-account pages', async function () {
  for (const scenario of ['unload-success', 'token-success', 'token-failure']) {
    const env = remoteRuntime()
    let resolveSend
    let rejectSend
    stubModule(SOCIAL_API, {
      sendImageMessage() {
        return new Promise(function (resolve, reject) {
          resolveSend = resolve
          rejectSend = reject
        })
      }
    })
    const page = createPageInstance(loadChatPage())
    page.setData({
      conversationId: '9001',
      selfId: 'self',
      canSend: true,
      imageMessagingEnabled: true
    })
    await page.chooseImage()
    const copy = page.data.imageDraftPath
    const pending = page.sendImageWithClientId('client-image', copy)
    await wait(0)
    if (scenario.startsWith('unload')) page.onUnload()
    else env.storage[STORAGE_KEYS.sessionToken] = 'image-session-b'
    const snapshot = JSON.stringify(page.data)
    if (scenario.endsWith('failure')) rejectSend(new Error('late upload failure'))
    else
      resolveSend({
        success: true,
        data: {
          id: '10003',
          conversationId: '9001',
          senderId: 'self',
          clientMessageId: 'client-image',
          type: 'IMAGE',
          seq: '1'
        }
      })
    await pending
    assert.equal(JSON.stringify(page.data), snapshot)
    assert.ok(env.unlinked.includes(copy))
    assert.ok(env.files.has(DEMO_IMAGE))
  }
})

test('late old-token upload 401 does not clear a newer login', async function () {
  const env = remoteRuntime()
  let upload
  wx.uploadFile = function (opts) {
    upload = opts
  }
  const pending = env.socialApi.sendImageMessage('9001', 'client-image', DEMO_IMAGE)
  await wait(0)
  assert.equal(upload.header.Authorization, 'Bearer image-session-a')
  assert.equal(upload.name, 'image')
  assert.equal(upload.formData.clientMessageId, 'client-image')
  env.storage[STORAGE_KEYS.sessionToken] = 'image-session-b'
  upload.success({ statusCode: 401 })
  await assert.rejects(pending, function (error) {
    return error.errorCode === 'SESSION_CHANGED'
  })
  assert.equal(env.storage[STORAGE_KEYS.sessionToken], 'image-session-b')
})

test('mock image idempotency compares actual bytes across paths and rejects changed bytes or type', async function () {
  const env = setupRuntime()
  const token = await login(env.mock, env.storage)
  const socialData = require(SOCIAL_DATA)
  const conversation = await env.mock.handleRequest({
    method: 'POST',
    path: '/api/social/conversations',
    sessionToken: token,
    data: { peerId: socialData.PEER_A_ID }
  })
  const id = conversation.data.id
  const imageId = 'byte-image-client'
  const first = await env.socialApi.sendImageMessage(id, imageId, DEMO_IMAGE)
  const renamed = 'wxfile://same-image-other-path'
  env.files.set(renamed, Buffer.from(env.files.get(DEMO_IMAGE)))
  const retry = await env.socialApi.sendImageMessage(id, imageId, renamed)
  assert.equal(retry.data.id, first.data.id)
  const state = env.storage[STORAGE_KEYS.mockState]
  const stored = state.social.messages.find(function (message) {
    return message.id === first.data.id
  })
  assert.equal(
    stored.imageFingerprint,
    'sha1:' + crypto.createHash('sha1').update(env.files.get(DEMO_IMAGE)).digest('hex')
  )
  assert.equal(stored.imageSha256, undefined)
  env.files.set(renamed, fs.readFileSync(path.join(ROOT, 'image/default.png')))
  await assert.rejects(env.socialApi.sendImageMessage(id, imageId, renamed), function (error) {
    return error.errorCode === 'CLIENT_MESSAGE_CONFLICT'
  })
  await assert.rejects(env.socialApi.sendMessage(id, imageId, 'different type'), function (error) {
    return error.errorCode === 'CLIENT_MESSAGE_CONFLICT'
  })
  const textId = 'byte-text-client'
  await env.socialApi.sendMessage(id, textId, 'text first')
  await assert.rejects(env.socialApi.sendImageMessage(id, textId, DEMO_IMAGE), function (error) {
    return error.errorCode === 'CLIENT_MESSAGE_CONFLICT'
  })
  const latest = env.storage[STORAGE_KEYS.mockState]
  latest.social.imageMessagingEnabled = false
  env.storage[STORAGE_KEYS.mockState] = latest
  assert.equal(
    (await env.socialApi.sendImageMessage(id, imageId, DEMO_IMAGE)).data.id,
    first.data.id
  )
  await assert.rejects(env.socialApi.sendImageMessage(id, 'disabled-new-image', DEMO_IMAGE))
})

test('messagePreviewText localizes image summaries', function () {
  clearModule(SOCIAL_UTILS)
  const socialUtils = require(SOCIAL_UTILS)
  assert.equal(socialUtils.messagePreviewText({ type: 'IMAGE' }), '[图片]')
  assert.equal(socialUtils.messagePreviewText({ type: 'TEXT', content: 'hello' }), 'hello')
})

test('onImageTap previews the tapped image when senders reuse clientMessageId', async function () {
  const env = setupRuntime()
  await login(env.mock, env.storage)
  const previews = []
  global.wx.previewImage = function (opts) {
    previews.push(opts && opts.current)
  }

  stubModule(CHAT_IMAGE, {
    syncSession() {},
    clearCache() {},
    resolveMessageImage(message) {
      return Promise.resolve((message && (message.previewHint || message.localPath)) || '')
    },
    attachDisplayPaths(messages) {
      return Promise.resolve(messages || [])
    }
  })
  const pageConfig = loadChatPage()
  const page = createPageInstance(pageConfig)
  const sharedClientId = 'shared-client-id'
  const first = page.decorateMessage(
    {
      id: 'img-self',
      conversationId: '9001',
      senderId: 'self',
      clientMessageId: sharedClientId,
      type: 'IMAGE',
      status: 'sent',
      previewHint: 'wxfile://first-image',
      localPath: 'wxfile://first-image'
    },
    'self'
  )
  const second = page.decorateMessage(
    {
      id: 'img-peer',
      conversationId: '9001',
      senderId: 'peer',
      clientMessageId: sharedClientId,
      type: 'IMAGE',
      status: 'sent',
      previewHint: 'wxfile://second-image',
      localPath: 'wxfile://second-image'
    },
    'self'
  )
  page.setData({
    selfId: 'self',
    conversationId: '9001',
    messages: [first, second]
  })
  assert.notEqual(first.localKey, second.localKey)

  await page.onImageTap({
    currentTarget: {
      dataset: { clientId: sharedClientId, localKey: second.localKey }
    }
  })
  assert.deepEqual(previews, ['wxfile://second-image'])

  await page.onImageTap({
    currentTarget: {
      dataset: { clientId: sharedClientId, localKey: 'unknown-local-key' }
    }
  })
  assert.deepEqual(previews, ['wxfile://second-image'])

  let retried = null
  page.sendImageWithClientId = function (clientMessageId, filePath) {
    retried = { clientMessageId: clientMessageId, filePath: filePath }
    return Promise.resolve()
  }
  const failed = page.decorateMessage(
    {
      conversationId: '9001',
      senderId: 'self',
      clientMessageId: 'failed-image-client',
      type: 'IMAGE',
      status: 'failed',
      localPath: DEMO_IMAGE,
      previewHint: DEMO_IMAGE
    },
    'self'
  )
  page.setData({
    canSend: false,
    sending: false,
    messages: [first, second, failed]
  })
  await page.onImageTap({
    currentTarget: {
      dataset: { clientId: failed.clientMessageId, localKey: failed.localKey }
    }
  })
  assert.deepEqual(retried, {
    clientMessageId: 'failed-image-client',
    filePath: DEMO_IMAGE
  })
  assert.deepEqual(previews, ['wxfile://second-image'])
  void env
})
