# 更新记录

只记录会影响调用方、部署方或用户可见行为的改动。日常提交见 commit 历史。

## 2026-10-07 — 演示环境对接调整

配合后端接口调整，小程序做了以下几处改动：

- **默认接口**：远端 API 指向 Azure 演示环境 `https://gdeiassistant.azurewebsites.net/`，可在 `config/` 里改。
- **隐私**：公共商品和跑腿信息只返回展示名称和不透明作者 ID，不再返回校园账号。
- **路由**：市场相关接口统一到 `/api/marketplace`。
- **跑腿发布**：改为 JSON 请求体，字段明确为 `taskName`、`pickupCode`、`contactPhone`、`pickupLocation`、`deliveryAddress`。
- **图书借阅与账号注销**：密码改放 JSON 请求体，不再走 query。
- **会话**：旧请求返回的认证失败不会清除换号后建立的新会话。
- **数据完整性**：后端缺少关键标识或状态时，小程序不再补一个「正常」默认值，按缺失处理。
