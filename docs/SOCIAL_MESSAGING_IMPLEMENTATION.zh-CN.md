# 微信小程序社交接入实现说明

日期：2026-10-05。仓库：`GdeiAssistant-WechatApp`。

## 范围

本仓实现原生微信小程序客户端对共享契约 `GdeiAssistant/docs/SOCIAL_MESSAGING_DESIGN.zh-CN.md` 的接入：

- REST：`/api/social/*`（关注/粉丝/好友、拉黑、四档私信、会话、文字/图片消息、未读）
- 图片私信：`POST .../messages/image` multipart（`image` + `clientMessageId`）；`GET .../messages/{id}/image` 仅同域 Bearer 下载；`imageMessagingEnabled` 服务端默认 false，mock 演示开启
- 实时：单应用一个 `wx.connectSocket` 管理器（`services/social-realtime.js`），首帧 JWT auth，logout/清会话时断开
- 页面：用户搜索、公开主页、关系列表、会话列表、文字/图片聊天、私信设置、黑名单
- 入口：收件箱区分系统公告 / 私信 / 互动；个人中心展示关系统计；设置页挂私信与黑名单；实名社区作者可进主页，树洞/表白墙不暴露身份入口
- mock：`mock/social-handlers.js` + `mock/social-data.js`，与 remote 契约一致；Release 仍走 remote（既有 `data-source` 规则）

## 关键文件

| 区域 | 路径 |
|---|---|
| API | `services/apis/social.js`、`services/endpoints.js` |
| 鉴权媒体 | `services/social-avatar.js`、`services/social-chat-image.js`；`services/auth.js` 退出清理 |
| 实时 | `services/social-realtime.js` |
| 页面 | `pages/userSearch`、`userProfile`、`relationshipList`、`conversationList`、`chat`、`dmPrivacy`、`blockList` |
| 接入 | `pages/inbox`、`pages/profile`、`pages/settings`、`pages/index`、`pages/communityDetail` |
| mock | `mock/social-*.js`，`mock/index.js` 路由 |
| 文案 | `locales/*` 的 `social` 与 inbox 私信 tab |
| 测试 | `tests/social*.js`、`tests/chat-*.js`、`tests/community-anonymous-mock.test.js` |

## 客户端行为要点

- 发送：`pending/sent/failed`，重试沿用同一 `clientMessageId`
- 分页：关系/会话用稳定 cursor；消息用 `beforeSeq`/`afterSeq`，按 id 去重
- 前后台：聊天页 10s、会话列表 30s 轮询；`ready`/回前台/断线后 REST 补拉
- 未知 `dmPolicy` 按契约默认 `MUTUAL`（服务端/mock 侧保证）

## 未在本仓完成项

- 后端实现与真实 MySQL/WebSocket 服务（其他仓/writer）
- 微信开发者工具或真机 UI 验收（本机未声明可用则不声称）
- commit / push / PR / 部署

## 最终本地验证

162 项 Node 测试通过；`lint`、`format:check` 和 34 页 smoke 检查通过（实际 Node 26.3.0，package 声明 24.14.1）。主助手给社区详情发布者头像接入现有鉴权下载服务，并重新验证了相关测试。未运行微信开发者工具、真机或真实后端 WebSocket。

## 本轮测试与设计审查追加

失败重试不再由新 canSend 阻止，仍沿原 clientMessageId/正文请求，由服务端确认此前是否已提交；新消息保持权限限制。更早历史 prepend 使用原首条 scroll-into-view 锚点，避免跳回最新。匿名树洞/表白的公开 mock 副本隐藏 owner/likedUsers/校园 username/竞猜 realname，内部 state 仍保留本人归属及猜名数据；匿名评论不下发校园 username。

## 图片私信追加

按共享契约实现 `wx.chooseMedia(count=1,image)`、JPEG/PNG≤5MiB、预览/取消、`wx.uploadFile` multipart（`name=image` + `formData.clientMessageId` + Bearer）。IMAGE 本地 typed 去重保留 `localPath`/原 clientMessageId；已提交不被 HTTP 超时降 failed；失败同 ID 重试不受最新 `canSend` 阻挡。inbox/会话列表图片摘要本地化。聊天页校园绿色：头像标题、时间、气泡/图片状态、固定编辑栏 44px 按钮与安全区，保留 prepend 锚点。

Node 全套 171 项通过；lint、format:check 和 smoke 通过（34 pages）。微信开发者工具/真实设备 UI、键盘和图片预览未执行，不以 Node 测试替代。

### 图片会话与文件修复（2026-10-06）

- Bearer 下载仅允许资源域的 `/api/social/conversations/数字/messages/数字/image`，query、fragment、其他域和非数字 ID 均拒绝。已存在的 `displayPath` 不跳过会话校验；预览重新从当前会话的文件缓存解析。
- 选图用 `wx.getImageInfo` 校验实际 JPEG/PNG 类型、每边≤4096、总像素≤16000000，并通过文件系统检查真实大小≤5MiB。校验后只复制一次到本应用用户目录，同 ID 重试使用这份原始 bytes；不重新压缩，不删除原相册或代码包素材。JPEG EXIF 方向由共享后端规范化。
- 复制/下载结果登记为本功能所有的文件。取消、退出登录、换 token、页面 unload、迟到回调与复制失败均尝试 unlink 对应私图；原相册路径不进入删除列表。旧会话的下载、发送和预览回调不恢复图片，旧 token 的上传 401 也不清除新登录。
- 选图有独立 selection epoch 和 token 校验，普通 picker 导致的 onHide 不取消选图。页面 unload 或换账号才使其失效。图片发送使用页面 epoch；后台时保留原 clientMessageId/文件供确认重试，回前台 REST 可恢复已提交消息。纯文字批次保留既有分页行为。
- Mock 通过 `wx.getFileInfo(digestAlgorithm=sha1)` 获取实际文件 bytes 摘要；相同 bytes 换路径可重试，不同 bytes 或消息类型复用 ID 则冲突。内部字段为 `imageFingerprint`，不把路径或 SHA1 称为服务端规范化 SHA256。Mock 按原 bytes 比较；不同 metadata 而像素相同的图片可能比真实后端更严格。

文件清理依赖微信文件系统和正常生命周期回调，unlink 失败为尽力清理。应用进程被强制结束时，已复制的用户目录文件可能保留；本轮没有增加持久清理任务或启动扫描。Node 文件系统桩验证了上述生命周期和真实 demo PNG bytes；微信开发者工具/真机、实际文件系统行为、键盘及预览仍未执行。

当前写集本地验证：`npm test` 180/180（图片专项 13 项，原文字分页/重试仍通过）、`npm run lint`、`npm run format:check`、`npm run smoke` 全部退出 0；smoke 覆盖 34 页。实际 Node 为 26.3.0；smoke 输出的 24.14.1 是 package 声明版本。未改依赖，未 commit/push，也未调用真实存储或后端。

### 图片点击定位与请求 401 会话归属（2026-10-06）

- F1：`pages/chat/chat.js` 的 `onImageTap` 在事件带 `localKey` 时仅按该 key 精确定位；未知 key 不再回退到 `clientMessageId` 误预览他人图片。缺失 `localKey` 时仅在 `clientMessageId` 唯一匹配时使用。失败图片重试仍走原 `retryMessage`。
- F2：`services/request.js` 的 remote/mock 401 仅当请求携带的非空 token 与当前 `auth.getSessionToken()` 完全一致时才 `clearSession`/`reLaunchToLogin`；换号、已退出、无身份请求的迟到 401 只拒绝原请求，不清理当前会话。
- 回归：`tests/chat-image.test.js`（重复 clientId 预览被点图片 / 未知 localKey / 失败重试）、`tests/request.test.js`（remote/mock 当前 token、换 token、退出后、无 token 401）。
- 验证：Cursor Auto 会话的 Shell 被拒绝后，由主助手直接完成。把新增回归放到未修复的准确源码快照副本，28 项中 5 项失败，命中图片误定位和 remote/mock 迟到 401；当前修复后专项 28/28、全套 185/185 通过，`lint`、`format:check` 和 34 页 `smoke` 均退出 0。实际 Node 26.3.0，仍与项目声明 24.14.1 不同；未运行微信开发者工具或设备。未改依赖、未 commit/push、未访问真实校园或 R2。
- Dot 云端复验：2026-10-06，在 Debian 13 Linux 独立副本中使用实际 Node 24.14.1 / npm 11.11.0，`npm ci`、`npm test`、`lint`、`format:check`、`smoke` 五项均退出 0；185/185 测试及 34 页静态检查通过。准确五文件增量的原/新 SHA-256 全部匹配，303 个源码文件符合预期，原快照与旧测试副本未修改。两项缺陷另以全内存 wx stub 调用实际生产方法复验通过。主助手已下载第 2 版完整日志，核对 ZIP CRC、241 个文件 SHA-256、命令退出码和测试输出；未执行微信开发者工具、真机 UI 或真实服务。

### 合入最新 master 后的验证（2026-10-06）

用户授权测试分支提交、推送与草稿 PR 后，接入 master 最新可选请求鉴权及锁文件修复。`authRequired: false` 允许匿名访问，但已登录时仍携带当前 token；因此旧的两个“已有 token 但请求无鉴权”测试前提不成立。测试调整为实际无 token 发出请求、随后新登录再收到 401，并补充 remote/mock 可选鉴权请求携带当前 token 时的 401 行为；生产请求保护逻辑保留。

实际本地 Node 26.3.0 / npm 11.17.0：`npm ci`、请求专项、全套 187/187 测试、lint、format 与 34 页 smoke 均通过；smoke 显示的 Node 24.14.1 是项目声明版本。测试分支 PR #69 的 GitHub CI 使用项目声明版本，云端结果需另行核对，不将本机结果或排队状态算作设备/构建测试通过。未合并或发布。
