# AGENTS.md

## 项目是什么

广东第二师范学院校园助手的微信小程序客户端。原生小程序框架 + WeUI，覆盖校园查询、校园生活、消息通知和个人资料。

## 技术栈

原生微信小程序（WXML / WXSS / JS），Node.js 工具链跑 lint 和测试。

## 目录

- `pages/` — 页面。
- `services/` — 接口调用。
- `common/` — 共用工具。
- `locales/` — 文案。
- `tests/` — 单元测试。
- `docs/` — `deployment.md` 部署说明。

## 本地验证

按改动选择相关离线检查，命令以仓库当前 CI 为准。先区分代码问题与环境条件，不为通过检查降低保护。

**依赖**

```bash
npm ci
```

**Lint**

```bash
npm run lint
```

**格式检查**

```bash
npm run format:check
```

**测试**

```bash
npm test
```

**冒烟**

```bash
npm run smoke
```

## 命名与文档

- 新增文档文件名小写、`-` 连接，中文版后缀 `.zh-CN.md`；`README.md`、`AGENTS.md` 等工具约定文件保留固定名称。源码沿用现有语言命名。
- 不提交审计报告、复盘、交接单、进度快照、升级计划。要追溯看 commit 历史。
- 改文件名时同一次提交改完所有引用。
- 提交前跑 `python scripts/check_hygiene.py`。

## 不要做

- 不要引入 npm 运行时依赖到小程序包里。小程序包体积和审核都受限，工具链依赖只能出现在开发侧。
- 不要单方面改接口契约。服务端、Android、iOS 共用同一套。
- 不要绕过分包和按需注入配置，那会影响首屏体积。

## 提交与 PR

Conventional Commits，标题中文，不超过 50 字。类型只用 `feat` `fix` `docs` `refactor` `test` `chore` `perf` `ci`。

分支名 `<type>/<主题>`，例如 `docs/normalize-filenames`。不直接推默认分支，不 force push 已 review 的分支。

提交、推送、合并及生产动作按用户已明确授权的范围执行；同范围已有授权不重复确认。

PR 描述写改了什么、为什么改、怎么验证。
