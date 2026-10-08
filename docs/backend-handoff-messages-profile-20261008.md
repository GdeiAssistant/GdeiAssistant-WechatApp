# 个人资料与消息中心：接口交接及实施结果

2026-10-08，Codex 接续 Kimi 本地交付。前后端实现已在本地完成，尚未部署或执行线上数据库迁移。本文替换初版交接中已过时的接口缺口说明。

## 已实现的资料保存契约

Web 使用 `PATCH /api/profile`；微信小程序使用同一处理逻辑的 `POST /api/profile`。

```json
{
  "nickname": "林知远",
  "introduction": "喜欢做实用的小工具",
  "birthday": { "year": 2004, "month": 9, "date": 16 },
  "faculty": 11,
  "major": "software_engineering",
  "enrollment": 2023,
  "location": { "region": "CN", "state": "44", "city": "1" }
}
```

只提交改变的字段。省略表示保留；生日、入学年份、所在地、家乡或专业的 `null` 表示清除，简介 `null` 表示空文本。昵称非空且不超过32字符，简介不超过80字符（HTML转义后的存储长度也校验）；生日从1900年至今天，入学年份从1900年至当前年。院系与专业使用既有字典，地区组合沿用既有地区校验器。更换院系且未传专业时清除原专业。用户名不能通过请求体修改，由登录会话确定。

后端先锁定本人资料，完成全部校验，再在同一个 `appTransactionManager` 事务内更新 `profile` 与 `introduction`。任一写入失败回滚全部修改。成功返回 `{ "success": true }`，校验失败返回 HTTP400：

```json
{ "success": false, "message": "请检查个人资料", "errors": { "major": "专业必须属于所选院系" } }
```

Web 与小程序均改为一次请求；失败保留所有草稿。Web 无变化时禁用保存，离开页面提醒。小程序 tab 切换不能拦截，沿用 Kimi 草稿提醒；下拉刷新不会覆盖未保存草稿。头像保持单独上传并即时生效，头像刷新不再覆盖小程序其他草稿。

## 已实现的消息契约

所有接口都要求现有登录态。列表项沿用 `{id,module,type,title,content,createdAt,isRead,targetId,targetSubId,targetType}`。

| 用途 | 接口 | 口径 |
| --- | --- | --- |
| 分类未读 | GET `/api/information/message/categories/unread` | `data: {interaction: 整数, service: 整数}` |
| 社区互动列表 | GET `/api/information/message/community/start/{start}/size/{size}` | `module != delivery` |
| 服务提醒列表 | GET `/api/information/message/service/start/{start}/size/{size}` | `module = delivery` |
| 分类全部已读 | POST `/api/information/message/community/readall` 或 `/service/readall` | 仅修改当前收件人的相应分类 |
| 单条已读 | POST `/api/information/message/id/{id}/read` | 复用现有接口，限定收件人 |
| 公告未读 | GET `/api/information/announcement/unread` | `data` 为整数 |
| 公告已读 | POST `/api/information/announcement/id/{id}/read` | 按当前用户、公告ID记录，重复调用幂等 |
| 私信未读 | GET `/api/social/unread` | 复用既有 `data.total` |

公告列表与详情接口保持现有契约；阅读详情成功后才提交已读记录。校园新闻另设入口，不计入需要处理的消息未读。

Web 与小程序总未读 = 私信 + 公告 + 社区互动 + 服务提醒，四项不重叠，显示最多99+。每个失败来源保留自己的上次数字，不把部分请求失败误当作0；登出或账户切换重置旧身份数据。Web 聊天已读后刷新总计数。

**修正初版交接**：既有 `DeliveryService` 已发送接单与完成事件，`InteractionNotificationService` 已存储这些提醒。此次仅增加分类读取，未重复创建事件源。接单事件发送给发布人，完成事件发送给接单人，跳转携带原目标信息。“完成”是校园代取订单确认，并非物流公司的签收回传。校园卡变动或物流签收暂无已确认事件源，此次未接入。

旧 `/message/interaction`、`/message/unread`、`/message/readall` 保留原行为，**其互动口径包含 delivery**。Android、iOS 的既有角标继续消费此兼容口径与私信，不再叠加新的 service 计数；两端此次未扩展公告未读或四分类 UI。iOS 另修复了互动请求失败时清零/以当前分页估算总未读的问题。

## 上线前必需操作

在配置的 **data 数据库**执行 GdeiAssistant 仓库的 `db-init/mysql/upgrade-2026-10-08-announcement-read.sql`，再部署后端及对应 Web、小程序版本。不要在现有数据库执行整份 `init.sql`，它是重建初始化脚本。增量脚本只创建 `announcement_read`，采用用户与公告ID复合主键；公告删除级联清理，账户删除清理任务也删除用户的已读记录。

没有历史已读收据的公告在迁移后均计为未读。该初始化规则需要纳入上线通知。

2026-10-08 已在 Azure 既有演示环境的 data 数据库执行增量迁移，并只读核验表、复合主键及级联规则。镜像读取权限经用户确认授权后已恢复，后端与Cloudflare/Azure Static Web均已部署版本 `f076c76891f85caf2533049a18a16952cf410c93`，线上版本一致、后端健康UP。新增接口无登录态均返回401，Web的PATCH跨域预检通过。数据库迁移无需重做。正式生产迁移和真实校园身份联调未执行；资料整体回滚、公告已读、代取接单/完成提醒、聊天已读和计数同步仍需合法校园会话验证，模拟数据仅用于本地页面验收。

## 实际验证

- 后端：编译及15项定向测试通过，覆盖跨表保存/第二写失败回滚、省略与显式清空、校验和身份边界、分类不重叠/收件人隔离、公告幂等、账号清理、私信总计与逐会话计数一致。SQL测试使用H2 MySQL模式，未验证生产MySQL锁竞争。
- Web：202项测试通过，生产构建与JavaScript语法检查通过。构建仍有既有配置及大包提示。
- 小程序：230项测试、lint、格式检查通过；34页 smoke 通过。
- 浏览器：本地模拟模式下检查390×844、820×1180、1440×1000的资料与消息页；编辑后统一保存成功；读公告使分类6→5、总计12→11；服务分类仅显示快递提醒。截图与报告位于 GdeiAssistant 的 `docs/validation/2026-10-08-profile-messages/`。
- iOS：Codex 修改涉及的 Swift 文件语法解析通过，未做完整Xcode构建或真机验收。Kimi 的Android构建结果属于前序交付报告，本轮未重新构建Android。

后端/Web已合并 GdeiAssistant PR #282（f076c76891f85caf2533049a18a16952cf410c93），完整后端CI、CodeQL及Web202项单元测试/25项E2E均通过。本仓库为草稿PR #81，CI通过，未上传正式微信渠道。最终发布结果和权限问题解决记录见 GdeiAssistant 的 `docs/validation/2026-10-08-profile-messages/RELEASE.md`。
