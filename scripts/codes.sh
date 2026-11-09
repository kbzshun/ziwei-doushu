#!/usr/bin/env bash
# 兑换码发货脚本（本地使用，别提交到公开仓库）
#
# 用法：
#   ./scripts/codes.sh gen 10      # 生成 10 个码
#   ./scripts/codes.sh list        # 查看全部码与使用状态
#   ./scripts/codes.sh redeem ZW-XXXXX   # 测试核销（会消耗一个码）
#
# 首次使用：把下面的 ADMIN_TOKEN 换成你自己在 Netlify 里设置的值。
set -euo pipefail

BASE_URL="${BASE_URL:-https://frolicking-bublanina-f4c147.netlify.app}"
ADMIN_TOKEN="${ADMIN_TOKEN:-k7Qm2xR9tLp4vB8nW3zY6cJ1hF5sD0aE}"

cmd="${1:-list}"

case "$cmd" in
  gen)
    n="${2:-1}"
    curl -sS -X POST "$BASE_URL/api/admin/codes" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H 'Content-Type: application/json' \
      -d "{\"count\":$n}" | python3 -m json.tool
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
    echo "用法: $0 {gen [n]|list|redeem CODE}"; exit 1
    ;;
esac
