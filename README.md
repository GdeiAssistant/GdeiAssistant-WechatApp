<p align="center">
  <img width="300" src="./github/logo.png">
</p>

# 广东二师助手微信小程序

**广东第二师范学院校园助手系统微信小程序客户端**，线上最低基础库为2.3.0版本。小程序利用微信提供的API接口和框架组件，简单实现了校园查询基础服务。UI页面设计使用WeUI基础样式库。应用的后端API数据接口由广东第二师范学院校园助手系统提供。

## 功能

- 成绩查询
- 课表查询
- 四六级查询
- 一键评教
- 消费查询
- 借阅查询
- 馆藏查询
- 校园卡查询
- 校园卡挂失

## 预览

<p>
  <img width="250" src="./github/screenshot_01.jpg">
  <img width="250" src="./github/screenshot_02.jpg">
  <img width="250" src="./github/screenshot_03.jpg">
</p>

## 体验

### 体验用户账号

为便于非在校师生用户体验和测试应用，应用提供了体验用户账号。详情请查阅 [广东二师助手体验用户账号说明](https://github.com/GdeiAssistant/GdeiAssistant#%E4%BD%93%E9%AA%8C)

### 体验二维码

<p align="center">
  <img width="300" src="./github/qrcode.jpg">
</p>

## 初始化

### 克隆仓库

```bash
$ git clone https://github.com/GdeiAssistant/GdeiAssistant-WechatApp.git
```

### 配置参数

项目的配置参数被保存在项目目录下的common/data/data.js中

1. **防重放攻击**：requestValidateToken是移动端请求服务端的拥有防重放攻击保护的数据接口时，需要携带的令牌信息。该令牌信息应该与服务端中配置的防重放攻击令牌值相同，否则校验无法通过。详情请参考 [广东第二师范学院校园助手系统初始化配置文件说明](https://github.com/GdeiAssistant/GdeiAssistant/blob/master/README.md#%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)

2. **小程序版本号**：小程序目前暂未提供获取当前版本号的API，因此在发布新的小程序版本时，需要一并修改文件中的versionCode参数值。

## 数据接口

广东二师助手微信小程序的后端API数据接口由[广东第二师范学院校园助手系统](https://github.com/GdeiAssistant/GdeiAssistant)提供

数据接口API文档说明请查阅[广东第二师范学院校园助手系统数据接口API文档](https://github.com/GdeiAssistant/GdeiAssistant/wiki)

## 协议

[MIT License](http://opensource.org/licenses/MIT)

[Anti 996 License](https://github.com/996icu/996.ICU/blob/master/LICENSE)

Copyright (c) 2016 - 2019 GdeiAssistant

## 贡献

- 若你喜欢本项目，欢迎Star本项目

- 要贡献代码，欢迎Fork之后再提交[Pull Request](https://github.com/GdeiAssistant/GdeiAssistant-WechatApp/pulls)

- 如果你有好的意见或建议，欢迎给我们提交[Issue](https://github.com/GdeiAssistant/GdeiAssistant-WechatApp/issues)

## 联系

- 技术支持和意见建议反馈：[gdeiassistant@gmail.com](mailto:gdeiassistant@gmail.com)

- 用户客服和系统故障工单提交：[support@gdeiassistant.cn](mailto:support@gdeiassistant.cn)

- 社区违法和不良信息举报邮箱：[report@gdeiassistant.cn](mailto:report@gdeiassistant.cn)

## 特别鸣谢

感谢以下框架的开发者为本应用作出的巨大贡献

- [WeUI](https://github.com/Tencent/weui-wxss)

## 声明

本项目只用作个人学习研究，如因使用本项目导致任何损失，本人概不负责。
