# 兑换码（Voucher）管理工具

本地使用的兑换码管理脚本：给付款用户发码、绑定订单、查询状态、停用/恢复订单、测试核销。

> **不要提交 `ledger.csv`、`orders.csv`、`.local.env`**（均已在 `.gitignore` 中忽略）。

## 准备

1. 确认脚本可执行：

   ```bash
   chmod +x tools/voucher/voucher.sh
   ```

2. 在 `tools/voucher/.local.env` 里写入后台令牌（该文件已被 gitignore）：

   ```bash
   ADMIN_TOKEN=你的ADMIN_TOKEN
   ```

   脚本启动时会自动读取它，无需在命令行重复输入。

3. 需要临时切换地址时用环境变量覆盖，不必改脚本：

   ```bash
   BASE_URL=https://your-domain.com ./tools/voucher/voucher.sh list
   ```

## 命令一览

| 命令 | 作用 |
| --- | --- |
| `gen <数量> [套餐]` | 生成兑换码，套餐可选 `month` / `quarter` / `forever`，默认 `quarter` |
| `list` | 列出全部码：套餐、状态、订单号、使用时间 |
| `bind <订单号> <兑换码>` | 把订单号与兑换码绑定，用户可凭订单号自助取码 |
| `redeem <兑换码>` | 测试核销（**会真的消耗一个码**） |
| `revoke [订单号/兑换码]` | 停用订单：带参数停用单个，不带参数停用全部历史订单 |
| `restore <订单号/兑换码>` | 撤销停用，恢复该订单的访问 |
| `revoke-status [兑换码]` | 查看当前停用状态；带参数查单个码 |
| `purge-used [--yes]` | 只删除**已核销**的码（默认只预览，加 `--yes` 才执行） |
| `del <兑换码>` | 删除单个码 |
| `clean` | 删除**全部**码（不可恢复，慎用） |

## 使用示例

### 1. 生成包月码

```bash
./tools/voucher/voucher.sh gen 5 month
```

输出：

```json
{"ok": true, "codes": ["ZWM-3K9FA", "ZWM-7M2QP", "ZWM-B8XRT", "ZWM-C4NVY", "ZWM-D6HJU"]}
```

同时自动写入生成台账 `tools/voucher/ledger.csv`：

```
时间,套餐,兑换码,状态
2026-11-09 15:20,month,ZWM-3K9FA,未发出
```

### 2. 查看所有码

```bash
./tools/voucher/voucher.sh list
```

```
共 3 个：可用 2 / 已用 1
兑换码         套餐  状态  订单号           时间
ZWM-BZXUB      包月  可用  张三包月         -
ZWQ-UREJ4      包季  已用  李四包季         11-09 16:20
ZWM-9YA3V      包月  已用  -                11-09 15:02
```

### 3. 测试核销

```bash
./tools/voucher/voucher.sh redeem ZWM-3K9FA
```

```json
{"ok": true, "kv": true, "plan": "month", "days": 30, "planName": "包月"}
```

> ⚠️ 核销后这个码就作废了，**别拿要卖给用户的码来测**。建议先生成一个专门测试用的码。

## 完整操作流程（生成 → 绑定 → 查看）

用户在付款备注里写的是「**微信名 + 套餐**」，例如 `张三包月`。这一串就是订单号，`bind` 时原样填进去。

```bash
# ① 生成 1 个包月码（码前缀 ZWM 表示包月）
./tools/voucher/voucher.sh gen 1 month
# → {"ok":true,"codes":["ZWM-BZXUB"]}

# ② 把「订单号 → 兑换码」绑定，用户即可自助领取
./tools/voucher/voucher.sh bind 张三包月 ZWM-BZXUB
# → {"ok":true,"order":"张三包月","code":"ZWM-BZXUB"}

# ③ 查看全部码
./tools/voucher/voucher.sh list

# ④ （可选）核销测试：确认这个码能正常兑换，注意会消耗掉它
./tools/voucher/voucher.sh redeem ZWM-BZXUB
```

然后告诉用户：

> 打开 `https://你的域名/claim`，输入订单号 `张三包月`，页面会直接显示兑换码；
> 回排盘页点付费功能，输入该码即可解锁。

### 套餐前缀对照

| 套餐 | 前缀 | 示例 |
| --- | --- | --- |
| 包月 ¥9.9 | `ZWM` | `ZWM-BZXUB` |
| 包季 ¥19.9 | `ZWQ` | `ZWQ-UREJ4` |
| 永久 ¥39.9 | `ZWF` | `ZWF-X7K2P` |

> 部署前生成的老码是 `ZW-` 开头，没有套餐标识，按包季处理。

## 停用订单（退款、误发、测试码作废）

兑换凭证是一张签名 Cookie，**删掉兑换码并不会让用户立刻掉线**——他还握着有效期内的 Cookie。
真正停用要用 `revoke`：它把订单记进服务端的停用清单，用户下次访问即刻回到免费版。

### 停用单个订单

```bash
# 用订单号（推荐，脚本查本地订单簿自动换算成兑换码）
./tools/voucher/voucher.sh revoke zhangsan-baoyue
# → {"ok": true, "revoked": "ZWM-JK384"}

# 也可以直接用兑换码
./tools/voucher/voucher.sh revoke ZWM-JK384
```

**其他订单完全不受影响**，只作废这一张。

### 停用全部历史订单

```bash
./tools/voucher/voucher.sh revoke
# → {"ok": true, "cutoff": 1794209400000, "scope": "all"}
```

含义：把「吊销线」推到当前时间，**此前签发的所有兑换凭证立即失效**；之后新核销的码正常可用。

### 查看与恢复

```bash
./tools/voucher/voucher.sh revoke-status          # 吊销线 + 被停用的码清单
./tools/voucher/voucher.sh revoke-status ZWM-JK384 # 查单个码是否被停用
./tools/voucher/voucher.sh restore zhangsan-baoyue # 撤销停用，恢复访问
```

### 两种粒度的区别

| 操作 | 影响范围 | 存储位置 |
| --- | --- | --- |
| `revoke`（无参数） | 该时间点之前签发的**全部**凭证 | KV `ziwei:revoke:before` |
| `revoke <订单号/码>` | **仅**这一个码签发的凭证 | KV `ziwei:revoked:<CODE>` + 清单 |

两者可叠加使用，互不干扰。

> 需要线上已部署含吊销功能的版本（`lib/store.ts` 的吊销线、`/api/admin/revoke`）。
> 部署后停用/恢复只改 KV，**不需要再次部署**。

## 停用 vs 删除

| 命令 | 作用 | 用户是否立刻掉线 |
| --- | --- | --- |
| `revoke <码>` | 记入停用清单 | ✅ 是，其他订单不受影响 |
| `revoke` | 全局吊销线 | ✅ 是，全部历史订单 |
| `del <码>` | 从数据库删掉这个码 | ❌ 否，Cookie 仍有效 |
| `purge-used --yes` | 删掉已核销的码（保留可用的） | ❌ 否 |
| `clean` | 删掉全部码 | ❌ 否，且可用码一起没了 |

**要真正停用权益，用 `revoke`；只是清理列表用 `del` / `purge-used`。**

## 本地订单簿（orders.csv）

线上 `/api/redeem` 在旧版本里会覆盖兑换码记录，导致核销后订单号丢失。
`bind` 现在会把「订单号 → 兑换码」同时写入 `tools/voucher/orders.csv`（已 gitignore），
`list` 与 `revoke` 在线上记录没有订单号时自动用本地订单簿补全。

- 该文件是运营数据，**不要提交到仓库**，建议每周备份。
- 部署修复版（`lib/store.ts` 的 `markCodeUsed` 合并写回）后线上不再丢失，本地订单簿仍可作为二次核对。

## 套餐与解锁时长

| 套餐 id | 价格 | 解锁时长 |
| --- | --- | --- |
| `month` | ¥9.9 | 30 天 |
| `quarter` | ¥19.9 | 90 天 |
| `forever` | ¥39.9 | 3650 天（按 10 年计） |

## 发货流程

1. 用户微信扫码付款（备注「微信名 + 套餐」，如 `张三包月`）；
2. 你核对金额与到账；
3. `gen 1 <套餐>` 生成一个码；
4. `bind 张三包月 <码>` 绑定订单号；
5. 告诉用户去 `/claim` 输入订单号自助取码，或直接把码发给他；
6. 需要作废时 `revoke 张三包月`。

## 常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `{"error":"unauthorized"}` | `.local.env` 里的 `ADMIN_TOKEN` 与 Netlify 不一致 | 核对两边取值 |
| `{"ok":false,"error":"存储服务不可用...","detail":"upstash 401..."}` | Upstash Token 错或已失效 | 去 Upstash 重新复制 REST Token |
| `{"ok":false,"error":"存储服务不可用...","detail":"...NOPERM..."}` | Upstash Token 只有读权限 | 换成读写 Token |
| `{"ok":false,"error":"兑换码不存在"}` | 码输错或不在当前数据库 | 核对大小写与数据库 |
| `{"ok":false,"error":"该兑换码已被使用"}` | 码已被核销 | 换一个，或确认是否要 `restore` |
| `list` 里订单号显示 `-` | 该码核销时线上旧版本覆盖了记录 | 用本地订单簿补显；`bind` 过的码会自动补上 |
| `revoke` 返回 `没找到兑换码` | 订单号没 `bind` 过，本地订单簿查不到 | 直接用兑换码停用 |

## 安全提醒

- `ADMIN_TOKEN` 等于发码后台密码，**不要提交到 Git、不要外发**；
- `ledger.csv`、`orders.csv`、`.local.env` 含发货记录与密钥，已在 `.gitignore` 忽略，建议定期备份到本机其它位置；
- 停用清单与吊销线都存在 KV 中，属于线上数据，别手动删 Key。
