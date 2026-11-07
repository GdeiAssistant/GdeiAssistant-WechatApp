# PR governance

门禁实现位于组织治理仓库 `GdeiAssistant/.github` 的 `pr-governance/`，本仓库只保留
`policy.json` 和调用方工作流。门禁不检出、不执行 PR 代码，只读取 PR 元数据并在 PR head
上写入提交状态；合并约束仍由分支保护承担。

`policy.json` 使用 `pr-governance/v3`：

- 所有者身份来自组织变量 `RISK_GATE_OWNER_ID` 和 `RISK_GATE_OWNER`，不写入
  `policy.json`。只有该账号可以添加或移除 `owner-approved`；其他有写权限的 agent 使用
  `agent-approved`。
- `r0_paths`：可以降到 R0 的纯文档路径；含敏感词仍会升到 R2。
- `r2_paths`：本仓库额外的高风险路径，叠加在内置规则之上。
- `max_evidence_age_hours`：Codex 回执的最长有效期。

必需检查：`risk-gate`、`pr-template`、`ai-review`、`Gitleaks`，以及本仓库原有的
`Repository hygiene` 和 `Commit message convention`。

改动门禁行为需要修改治理仓库并更新调用方的固定 commit SHA，不能在业务仓库内单独放宽。
