#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const COLOR_MAP = {
  '#F8F8F8': 'var(--color-bg-primary)',
  '#f8f8f8': 'var(--color-bg-primary)',
  '#f2f2f2': 'var(--color-bg-secondary)',
  '#fbfbfb': 'var(--color-bg-secondary)',
  '#f5f5f5': 'var(--color-bg-secondary)',
  '#f0f0f0': 'var(--color-bg-secondary)',
  '#ebebeb': 'var(--color-bg-tertiary)',
  '#ffffff': 'var(--color-surface)',
  '#fff': 'var(--color-surface)',
  '#FFFFFF': 'var(--color-surface)',
  '#333': 'var(--color-text-primary)',
  '#333333': 'var(--color-text-primary)',
  '#222': 'var(--color-text-primary)',
  '#222222': 'var(--color-text-primary)',
  '#666': 'var(--color-text-secondary)',
  '#666666': 'var(--color-text-secondary)',
  '#888': 'var(--color-text-secondary)',
  '#888888': 'var(--color-text-secondary)',
  '#999': 'var(--color-text-tertiary)',
  '#999999': 'var(--color-text-tertiary)',
  '#aaa': 'var(--color-text-tertiary)',
  '#bbb': 'var(--color-text-tertiary)',
  '#ececec': 'var(--color-divider)',
  '#e3e3e3': 'var(--color-divider)',
  '#dfdfdf': 'var(--color-border)',
  '#1AAD19': 'var(--color-primary)',
  '#1aad19': 'var(--color-primary)',
  '#09bb07': 'var(--color-primary)',
  '#e94747': 'var(--color-danger)',
  '#576b95': 'var(--color-link)',
  '#586c94': 'var(--color-link)',
}

const ROOT = path.join(__dirname, '..')
const PAGES_DIR = path.join(ROOT, 'pages')
const report = []

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let changed = false
  for (const [hex, cssVar] of Object.entries(COLOR_MAP)) {
    const escaped = hex.replace('#', '\\#')
    const regex = new RegExp(escaped, 'g')
    const lines = content.split('\n')
    lines.forEach((line, idx) => {
      if (regex.test(line)) {
        report.push({ file: path.relative(ROOT, filePath), line: idx + 1, from: hex, to: cssVar })
      }
      regex.lastIndex = 0
    })
    const newContent = content.replace(regex, cssVar)
    if (newContent !== content) {
      content = newContent
      changed = true
    }
  }
  if (changed) fs.writeFileSync(filePath, content, 'utf8')
  return changed
}

const wxssFiles = []
function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkDir(full)
    else if (entry.name.endsWith('.wxss')) wxssFiles.push(full)
  }
}
walkDir(PAGES_DIR)

let totalChanged = 0
for (const f of wxssFiles) {
  if (processFile(f)) totalChanged++
}

console.log('\n=== Color Migration Report ===')
console.log('Files scanned: ' + wxssFiles.length)
console.log('Files modified: ' + totalChanged)
console.log('Replacements: ' + report.length)
console.log('')
report.forEach(function(r) {
  console.log('  ' + r.file + ':' + r.line + '  ' + r.from + ' -> ' + r.to)
})
