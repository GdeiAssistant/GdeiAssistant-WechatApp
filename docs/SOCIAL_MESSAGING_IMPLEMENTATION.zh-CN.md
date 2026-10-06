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

### 图片流程与页面退出补测（2026-10-06）

本轮增加 5 项客户端组合回归，调用实际聊天页、图片/API 服务和 REST 请求实现；微信选图、文件系统、上传、下载、预览与请求由内存测试桩提供，实时管理器也隔离。这些是 Node 客户端集成验证，不是微信基础库编译、开发者工具渲染或真机 UI 验证。

- 选图后保留原 bytes，确认发送使用 multipart `name=image`、原 UUID 与 Bearer；解析微信 `uploadFile` 的 JSON 字符串响应，再以本域数字路径鉴权下载预览。响应里给出的第三方图片 URL 不被用于下载或附加 token。
- 非 JSON 上传响应保留失败气泡、原文件和 clientMessageId；隐私随后收紧时仍允许原 ID 确认重试。
- 后台发送的迟到回调不更新隐藏页；回前台用实际 REST 请求确认此前已提交的图片，不重新上传，即使当前 canSend 已变为 false。
- picker 取消、空结果以及图片功能关闭不产生新发送，也不误删现有草稿。
- 退出页面清理自有草稿后，迟到历史响应不能再次创建私图文件或写回页面。该测试先复现一次额外 downloadFile；最小修复为 `applyMessages` 下载前检查 unload、`loadEarlier` 请求捕获 epoch/token 并检查响应、写回和错误提示的归属。原文字历史锚点测试仍保留。

测试辅助函数同时清除 remote request/avatar 模块缓存，保证 remote REST 场景调用真实 request.js，而非残留的 mock dataSource；生产接口实现没有因此更改。

官方工具核查：固定部署依赖 `miniprogram-ci@2.1.31` 的公开 README/type/source 提供 `getCompiledResult(options, saveZipPath)` 本地代码包编译接口，其 Project 构造需要 privateKey 或 privateKeyPath；项目属性接口通过私钥获取微信信息。本轮仅以 `npm pack --ignore-scripts` 下载包供只读核对，没有安装或调用该 SDK，没有编译、preview、upload、审核或发布。repository 与 wechat-production 的 Secrets 名称列表均为空；未读取密钥值。

官方 `miniprogram-automator` 需要已安装的微信开发者工具 CLI，并开启工具的 CLI/HTTP 功能；Mac 默认路径为 `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`。当前仅发现微信客户端，开发者工具未安装，也未安装 automator。因此仍缺官方编译和页面/键盘/选图/预览的平台验证条件；不以非官方模拟工具替代。

参考：[微信官方 CI 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci)、[微信官方自动化入口](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/automator)、[微信官方 API 类型定义](https://github.com/wechat-miniprogram/api-typings/blob/master/types/wx/lib.wx.api.d.ts)。

最终本机 Node 26.3.0：图片/聊天相关专项 22/22、当前全套 192/192、lint、format:check、34 页 smoke 均退出 0。全套包含新增的原草稿删除、晚响应下载次数为 0、临时文件不再创建断言。原始测试失败、修复后专项、全套与检查日志保存于 `/tmp/gdei-wechat-extra-validation-20261006/`；本机结果仍需由项目 CI 用声明的 Node 24.14.1 复验。未改发布 workflow/部署配置，未 commit/push/merge。

### 资料头部、隐私入口与六语言验证（2026-10-06）

自己的关注、粉丝、好友计数现位于头像昵称所在的同一卡片，统计项补充触控高度、间距和长标签换行。私信隐私和黑名单统一从设置页既有隐私区域进入，个人资料页取消重复入口；单向关注、互关好友及私信权限规则保持原有含义。布局使用 UI/UX Pro Max 的手机触控建议作源码审查，未进行微信页面渲染或真机验收。

六种语言均补上社区中心缺失的 `community.list.loadMore`；各目录递归计入数组后有 995 个叶节点（991 个字符串、4 个数值元数据），缺失、额外、空字符串、类型和占位符差异均为 0。香港目录调整 37 个文案，台湾目录调整 6 个文案，语言选项明确为「粵語（香港）」及「國語（台灣）」。专名和用户正文保留；完整静态翻译引用扫描 780 项、缺失 0，并枚举验证动态私信权限描述与错误键。

语言码取 Accept-Language 首项并去除权重、规范大小写及下划线；香港、澳门及其繁体地区扩展归香港，台湾和通用繁体归台湾，英语、日语、韩语地区码归对应目录，其余使用简体中文。快捷认证的两条固定英文拒绝已改用现有翻译键，实际处理器在六种语言下验证。实际 mock 私信、昵称和权限错误路径同时验证正文不被翻译、系统提示随语言更新。

另已复现并修复 mock 社区在语言切换时重建状态、丢失刚发表内容的问题：演示社区仅首次初始化，之后保留已有发表、编辑及互动状态，系统提示仍按当前语言计算。默认演示正文保留初始化时的语言，作为作者内容处理。新增回归通过实际发表话题、点赞、匿名评论再切换六种语言，确认正文和互动保留且匿名评论不增加身份字段。

最终本机 Node 26.3.0：i18n 专项 10/10、全套 202/202、lint、format:check、34 页 smoke 及 `git diff --check` 通过。原始失败及最终日志位于 `/tmp/gdei-wechat-locale-final-20261006/`。本轮使用 Cursor Auto 完成首轮实现和明确缺口返修，随后补充社区状态最小修复与实际验证；未 commit/push/部署，未使用官方微信编译工具、开发者工具或真机。项目声明的 Node 24.14.1 仍由正式 CI 另行复验。

### 系统地区与字典切换补测（2026-10-06）

已复现香港资料页仍显示「中国 广东 广州」：地区目录没有香港、台湾标签，页面只对英日文及韩文读取本地化名称；持久 mock 的旧 displayName 也覆盖当前语言。页面再次处理已展平的资料时会丢失地区、院系和专业代码，使地区选择器回到默认地区。新增回归先记录原始失败，再验证实际资料页、选项缓存及 mock 处理器。

地区目录按既有层级代码合并共享系统标签，236 个地区、266 个省州、3,777 个城市的代码、原名、顺序不变；没有新增行政区或全球命名体系。简体使用 4,279 个原名，香港及台湾各有 4,279 个完整标签。英语保留 236 个现有译名和 4,043 个拉丁名；日语及韩语各有 240 个译名，其余 4,039 个仍使用既有拉丁名。统一补广东、广州、汕头、佛山的日韩显示，并将佛山拉丁名 Fushan 改为 Foshan。没有运行时繁简转换。

资料所在地、家乡、选择器和 IP 地区共用目录。语言切换只重算显示，不写地区代码，也不翻译昵称、简介、正文及未知文本。部分地区代码不会被补成首个省市。IP 仅精确匹配完整已知节点或路径：支持原名、六语言完整串、拉丁名，以及规范中文地区紧凑串；「广东 广州」或「广东广州」显示为「廣東 廣州」，保持原层级，不补国家。多个候选产生不同译文时保留原文；不做子串替换。

同时修复本轮实际发现的字典缓存缺口：带 label 的远端院系、专业及分类选项在语言切换后按已知代码更新，未知代码标签原样保留；资料页保留院系专业代码及未保存的昵称、简介。社区发布页重算选择器字典，列表重算分类与状态标签；跑腿详情仅更新系统状态、角色及提示，聊天仅更新发送状态文案，保留正文、图片路径和 clientMessageId。API 在使用选项时才加载，避免资料目录先加载时与 mock 处理器形成循环依赖。小程序现有范围没有登录记录/登录地区页面，本轮没有新增页面。

最终本机 Node 26.3.0：新增地区及字典切换回归 12/12，连同既有 profile-options 专项 17/17；全套 214/214、lint、format:check、34 页配置 smoke 及 `git diff --check` 均通过。日志、合并身份核对和逐语言地区覆盖统计保存在 `/tmp/gdei-wechat-region-20261006/`。这些是 Node 客户端逻辑与配置验证，微信 API 由测试桩提供；官方开发者工具及真机未安装/接入，没有微信编译、渲染或真机 UI 验证。smoke 中的 Node 24.14.1 是项目声明版本，需正式 CI 另行复验。本轮未 commit/push/部署，未访问真实 API 或存储。
