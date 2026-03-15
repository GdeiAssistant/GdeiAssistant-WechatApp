# 广东二师助手微信小程序

广东二师助手微信小程序客户端，基于微信小程序框架与 WeUI 构建，面向广东第二师范学院校园场景，覆盖教务查询、校园生活、信息通知与个人资料等核心校园服务。

## 功能概览

### 校园服务

- 成绩查询
- 课表查询
- 四六级查询
- 考研查询
- 教室查询
- 图书馆
- 校园卡
- 数据查询
- 教学评价

### 校园生活

- 二手交易
- 全民快递
- 失物招领
- 校园树洞
- 卖室友
- 表白墙
- 校园话题
- 拍好校园

### 信息通知

- 新闻通知
- 阅读

### 个人中心

- 个人资料
- 头像管理
- 设置
- 退出登录

## 技术栈

- 微信小程序
- WeUI
- Promise 风格服务层
- `mock` / `remote` 双数据源

## 工程结构

```text
GdeiAssistant-WechatApp/
├── pages/
├── services/
│   ├── apis/
│   ├── auth.js
│   ├── endpoints.js
│   ├── request.js
│   └── upload.js
├── mock/
├── constants/
├── config/
├── utils/
└── common/lib/weui.wxss
```

## 数据源与资料配置

- `remote`：请求真实后端接口
- `mock`：使用本地模拟数据
- 个人资料地区数据同步自后端仓库 `location.xml`

## 运行环境

- 微信开发者工具
- 微信小程序基础库 `>= 2.32.3`

## 快速开始

### 1. 导入项目

使用微信开发者工具导入项目根目录。

### 2. 配置环境

按需修改 `config/index.js` 中的接口域名配置。

### 3. 编译运行

在微信开发者工具中编译并预览页面。

## Mock 模式说明

- 登录页或设置页可切换 `mock` 数据源
- 用户名：`gdeiassistant`
- 密码：`gdeiassistant`

## 后端接口位置

- GitHub：`https://github.com/GdeiAssistant/GdeiAssistant`

## 开源协议

本项目采用 [Apache License 2.0](LICENSE.md) 开源协议。

## 免责声明

本项目仅用于学习与研究用途。
