# 紫微斗数排盘引擎 · 本地部署与操作手册

> 本手册针对本地部署环境编写，用于日常启动、验证、更新和排障。
> 上游项目说明见仓库自带的 `README.md`（请勿删除，便于对照与同步上游）。
> 部署位置：`/e/work/ai_project/ziwei-doushu`

---

## 1. 项目概况

| 项 | 内容 |
|---|---|
| 项目 | [Renhuai123/ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu) 紫微斗数开源排盘引擎（倪海厦《天纪》体系） |
| 技术栈 | Next.js 16（App Router）+ TypeScript + Tailwind CSS + Framer Motion |
| 排盘核心 | `lib/ziwei/`（纯前端运算，无需联网、无需 API Key） |
| 本地环境 | Node v24.15.0 / npm 11.12.1（Node ≥ 20 即可） |
| 访问地址 | http://localhost:3000 |
| 协议 | 代码 MIT / 数据集 CC BY 4.0 / 倪师原话 CC BY-NC-SA（不可商用） |

**本地能用**：排盘、命盘方格展示、本命/大限/流年切换、合盘起盘、古籍阅读器（全文搜索）、命理百科、亮暗主题、移动端适配。

**本地不能用**（上游未开源，属正常现象）：
- AI 解读（`/api/interpret`）与合盘 AI 分析（`/api/heming`）——没有后端 API 路由，页面会提示「开源版不含该接口」，配 API Key 也不会生效；
- 13 维断语解读内容（`lib/ziwei/db-analysis.ts` 是占位实现）——Demo 画得出盘，给不出线上那套解读；
- 用户系统 / 支付 / 部署配置。

---

## 2. 日常操作

### 2.1 启动（开发模式）

```bash
cd /e/work/ai_project/ziwei-doushu
npm run dev
```

看到 `✓ Ready in xxxms` 后，浏览器打开 <http://localhost:3000>。

- 停止：终端 `Ctrl+C`；
- 换端口（3000 被占用时）：`npm run dev -- -p 3001`；
- 局域网访问：启动日志会打印 `Network: http://10.1.23.111:3000`，同网段设备可直接访问（手机测试方便）。

### 2.2 生产模式（可选，更接近线上运行）

```bash
npm run build     # 构建（首次约 1~2 分钟）
npm run start     # 生产服务器，默认 3000 端口
```

日常自己用 `npm run dev` 即可（支持热更新，改代码立即生效）。

### 2.3 验证安装是否正常

```bash
npm run typecheck   # TypeScript 全量类型检查
npm test            # 排盘引擎回归测试（768 盘 × 多项口径校验）
```

两项全绿说明引擎正常。每次改动 `lib/ziwei/` 下的代码后建议跑一遍 `npm test`。

### 2.4 更新到上游最新版

```bash
git pull
npm install        # 依赖有变化时补齐
npm test           # 回归确认
```

> 本地手册（本文件）不在 git 跟踪范围内，`git pull` 不会冲突。

---

## 3. 目录结构速查

```
ziwei-doushu/
├── app/                    # 页面路由（App Router）
│   ├── page.tsx            # 首页
│   ├── chart/page.tsx      # 排盘页（75 行 Demo 版）
│   └── heming/page.tsx     # 合盘页（起盘可用，AI 分析不可用）
├── components/             # UI 组件（ChartBoard 命盘方格、InsightPanel 等）
├── lib/
│   ├── ziwei/              # ★ 排盘引擎核心（改算法看这里）
│   │   ├── algorithm.ts    #   完整排盘流程（安命宫/定五行局/安星/大限流年）
│   │   ├── sihua.ts        #   四化飞星系统
│   │   ├── patterns.ts     #   1100+ 行格局知识库
│   │   ├── true-solar-time.ts  # 真太阳时校正
│   │   ├── dst-cn.ts       #   中国 1986-1991 夏令时判定
│   │   └── ...
│   ├── classics/           # 古籍原文（骨髓赋/全集/全书，公版）
│   └── seo/                # 14 主星 × 12 宫位知识数据
├── docs/tianji-ziwei/      # 倪师《天纪》原话 1848 条（CC BY-NC-SA，不可商用）
├── scripts/regression/     # 回归测试数据
├── .env.example            # 环境变量模板
└── package.json            # 脚本入口（dev/build/start/test/typecheck）
```

---

## 4. 环境变量（可选）

```bash
cp .env.example .env.local
```

**只排盘不需要配置任何 Key**。`.env.local` 里的 AI 相关变量仅在自己实现了 `/api/interpret`、`/api/heming` 等接口时才有意义。

---

## 5. 常见问题

| 现象 | 处理 |
|---|---|
| 端口 3000 被占用 | `npm run dev -- -p 3001`，或 `lsof -i:3000` 找到旧进程 kill |
| `npm install` 慢/失败 | 换国内源：`npm install --registry=https://registry.npmmirror.com` |
| 页面提示「开源版不含该接口」 | 正常，AI 解读未开源，见第 1 节边界说明 |
| 首页 favicon 404 控制台报错 | 无功能影响，可忽略 |
| `next-env.d.ts`/`tsconfig.json` 显示已修改 | `next dev` 首次运行自动生成/更新，属正常，无需还原 |
| 改了 `lib/ziwei/` 代码后排盘结果变化 | 先 `npm test` 看回归是否通过；上游口径以古籍原文为准（见 CONTRIBUTING.md） |
| 想重置到干净状态 | `git checkout . && git clean -fd`（注意会丢弃所有本地修改） |

---

## 6. 可选：解读数据集（仅做数据研究/模型微调时需要）

跑网站**不需要**下载数据集。需要时：

```bash
# 全量（压缩 161MB，解压 56.6GB，注意磁盘空间）
gh release download v4.0-13d --repo Renhuai123/ziwei-doushu -p "ziwei-interp-v4-all.tar"

# 或只下某一年，如 1990
zstd -d --long=27 year-1990.jsonl.zst     # 解压必须带 --long=27

# 校验
shasum -a 256 -c SHA256SUMS.txt --ignore-missing
```

数据格式：JSON Lines，每行一张盘（`k` 键 = 日期-时辰序号-性别），13 维解读在 `c` 字段。
时辰序号 0–11 = 子…亥（不是 0–23 点钟）。数据许可 CC BY 4.0（可商用，需注明来源）。

---

## 7. 部署记录（备查）

- 部署日期：2026-11-02
- 验证结果：`npm install` 0 漏洞；`npm run typecheck` 通过；`npm test` 全部回归通过（含闰月四口径、晚子时换日、格局四化等）；`npm run dev` 启动正常，首页 http://localhost:3000 渲染完整，控制台仅 favicon 404（无害）。
- 上游版本：commit `7264e08`（fix(格局): 四化加分项按星曜 siHua 判定）

## 8. AI 解读接入记录（2026-11-02 补充，当日更新）

**已实现**（上游不含，本地补齐）：

- `lib/ai/llm.ts` —— OpenAI 兼容流式调用封装（DeepSeek 缺省，`AI_PROVIDER=mimo` 可切换），
  **内置内网代理支持**（见下）
- `app/api/interpret/route.ts` —— 命盘 AI 解读（`{chart, messages}` → SSE 流）
- `app/api/heming/route.ts` —— 合盘 AI 分析（`{chartA, chartB, question}` → SSE 流）
- 依赖新增：`undici`（Node 同源库，用于代码级代理控制）

**关键坑：内网代理（两轮排查）**

1. Node 的全局 fetch 默认**不读** `http_proxy/https_proxy` 环境变量，直连 DeepSeek 超时
   （`UND_ERR_CONNECT_TIMEOUT`）；
2. 曾尝试 `NODE_USE_ENV_PROXY=1` 启动参数，但 `~/.bashrc` 里的代理值
   `10.1.23.120:9011` 缺 `http://` 前缀，不是合法 URL，Node 启动即崩（`Invalid URL`）；
3. 最终方案（已实施）：**代理处理移入 `lib/ai/llm.ts`**——自动读代理变量、缺协议前缀自动补、
   socks 协议退回直连、no_proxy 主机跳过、非法值忽略不崩溃；同时修复了 `~/.bashrc`
   第 128-129 行（补 `http://` 前缀）。`package.json` 不再需要任何特殊前缀。

**启用步骤**：

1. `.env.local` 填 `DEEPSEEK_API_KEY`（https://platform.deepseek.com 申请）；
2. 新开终端（让修复后的 .bashrc 生效）再 `npm run dev`（当前终端即使还是旧变量也能跑，
   代码会自动补协议）；
3. 排盘页解读/追问、合盘页分析均可用（流式输出）。

**验证记录**：在复现用户环境（无前缀代理值）下真实调用 DeepSeek 成功流式返回；
无 Key/断网/上游报错时接口返回可读中文提示而不是静默失败或进程崩溃。

**Token 成本参考**：`deepseek-chat` 约 2 元/百万输入 token；一次完整命盘解读（含命盘
JSON 约 10–20K token）约几分钱。
