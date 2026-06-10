#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const path = require('path')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value || !value.trim()) {
    throw new Error(`${name} is required`)
  }
  return value.trim()
}

function resolvePrivateKey() {
  if (process.env.WECHAT_PRIVATE_KEY_BASE64) {
    return Buffer.from(process.env.WECHAT_PRIVATE_KEY_BASE64, 'base64').toString('utf8')
  }

  if (process.env.WECHAT_PRIVATE_KEY) {
    const raw = process.env.WECHAT_PRIVATE_KEY
    return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw
  }

  throw new Error('WECHAT_PRIVATE_KEY or WECHAT_PRIVATE_KEY_BASE64 is required')
}

async function main() {
  const ci = require('miniprogram-ci')
  const projectRoot = process.cwd()
  const projectConfig = readJson(path.join(projectRoot, 'project.config.json'))
  const appid = process.env.WECHAT_APP_ID || projectConfig.appid
  const version = requireEnv('WECHAT_UPLOAD_VERSION')
  const desc = process.env.WECHAT_UPLOAD_DESC || `GitHub Actions upload ${version}`
  const robot = Number.parseInt(process.env.WECHAT_UPLOAD_ROBOT || '1', 10)
  const privateKeyPath = path.join(os.tmpdir(), `gdeiassistant-wechat-key-${process.pid}.key`)

  if (!appid) {
    throw new Error('WECHAT_APP_ID or project.config.json appid is required')
  }
  if (!Number.isInteger(robot) || robot < 1 || robot > 30) {
    throw new Error('WECHAT_UPLOAD_ROBOT must be an integer from 1 to 30')
  }

  fs.writeFileSync(privateKeyPath, resolvePrivateKey(), { mode: 0o600 })

  try {
    const project = new ci.Project({
      appid,
      type: 'miniProgram',
      projectPath: projectRoot,
      privateKeyPath,
      ignores: ['node_modules/**/*', '.git/**/*']
    })

    await ci.upload({
      project,
      version,
      desc,
      robot,
      setting: {
        es6: !!projectConfig.setting?.es6,
        minify: !!projectConfig.setting?.minified,
        minifyJS: !!projectConfig.setting?.minified,
        minifyWXML: !!projectConfig.setting?.minifyWXML,
        minifyWXSS: !!projectConfig.setting?.minifyWXSS,
        autoPrefixWXSS: !!projectConfig.setting?.postcss
      },
      onProgressUpdate: console.log
    })
  } finally {
    fs.rmSync(privateKeyPath, { force: true })
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
