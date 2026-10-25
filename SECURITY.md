# 安全说明

这是 GdeiAssistant 的微信小程序客户端。服务端漏洞、账号体系问题请报到 [主仓](https://github.com/GdeiAssistant/GdeiAssistant)；这里只处理小程序本身的问题。

## Reporting a vulnerability

Report security vulnerabilities through [GitHub private vulnerability reporting](https://github.com/GdeiAssistant/GdeiAssistant-WechatApp/security/advisories/new). Do not post exploit details, credentials, private sessions or personal data in public issues or PRs. Include the affected version, impact and minimal redacted reproduction. The maintainer handles reports on a best-effort basis; no bounty or response-time guarantee is implied.

## 小程序特有的风险面

| 位置 | 风险 |
| --- | --- |
| `wx.setStorageSync` 缓存 | 小程序本地缓存未加密，登出时应清理干净 |
| `config/` | 环境地址写死在生产域，误把开发包指到 prod 会污染真实数据 |
| 上传密钥与 AppID 配置 | `project.private.config.json` 和上传密钥泄露可导致他人发布「官方」版本 |
| `services/` 请求层 | 统一注入鉴权头；散落在页面里的请求容易漏掉 401 处理 |
| 日志 | `console.log` 可能带出校园账号、Cookie、请求体 |

小程序无法像原生端那样使用 Keychain 或硬件加密，本地缓存的安全性依赖微信沙箱。不要把长期凭据存在 `Storage` 里。

## 测试边界

请只在你自己的账号和你自己的设备上测试。

不要做这些事：

- 攻击学校相关系统、第三方系统或与本项目对接的外部服务
- 获取或尝试获取他人数据
- 撞库、爆破、批量请求、绕过验证码、批量爬取、拒绝服务
- 对生产环境 `https://gdeiassistant.cn/` 做影响可用性的测试

发现自己的凭据泄露，先改密码并退出所有设备，再联系维护者。

## 支持范围

安全修复面向当前 `master` 分支和仍在维护的正式版本。旧的衍生版本不保证回溯修复。

## 响应

维护者会在合理时间内评估报告。本项目没有赏金计划，也没有固定 SLA。
