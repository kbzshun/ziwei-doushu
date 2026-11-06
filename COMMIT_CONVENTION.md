# 提交信息规范（二次开发分支）

本仓库是上游 [ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu) 的二次开发分支，提交信息沿用上游的
Conventional Commits 风格，并收敛到下面这套固定取值，便于长期维护、筛选和与上游 rebase。

## 一、固定格式

```
<type>(<scope>): <主题>

<变更点 / 原因，可选，1-4 条>
```

- **主题**：中文，动词开头，40 字以内，结尾不加句号，不要重复 type 的含义。
- **正文**：说明"为什么改"和影响面；改动点多时用 `-` 列 1-4 条。小改动可只写主题。
- 主题与正文之间空一行；正文每行不超过 100 字。

## 二、type 枚举（只用这 7 个）

| type | 含义 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | 修复缺陷（含编译、类型、运行时错误） |
| `refactor` | 重构，行为不变 |
| `perf` | 性能优化 |
| `docs` | 文档、注释 |
| `test` | 测试 |
| `chore` | 构建、依赖、配置、杂项 |

## 三、scope 枚举（只用这几个）

| scope | 覆盖范围 |
| --- | --- |
| `engine` | 排盘引擎、命理算法（`lib/` 非 AI 部分） |
| `ai` | 大模型调用与提示词（`lib/ai/`、`app/api/interpret`、`app/api/heming`） |
| `ui` | 页面与组件（`app/` 页面、`components/`） |
| `api` | 后端接口与数据层（`app/api/`、`lib/db` 等） |
| `deploy` | 本地/内网部署与运行配置（`.env*`、`next.config.js`、部署手册） |
| `deps` | 依赖升级（`package.json`、`package-lock.json`） |
| `docs` | 项目文档（`README*`、`docs/`） |
| `repo` | 工程级、跨模块或不好归类时兜底 |

## 四、两条附加约定

1. **本地私有改动单独走 `deploy` / `deps`**：内网代理、本机 IP、`.env.local`、私有 key 等一律归到这两个
   scope，与上游功能改动分开提交，rebase 上游时可以整条丢弃或整体保留。
2. **上游同步产生的提交不改写**：`git merge` / `git rebase` 带来的上游提交保留原文，便于对照
   commit hash 溯源；只有自己新写的提交才套用本规范。

破坏性或不兼容改动：主题后加 `!`（如 `feat(api)!: ...`），并在正文写明 `BREAKING CHANGE: 说明`。

## 五、参考示例

```
feat(ai): 接入 DeepSeek 流式解读，打通本地部署
fix(engine): 闰月归属非法值不再静默按归本月排盘
refactor(ui): 主题初始化收敛到挂载后的 effect
docs(deploy): 补充内网代理与模型 key 配置说明
chore(deps): 升级 undici 到 8.12.3 以支持 ProxyAgent
```
