const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { clearModule, stubModule } = require('./helpers/module.js')

const ROOT = path.resolve(__dirname, '..')
const UPLOAD_MODULE = path.join(ROOT, 'services/upload.js')
const DATA_SOURCE_MODULE = path.join(ROOT, 'services/data-source.js')
const UPLOAD_API_MODULE = path.join(ROOT, 'services/apis/upload.js')

function setup(options = {}) {
  const captured = {
    presigned: [],
    uploads: []
  }

  global.getApp = function () {
    return { globalData: { locale: 'zh-CN' } }
  }

  global.wx = {
    getFileSystemManager: function () {
      return {
        readFile: function (args) {
          if (options.readFileError) {
            args.fail(new Error('read failed'))
            return
          }
          args.success({ data: Buffer.from(options.fileBytes || 'file-bytes') })
        }
      }
    },
    request: function (args) {
      captured.uploads.push(args)
      if (options.uploadStatusCode && options.uploadStatusCode >= 300) {
        args.success({ statusCode: options.uploadStatusCode })
        return
      }
      args.success({ statusCode: options.uploadStatusCode || 200 })
    }
  }

  stubModule(DATA_SOURCE_MODULE, {
    isMockMode: function () {
      return !!options.mockMode
    }
  })
  stubModule(UPLOAD_API_MODULE, {
    getPresignedUploadUrl: function (fileName, contentType) {
      captured.presigned.push({ fileName, contentType })
      if (options.missingPresignedUrl) {
        return Promise.resolve({ data: {} })
      }
      return Promise.resolve({
        data: {
          url: 'https://upload.example.com/object',
          objectKey: options.objectKey || 'uploads/test-object'
        }
      })
    }
  })

  clearModule(UPLOAD_MODULE)
  return {
    captured,
    upload: require(UPLOAD_MODULE)
  }
}

test('uploadLocalFileByPresignedUrl returns local path directly in mock mode', async function () {
  const { captured, upload } = setup({ mockMode: true })
  const file = { path: '/tmp/mock.png', name: 'mock.png', type: 'image/png' }

  const result = await upload.uploadLocalFileByPresignedUrl(file)

  assert.equal(result, '/tmp/mock.png')
  assert.equal(captured.presigned.length, 0)
  assert.equal(captured.uploads.length, 0)
})

test('uploadLocalFileByPresignedUrl uploads buffer with inferred metadata', async function () {
  const { captured, upload } = setup({ objectKey: 'secret/voice/1.mp3' })
  const file = { path: '/tmp/voice.mp3' }

  const result = await upload.uploadLocalFileByPresignedUrl(file)

  assert.equal(result, 'secret/voice/1.mp3')
  assert.deepEqual(captured.presigned[0], {
    fileName: 'voice.mp3',
    contentType: 'audio/mpeg'
  })
  assert.equal(captured.uploads.length, 1)
  assert.equal(captured.uploads[0].method, 'PUT')
  assert.equal(captured.uploads[0].header['Content-Type'], 'audio/mpeg')
  assert.ok(Buffer.isBuffer(captured.uploads[0].data))
})

test('uploadLocalFileByPresignedUrl rejects when file is missing or presigned payload is incomplete', async function () {
  const { upload } = setup()
  await assert.rejects(upload.uploadLocalFileByPresignedUrl(null), {
    message: '缺少待上传文件'
  })

  const missingPresigned = setup({ missingPresignedUrl: true }).upload
  await assert.rejects(missingPresigned.uploadLocalFileByPresignedUrl({ path: '/tmp/demo.png' }), {
    message: '未获取到上传地址'
  })
})

test('resolveContentType infers types from explicit mime and file extension', function () {
  const { upload } = setup()

  assert.equal(upload.resolveContentType({ type: 'image/webp' }), 'image/webp')
  assert.equal(upload.resolveContentType({ path: '/tmp/demo.JPG' }), 'image/jpeg')
  assert.equal(upload.resolveContentType({ path: '/tmp/demo.unknown' }), 'application/octet-stream')
})
