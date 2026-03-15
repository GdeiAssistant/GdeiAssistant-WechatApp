const dataSource = require('./data-source.js')
const uploadApi = require('./apis/upload.js')

function getExtensionByType(contentType) {
  if (!contentType || typeof contentType !== 'string') {
    return ''
  }

  const typeParts = contentType.split('/')
  return typeParts.length === 2 ? `.${typeParts[1]}` : ''
}

function resolveFileName(file, overrideFileName) {
  if (overrideFileName) {
    return overrideFileName
  }

  if (file && file.name) {
    return file.name
  }

  if (file && file.path) {
    return getBaseName(file.path)
  }

  const extension = getExtensionByType(file && file.type)
  return `upload${extension}`
}

function getBaseName(filePath) {
  const normalizedPath = String(filePath || '').replace(/[?#].*$/, '')
  const segments = normalizedPath.split('/')
  return segments[segments.length - 1] || 'upload'
}

function resolveContentType(file) {
  if (file && file.type && String(file.type).indexOf('/') !== -1) {
    return file.type
  }

  const filePath = file && file.path ? file.path.toLowerCase() : ''
  if (/\.jpe?g$/.test(filePath)) {
    return 'image/jpeg'
  }
  if (/\.png$/.test(filePath)) {
    return 'image/png'
  }
  if (/\.gif$/.test(filePath)) {
    return 'image/gif'
  }
  if (/\.webp$/.test(filePath)) {
    return 'image/webp'
  }
  if (/\.m4a$/.test(filePath)) {
    return 'audio/mp4'
  }
  if (/\.mp3$/.test(filePath)) {
    return 'audio/mpeg'
  }
  if (/\.aac$/.test(filePath)) {
    return 'audio/aac'
  }
  if (/\.wav$/.test(filePath)) {
    return 'audio/wav'
  }

  return 'application/octet-stream'
}

function readLocalFile(filePath) {
  return new Promise(function(resolve, reject) {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      success: function(result) {
        resolve(result.data)
      },
      fail: function() {
        reject(new Error('读取本地文件失败'))
      }
    })
  })
}

function putToPresignedUrl(uploadUrl, contentType, data) {
  return new Promise(function(resolve, reject) {
    wx.request({
      url: uploadUrl,
      method: 'PUT',
      data: data,
      responseType: 'text',
      header: {
        'Content-Type': contentType
      },
      success: function(result) {
        if (result.statusCode >= 200 && result.statusCode < 300) {
          resolve()
          return
        }

        reject(new Error('文件上传失败'))
      },
      fail: function() {
        reject(new Error('文件上传失败'))
      }
    })
  })
}

function uploadLocalFileByPresignedUrl(file, options) {
  if (!file || !file.path) {
    return Promise.reject(new Error('缺少待上传文件'))
  }

  if (dataSource.isMockMode()) {
    return Promise.resolve(file.path)
  }

  const config = options || {}
  const fileName = resolveFileName(file, config.fileName)
  const contentType = resolveContentType(file)

  return uploadApi.getPresignedUploadUrl(fileName, contentType).then(function(result) {
    const uploadUrl = result && result.data ? result.data.url : ''
    const objectKey = result && result.data ? result.data.objectKey : ''
    if (!uploadUrl || !objectKey) {
      throw new Error('未获取到上传地址')
    }

    return readLocalFile(file.path).then(function(buffer) {
      return putToPresignedUrl(uploadUrl, contentType, buffer).then(function() {
        return objectKey
      })
    })
  })
}

function uploadLocalFilesByPresignedUrl(files) {
  const list = Array.isArray(files) ? files.filter(Boolean) : []
  return Promise.all(list.map(function(fileItem) {
    return uploadLocalFileByPresignedUrl(fileItem)
  }))
}

module.exports = {
  uploadLocalFileByPresignedUrl,
  uploadLocalFilesByPresignedUrl,
  resolveContentType
}
