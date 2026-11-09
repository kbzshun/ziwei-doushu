# 兑换码（Voucher）管理工具

本地使用的兑换码管理脚本，用于给付款用户发放解锁码、查询使用状态、测试核销。
**不要提交 `ledger.csv`**（已在 `.gitignore` 中忽略）。

## 准备

1. 确认脚本可执行：

   ```bash
   chmod +x tools/redeem-codes/redeem-codes.sh
   ```

2. 脚本头部有两个默认值，按需修改（或用环境变量覆盖）：

   ```bash
   BASE_URL="${BASE_URL:-https://frolicking-bublanina-f4c147.netlify.app}"
   ADMIN_TOKEN="${ADMIN_TOKEN:-你的ADMIN_TOKEN}"
   ```

   临时覆盖示例：

   ```bash
   BASE_URL=https://your-domain.com ADMIN_TOKEN=xxx ./redeem-codes.sh list
   ```

## 命令一览

| 命令 | 作用 |
| --- | --- |
| `gen <数量> [套餐]` | 生成兑换码，套餐可选 `month` / `quarter` / `forever`，默认 `quarter` |
| `list` | 列出全部码，并汇总「可用 / 已用」 |
| `redeem <码>` | 测试核销（**会真的消耗一个码**） |

## 使用示例

### 1. 生成包月码

```bash
./tools/voucher/voucher.sh gen 5 month
```

输出：

```json
{"ok": true, "codes": ["ZW-3K9FA", "ZW-7M2QP", "ZW-B8XRT", "ZW-C4NVY", "ZW-D6HJU"]}
```

同时自动写入 `tools/voucher/ledger.csv`：

```
时间,套餐,兑换码,状态
2026-11-09 15:20,month,ZW-3K9FA,未发出
```

### 2. 生成永久码

```bash
./tools/voucher/voucher.sh gen 3 forever
```

### 3. 查看所有码

```bash
./tools/voucher/voucher.sh list
```

输出示例：

```
可用 6 个 / 已用 2 个
可发的码: ZW-3K9FA ZW-B8XRT ZW-C4NVY ZW-D6HJU ZW-E2PLK ZW-F9QWE
```

### 4. 测试核销

```bash
./tools/voucher/voucher.sh redeem ZW-3K9FA
```

输出：

```json
{"ok": true, "kv": true, "plan": "month", "days": 30, "planName": "包月"}
```

> ⚠️ 核销后这个码就作废了，**别拿要卖给用户的码来测**。建议先生成一个专门测试用的码。

## 完整操作流程（生成 → 绑定 → 查看）

假设用户付款时在备注里写了订单号 `ZW-TEST1`，买的是包月。

```bash
# ① 生成 1 个包月码（码前缀 ZWM 表示包月）
./tools/voucher/voucher.sh gen 1 month
# → {"ok":true,"codes":["ZWM-BZXUB"]}

# ② 把「订单号 → 兑换码」绑定，用户即可自助领取
./tools/voucher/voucher.sh bind ZW-TEST1 ZWM-BZXUB
# → {"ok":true,"order":"ZW-TEST1","code":"ZWM-BZXUB"}

# ③ 查看全部码：套餐、状态、使用时间一目了然
./tools/voucher/voucher.sh list
# → 共 3 个：可用 2 / 已用 1
#   兑换码        套餐  状态  时间
#   ZWM-BZXUB     包月  可用  -
#   ZWQ-UREJ4     包季  已用  11-09 16:20

# ④ （可选）核销测试：确认这个码能正常兑换，注意会消耗掉它
./tools/voucher/voucher.sh redeem ZWM-BZXUB
# → {"ok":true,"kv":true,"plan":"month","days":30,"planName":"包月"}
```

然后告诉用户：

> 打开 `https://你的域名/claim`，输入订单号 `ZW-TEST1`，页面会直接显示兑换码；
> 回排盘页点付费功能，输入该码即可解锁。

### 套餐前缀对照

| 套餐 | 前缀 | 示例 |
| --- | --- | --- |
| 包月 ¥9.9 | `ZWM` | `ZWM-BZXUB` |
| 包季 ¥19.9 | `ZWQ` | `ZWQ-UREJ4` |
| 永久 ¥39.9 | `ZWF` | `ZWF-X7K2P` |

> 部署前生成的老码是 `ZW-` 开头，没有套餐标识，按包季处理。

### 各命令一句话

| 命令 | 一句话 |
| --- | --- |
| `gen <数量> <套餐>` | 生成码，写台账 |
| `bind <订单号> <兑换码>` | 让用户能凭订单号自助取码 |
| `list` | 看哪些码还没发、属于什么套餐 |
| `redeem <兑换码>` | 测一次核销（会消耗该码） |

## 套餐与解锁时长

| 套餐 id | 价格 | 解锁时长 |
| --- | --- | --- |
| `month` | ¥9.9 | 30 天 |
| `quarter` | ¥19.9 | 90 天 |
| `forever` | ¥39.9 | 3650 天（按 10 年计） |

## 发货流程

1. 用户微信扫码付款（备注「要兑换码」）；
2. 你核对金额与到账；
3. `list` 找一个可用的码，发给用户；
4. 在 `ledger.csv` 里把那行「未发出」改成对方昵称/订单号（手工维护）；
5. 用户回站点 → 点付费功能 → 输入兑换码 → 解锁。

## 常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `{"error":"unauthorized"}` | `ADMIN_TOKEN` 与 Netlify 里的不一致 | 检查脚本头部或环境变量 |
| `{"ok":false,"error":"存储服务不可用...","detail":"upstash 401..."}` | Upstash Token 错或已失效 | 去 Upstash 重新复制 REST Token |
| `{"ok":false,"error":"存储服务不可用...","detail":"...NOPERM..."}` | Upstash Token 只有读权限 | 换成读写 Token |
| `{"ok":false,"error":"兑换码不存在"}` | 码输错或不在当前数据库 | 核对大小写与数据库 |
| `{"ok":false,"error":"该兑换码已被使用"}` | 码已被核销 | 换一个 |

## 安全提醒

- `ADMIN_TOKEN` 等于发码后台密码，**不要提交到 Git、不要外发**；
- `ledger.csv` 含你的发货记录，已在 `.gitignore` 忽略，建议定期备份到本机其它位置；
- 当前 `ADMIN_TOKEN` 曾出现在调试记录中，正式收费前请到 Netlify 更换一次。
