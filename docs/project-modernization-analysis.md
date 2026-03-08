# GdeiAssistant WechatApp 重构优化分析（保留 WeUI）

> 目标：在**不改动 WeUI 视觉风格**前提下，降低维护成本、提升稳定性、提高开发效率与可测试性。

## 1. 现状简评

### 1.1 优点
- 页面拆分清晰，按业务（成绩、课表、校园卡等）分目录，便于理解。
- 接口契约较统一，绝大多数业务都通过 `POST + token` 访问后端。
- 已适配微信/QQ 小程序双端登录分流，具备跨平台思路。

### 1.2 主要问题
1. **网络请求逻辑分散、重复度高**
   - 多个页面直接调用 `wx.request`，重复处理 `header`、`token`、错误提示、loading。
2. **鉴权刷新流程存在同步/异步语义不一致风险**
   - 当前 `validateRequestAccess()` 返回布尔值，但刷新 token 是异步请求，调用方很难等待刷新完成后再继续业务请求。
3. **配置与运行时常量管理偏散**
   - `resourceDomain`、签名 token 等放在普通 JS 常量中，缺少按环境（dev/staging/prod）切换机制。
4. **页面生命周期模板代码较多，实际逻辑较少**
   - 大量空生命周期函数增加噪音。
5. **缺少系统化测试与工程化质量门禁**
   - 无单元测试、无 API mock、无 lint/format 流程，重构风险较高。

## 2. 重构原则（与你的要求一致）

1. **视觉层不改动 WeUI**：保留 `common/lib/weui.wxss` 与现有 WXML 结构，只做“行为层”和“工程层”升级。
2. **先稳再新**：先引入统一网络层与鉴权中台，再逐页迁移。
3. **可回滚**：每个阶段都保证可独立发布，避免一次性大改。
4. **兼容双端**：继续保留微信/QQ 差异分支，但收敛到统一适配器。

## 3. 建议的分阶段优化路线

## 阶段 A（低风险高收益，优先）

### A1. 建立统一请求层（`services/request.js`）
封装能力：
- 自动拼接 `baseURL`
- 统一 `Content-Type`
- 自动注入 `accessToken`
- 统一 loading 与错误 toast/modal
- 响应结构归一化（`{ success, data, message }`）

这样 `pages/*/*.js` 里的重复请求可收敛为：
```js
await request.post('/rest/gradequery', { year })
```

### A2. 重写 token 刷新机制为 Promise 流程
建议改成：
- `ensureAccessToken(): Promise<string>`
- 若 access token 过期，串行刷新（加 refresh 锁，防止并发重复刷新）
- 刷新失败统一跳登录页

### A3. 配置分层
新增：
- `config/env.dev.js`
- `config/env.prod.js`
- `config/index.js`

将 `resourceDomain`、超时、灰度开关等集中管理。

## 阶段 B（结构升级）

### B1. 业务 API 按域拆分
- `services/apis/auth.js`
- `services/apis/user.js`
- `services/apis/grade.js`
- `services/apis/card.js`

页面只调用 API 方法，不直接 `wx.request`。

### B2. 页面状态与数据转换分离
把页面中的数据整形（例如年级 tabs、消费记录映射）抽到 `view-model` 或 `mappers`。

### B3. 组件化（保持 WeUI 样式）
抽通用组件：
- `components/loading-panel`
- `components/empty-state`
- `components/error-state`

组件内部继续使用 WeUI class，不改视觉。

## 阶段 C（质量与可持续）

### C1. 工程规范
- ESLint + Prettier
- commitlint + husky（可选）
- 统一 import 顺序与命名规范

### C2. 测试体系
- 对 `utils`、`services` 做单元测试
- 对 token 刷新、错误码分支做关键路径覆盖
- 提供 mock 数据便于离线回归

### C3. 监控与可观测
- 统一请求错误上报
- 页面 PV/接口成功率埋点
- token 刷新失败、登录失败等核心事件埋点

## 4. 重点技术债清单（建议先修）

1. 请求层重复代码导致维护成本高。
2. `validateRequestAccess()` 与异步刷新流程之间语义不一致，可能导致偶发鉴权异常。
3. 多处页面直接依赖全局变量式域名配置，可维护性和可测试性较弱。
4. 页面空生命周期函数较多，建议清理减少噪音。

## 5. 迁移策略（避免“大爆炸”）

建议按“页面试点 -> 模板复制 -> 全量迁移”执行：
1. 先选 1 个页面（如 `grade`）接入统一请求层。
2. 验证 token 刷新、错误处理、UI 表现一致后，再迁移 `schedule/card/bill`。
3. 最后迁移 `login/index`，统一身份流程。

## 6. 可执行的两周落地计划（示例）

### 第 1 周
- Day1-2：搭建 `config + request + auth token manager`
- Day3：接入 `grade` 页面
- Day4：接入 `schedule`、`card`
- Day5：回归测试与 bugfix

### 第 2 周
- Day1-2：接入 `bill/book/collection`
- Day3：接入 `index/login` 公共流程
- Day4：补齐 lint + 基础测试
- Day5：性能与错误上报优化

## 7. 结论

这个项目**最值得优先重构的不是样式层，而是请求/鉴权/配置三件套**。保持 WeUI 不动，仍然可以显著提升：
- 稳定性（减少 token 失效导致的问题）
- 开发效率（减少重复请求模板代码）
- 可维护性（配置集中、API 分层、可测试）

如果你愿意，我下一步可以直接给出一个“**最小侵入版重构 PR**”草案：只新增 `request/auth/config` 三层，并先迁移 `grade` 页面，UI 完全不动。
