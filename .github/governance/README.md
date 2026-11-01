# PR 风险与审查契约

本仓库是 GdeiAssistant 组织的单仓库试点，策略版本为 `pr-governance/v2`。
沿用必需 CI、严格分支更新和审查会话解决要求。`risk-gate` 只说明本契约的
评估结果，不代表 CI、合并、部署或真实业务成功。

## 风险等级

| 等级 | 范围 | 正常通过条件 |
| --- | --- | --- |
| R0 | 明确白名单内的纯文字修改，完整文本 diff，无配置或可执行内容 | 确定性分类为 `review_not_required`，必需 CI 通过 |
| R1 | 普通应用逻辑、一般测试和非敏感配置 | CodeRabbit 已完成当前 SHA 审查，覆盖证据完整，无未处理阻断意见；必需 CI 通过 |
| R2 | 登录、权限、校园凭证、隐私、部署、依赖执行钩子、workflow 和治理规则 | R1 条件，加 Pigbibi 对当前提交及证据的明确批准 |

旧路径和新路径都参与分类，取最高等级。受保护路径优先于文档、测试、示例
和 fixture。`AGENTS.md`、`.coderabbit.yaml`、CODEOWNERS、全部 `.github/`
均属 R2；仓库特有路径见 `policy.json`。未知文件状态、缺失或截断 patch、
二进制内容和 API 列表不完整时停止评估，不能用 override 绕过输入缺失。

## CodeRabbit 完成证据

只使用 GitHub 返回的 CodeRabbit 原始记录，不接受作者填写的“AI 已批准”
或模型运行证明。策略固定已安装 App 与 bot 的数字 ID、slug 和登录名。
现有安装即可工作，不需要新增 App、Secret 或付费方案。

统一检查同时要求：

- 当前完整 `head_sha` 上最新的 CodeRabbit check 已 `completed/success`，标题
  为 `Finished`，结果明确为 `Review completed`；生成反馈和发布结果阶段均完成。
- 同一运行 ID 的正式 CodeRabbit review 绑定当前 SHA，并在该 check 的运行
  时间内提交。最新 review 不能被撤销，其他 SHA 的批准不能沿用。
- 正式 review 的完整 diff 范围与当前 base/head 相符，列出的处理文件与 PR
  全量文件一致，且没有明确的遗漏或大小限制。
- PR 中 `.coderabbit.yaml` 与可信默认分支的版本相同，不存在 review 命令的
  `--with-config` 覆盖。配置修改本身必须通过 R2，并明确接受本次覆盖例外。
- 没有仍有效的维护者或 CodeRabbit `CHANGES_REQUESTED`，没有未解决的审查会话。

`APPROVED + commit_id` 不能替代完成证据。跳过、限流、neutral、取消、失败、
排队、缺少正式 review 都是 `unavailable`。完成但缺少范围证明时是 `partial`。
报告格式不被识别也保留为 `partial`，不能推测全量覆盖。

`reported_complete` 表示供应商记录报告的范围完整，不证明模型发现了所有问题。
增量审查可能没有全量文件证据，此时可请求 `@coderabbitai full review`；若仍有
限制，须由 Pigbibi 明确接受本次例外。

配置使用中文输出、启用自动审查和完成后批准，设置
`reviews.auto_approvals.allow_author_approval: false`，禁止作者使用
`@coderabbitai approve/resolve` 批准自己的 PR。其他人发出的命令同样不能绕过
本 gate 的完成证据校验。该作者限制在首次迁移合并后才进入可信默认分支。

## Pigbibi 评论

只接受可信策略中 `enabled: true` 的 Pigbibi 数字用户 ID、登录名、`User` 类型及当前
write/maintain/admin 权限；身份不从评论正文读取。账号可以同时是 PR 作者。
GitHub 无法区分本人和持有同一账号凭据的智能体，因此智能体不得代发批准、
例外或撤销，不得把用户授权实现本 PR 当成批准首次迁移。

先读取可信 gate 的 Actions summary，再由 Pigbibi 发布一个新的顶层评论。
完整 SHA 和摘要逐项复制，`reason` 写本次接受的范围及风险。每个字段独占一行，
不得重复字段；不是 JSON，也不需要占位评论或签名密钥。

```text
/governance approve
head: <40 位当前 head SHA>
base: <40 位当前 base SHA>
policy: <64 位 policy_sha256>
evidence: <64 位 evidence_sha256>
reason: <批准这次改动的具体理由>
```

正常 `approve` 仅满足 R2 的账号批准，不豁免 AI 完成条件。例外使用独立指令：

```text
/governance override
head: <40 位当前 head SHA>
base: <40 位当前 base SHA>
policy: <64 位 policy_sha256>
evidence: <64 位 evidence_sha256>
scope: ai-review-unavailable
reason: <接受本次 AI 不可用的具体原因>
```

可用 scope 为 `ai-review-unavailable`、`ai-review-partial`、`review-findings`。
必须与 gate 的 `required_override_scopes` 完全一致，多项用逗号分隔。
若包含 `review-findings`，还必须添加 `findings: <ID1>,<ID2>`，精确列出
`blocking_findings` 中全部 review/thread ID。批准记录保留具体意见及例外范围，
结果明确为 `approved_with_override`，不会改写 AI 的 unavailable/partial 状态。
此例外不豁免必需 CI、分支保护或原生会话解决要求，不授权部署和权限修改。

撤销时发布相同绑定字段的 `/governance revoke` 新评论。最新决定按 GitHub
评论 ID 排序，编辑旧批准不能覆盖新撤销。批准有效期为创建后 24 小时，
编辑过的批准、错误格式、旧 SHA、旧 base、旧策略或旧证据都不能放行。
重新批准应发布新评论；普通讨论不会撤销决定，新的不合法治理指令会阻止旧批准。

删除会触发重新评估。gate 在现有 `risk-gate` 状态中保留已观察到的最新决定编号，
删除已观察到的撤销不会恢复旧批准。若评论创建并删除都发生在 gate 观察前，
GitHub 当前评论列表不能恢复其内容；需要保留撤销评论，不能以删除代替撤销。

## 可信执行与记录

有写状态权限的 workflow 从当前默认分支的固定 commit 读取 evaluator、policy、
reviewer 配置和 workflow，计算策略摘要；不 checkout 或执行 PR 代码，不读取
relay artifact。候选策略不能批准自身。首次迁移按当前生效规则由用户批准，
本试点不自动合并、不加批准标签、不修改分支保护。

生成的记录包含仓库、PR、完整 head/base、策略版本和摘要、diff 摘要、风险等级、
CodeRabbit check/review/run ID、执行与覆盖状态、未处理意见及批准评论 ID。
证据摘要绑定原始 review/check、讨论、线程和配置；新推送、base/策略变化、
审查结论变化、评论编辑、撤销或新意见都会重新评估。

所有 REST 列表和 GraphQL 线程分页完整读取，达到 API 文件或 commit 上限时拒绝。
发布状态前完整重读一次并确认默认分支未变；并发变化或 API 错误发布 error。
PR、评论、CodeRabbit check 和 review relay 事件触发评估；默认分支 push 和
15 分钟定时检查补充处理漏发事件、过期和撤销。串行组只保留一个等待任务，
新事件可能替换较旧的等待任务；定时检查补充处理。超过 100 个 PR 的全量检查停止，
可用默认分支的 `workflow_dispatch` 指定 PR。

GitHub 状态是异步的，无自动过期；事件延迟或 Actions 故障可能暂时保留旧状态。
本方案不宣称同步撤销。原有严格 base 更新、必需 CI 和会话规则继续适用。

## 验证

```sh
node --test .github/governance/test-*.cjs
```

离线测试覆盖旧 SHA、伪造身份、跳过/限流、完成记录缺失、部分覆盖、approve、
override、revoke、评论编辑/删除及发布前并发变化。合成账号评论仅存在于测试，
不作为真实用户批准。首次合并前应分别报告本地测试、当前 SHA 的实际 CodeRabbit
结果和当前生效 gate 的状态；候选测试通过不表示迁移已启用。

参考：[CodeRabbit 状态语义](https://docs.coderabbit.ai/pr-reviews/status-check)、
[自动批准及作者命令](https://docs.coderabbit.ai/pr-reviews/automatic-approvals)、
[GitHub review API](https://docs.github.com/en/rest/pulls/reviews)、
[GitHub check API](https://docs.github.com/en/rest/checks/runs)。
