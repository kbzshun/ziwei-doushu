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
ADMIN_TOKEN="${ADMIN_TOKEN:-k7Qm2xR9tLp4vB8nW3zY6cJ1hF5sD0aE}"

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
    # 记账：scripts/ledger.csv
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
  list)
    curl -sS "$BASE_URL/api/admin/codes" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      | python3 -c '
import sys, json
d = json.load(sys.stdin)
if "error" in d:
    print("错误:", d); raise SystemExit(1)
free = [c["code"] for c in d["codes"] if not c["record"].get("used")]
used = [c["code"] for c in d["codes"] if c["record"].get("used")]
print(f"可用 {len(free)} 个 / 已用 {len(used)} 个")
if free: print("可发的码:", " ".join(free))
'
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
