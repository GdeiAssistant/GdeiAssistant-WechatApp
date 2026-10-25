# 参与贡献

这个仓库是 GdeiAssistant 的微信小程序客户端。感谢你愿意花时间改进它。

提交之前先确认一件事：你要改的是小程序还是后端。教务、校园卡这些数据来自 [GdeiAssistant 主仓](https://github.com/GdeiAssistant/GdeiAssistant)，接口或数据不对，问题通常在后端。

## 流程

1. 从最新的 `master` 拉出功能分支。
2. 改代码，同步改受影响的文档和测试。
3. 跑下面的检查，全部通过再提交。
4. 开 PR，说明改了什么、影响哪些页面、怎么验证的。

分支名带上主题，例如 `feat/i18n-locale-switch`、`fix/marketplace-route`。

## 提交前检查

```bash
npm ci
npm run lint
npm run format:check
npm test
npm run smoke
```

`npm test` 会先校验 `locales/` 是否与源文件一致。改动了界面文案，先跑 `npm run locales:generate` 重新生成，再把生成结果一起提交。

## 代码风格

- 页面放 `pages/`，请求统一走 `services/`，不要在页面里直接调 `wx.request`。
- 颜色、字号、间距用 `theme.json` 和 `styles/` 里的变量，不要写死色值。
- 多语言文案走 `locales/`，不要硬编码中文或英文字符串。
- 不引入新依赖，除非现有方案确实做不了。引入前在 PR 里说清楚理由和包体积影响。

## 关于 mock 数据

`mock` 只服务本地开发和界面联调。不要往 mock 里塞真实校园数据、真实用户信息或可用的测试账号。生产部署固定走远程接口。

## 不要提交的内容

- 真实用户数据、真实校园账号、密码、验证码、Cookie、Token
- `project.private.config.json`、上传密钥、AppID 相关私有配置
- 未脱敏的日志、抓包、截图
- 第三方 API Key

## 提交信息

用能看懂的话写，不要只写「update」：

```text
feat: 二手列表支持按价格排序
fix: 校园卡页面在小程序基础库 2.32 下白屏
docs: 补充部署步骤
```

## 许可

向本仓库提交的代码和文档，默认按 [Apache License 2.0](LICENSE.md) 授权。提交前请确认你有权提交这些内容。
