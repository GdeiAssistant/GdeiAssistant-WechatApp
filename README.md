# 广东二师助手 · 微信小程序

广东第二师范学院校园助手的微信小程序客户端，原生小程序框架 + WeUI。覆盖校园查询、校园生活、消息通知和个人资料。

这个仓库只有小程序前端。数据来自 [GdeiAssistant 后端](https://github.com/GdeiAssistant/GdeiAssistant)，本仓库不包含服务端代码。项目由学生维护，不是学校官方服务。

## 现状

活跃开发中，与 Android / iOS 客户端和主仓后端持续对齐。有问题或需求请开 Issue。

## 技术栈

- 微信小程序原生框架 + WeUI
- Promise 风格服务层（`services/`）
- `mock` / `remote` 双数据源
- i18n 国际化（6 种语言）
- 社交：关注/粉丝/好友、私信、四档隐私设置

## 快速开始

### 环境要求

- 微信开发者工具
- 小程序基础库 `>= 2.32.3`
- Node.js `24.14.1`（与 `.nvmrc` 和 CI 一致）

### 运行

1. 用微信开发者工具导入项目根目录。
2. 检查 `config/index.js` 里的环境配置。
3. 编译并预览。

### 检查

```bash
npm ci
npm run lint
npm run format:check
npm test
npm run smoke
```

`npm test` 会先校验 `locales/` 与源文件是否一致；改了界面文案要先跑 `npm run locales:generate`。

## 相关仓库

- 后端主仓：<https://github.com/GdeiAssistant/GdeiAssistant>

## 参与贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。安全问题请按 [SECURITY.md](SECURITY.md) 处理，不要在公开 Issue 里贴真实账号、验证码或密钥。

## 许可

[Apache License 2.0](LICENSE.md)。

## 免责声明

本项目不代表学校官方服务。面向用户的协议、隐私政策和功能风险提示，以小程序内「关于」「隐私」「校园凭证」「二手」「跑腿」「失物招领」等页面展示的内容为准，本 README 不替代这些正文。

生产部署前，请自行确认校园凭证处理、第三方服务启用情况、日志脱敏、密钥管理、传输加密和商标使用边界。校园凭证相关的授权、撤回、删除和快速认证依赖后端支持，部署衍生版本前先确认后端的加密、授权持久化和删除行为已正确配置。
