import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, REDEEM_COOKIE, readSession, readRedeemToken, isProUser } from '@/lib/auth';
import { FREE_TOPIC_KEYS } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

/** 当前登录状态与权限，前端据此决定是否放行付费标签 */
export async function GET(req: NextRequest) {
  const user = readSession(req.cookies.get(SESSION_COOKIE)?.value);
  const redeem = readRedeemToken(req.cookies.get(REDEEM_COOKIE)?.value);
  return NextResponse.json({
    loggedIn: !!user,
    login: user?.login ?? null,
    name: user?.name ?? null,
    avatar: user?.avatar ?? null,
    redeemed: !!redeem,
    plan: redeem?.plan ?? null,
    planName: redeem?.plan === 'month' ? '包月' : redeem?.plan === 'forever' ? '永久' : redeem ? '包季' : null,
    expiresAt: redeem ? redeem.iat + (redeem.days ?? 90) * 86400000 : null,
    pro: isProUser(user?.login) || !!redeem,
    freeKeys: FREE_TOPIC_KEYS,
  });
}
