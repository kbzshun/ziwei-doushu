#!/usr/bin/env bash
# 兑换码（voucher）管理工具 — 本地使用，勿提交到公开仓库
#
# 用法：
#   ./tools/voucher/voucher.sh gen 10 quarter   # 生成 10 个包季码
#   ./tools/voucher/voucher.sh list             # 查看全部码与使用状态
#   ./tools/voucher/voucher.sh redeem ZW-XXXXX  # 测试核销（会消耗一个码）
#
# 首次使用：把下面的 ADMIN_TOKEN 换成你自己在 Netlify 里设置的值。
set -euo pipefail

BASE_URL="${BASE_URL:-https://frolicking-bublanina-f4c147.netlify.app}"
# 从本地文件读取密钥（该文件已在 .gitignore 中，不会进仓库）
CONF_FILE="$(dirname "$0")/.local.env"
if [ -f "$CONF_FILE" ]; then
  # shellcheck disable=SC1090
  . "$CONF_FILE"
fi
if [ -z "${ADMIN_TOKEN:-}" ]; then
  echo "缺少 ADMIN_TOKEN：请在 tools/voucher/.local.env 中写入 ADMIN_TOKEN=你的token" >&2
  exit 1
fi

cmd="${1:-list}"

case "$cmd" in
  gen)
    n="${2:-1}"
    plan="${3:-quarter}"   # month | quarter | forever
    out=$(curl -sS -X POST "$BASE_URL/api/admin/codes" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H 'Content-Type: application/json' \
      -d "{\"count\":$n,\"plan\":\"$plan\"}")
    echo "$out" | python3 -m json.tool
    # 失败（如 unauthorized）不记账
    echo "$out" | python3 -c 'import sys,json; sys.exit(0 if json.load(sys.stdin).get("ok") else 1)' || exit 1
    # 记账：ledger.csv
    echo "$out" | python3 -c "
import sys, json, datetime, os
d = json.load(sys.stdin)
path = os.path.join(os.path.dirname(os.path.abspath('$0')), 'ledger.csv')
new = not os.path.exists(path)
with open(path, 'a', encoding='utf-8') as f:
    if new: f.write('时间,套餐,兑换码,状态\n')
    for c in d.get('codes', []):
        f.write(f'{datetime.datetime.now():%Y-%m-%d %H:%M},{sys.argv[1]},{c},未发出\n')
print('已记账 ->', path)
" "$plan"
    ;;
  clean)
    curl -sS -X DELETE "$BASE_URL/api/admin/codes" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H 'Content-Type: application/json' -d '{"all":true}' | python3 -m json.tool
    ;;
  del)
    code="${2:?用法: ./voucher.sh del ZWM-XXXX}"
    curl -sS -X DELETE "$BASE_URL/api/admin/codes" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H 'Content-Type: application/json' -d "{\"codes\":[\"$code\"]}" | python3 -m json.tool
    ;;
  list)
    curl -sS "$BASE_URL/api/admin/codes" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      | python3 -c '
import sys, json, datetime
d = json.load(sys.stdin)
if "error" in d:
    print("错误:", d); raise SystemExit(1)
names = {"month": "包月", "quarter": "包季", "forever": "永久"}
rows = d["codes"]
free = [c for c in rows if not c["record"].get("used")]
print("共 %d 个：可用 %d / 已用 %d" % (len(rows), len(free), len(rows) - len(free)))
print("兑换码	套餐	状态	时间")
for c in rows:
    r = c["record"]
    plan = names.get(r.get("plan") or "quarter", "包季")
    state = "已用" if r.get("used") else "可用"
    ts = r.get("usedAt") or 0
    when = datetime.datetime.fromtimestamp(ts / 1000).strftime("%m-%d %H:%M") if ts else "-"
    print("%s	%s	%s	%s" % (c["code"], plan, state, when))
'
    ;;
  bind)
    order="${2:?用法: ./voucher.sh bind 订单号 ZW-XXXX}"
    code="${3:?用法: ./voucher.sh bind 订单号 ZW-XXXX}"
    curl -sS -X POST "$BASE_URL/api/admin/claim" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H 'Content-Type: application/json' \
      -d "{\"order\":\"$order\",\"code\":\"$code\"}" | python3 -m json.tool
    echo "已绑定：用户访问 $BASE_URL/claim 输入 $order 即可取码"
    ;;
  redeem)
    code="${2:?用法: ./scripts/codes.sh redeem ZW-XXXXX}"
    curl -sS -X POST "$BASE_URL/api/redeem" \
      -H 'Content-Type: application/json' \
      -d "{\"code\":\"$code\"}" | python3 -m json.tool
    ;;
  *)
    echo "用法: $0 {gen [数量] [month|quarter|forever] | list | redeem 兑换码}"; exit 1
    ;;
esac
