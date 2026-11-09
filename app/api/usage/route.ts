import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, REDEEM_COOKIE, readSession, readRedeemToken, isProUser } from '@/lib/auth';
import { clientIp, readUsage } from '@/lib/usage';
import { PLANS } from '@/lib/plans';

export const dynamic = 'force-dynamic';

/** 当前额度与套餐状态 */
export async function GET(req: NextRequest) {
  const user = readSession(req.cookies.get(SESSION_COOKIE)?.value);
  const redeem = readRedeemToken(req.cookies.get(REDEEM_COOKIE)?.value);
  const pro = isProUser(user?.login) || !!redeem;
  const usage = pro
    ? { used: 0, limit: 0, remaining: 0 }
    : await readUsage(clientIp(req.headers));

  return NextResponse.json({
    pro,
    redeemed: !!redeem,
    plan: redeem?.plan ?? null,
    planName: redeem?.plan === 'month' ? '包月' : redeem?.plan === 'forever' ? '永久' : redeem ? '包季' : null,
    expiresAt: redeem ? redeem.iat + (redeem.days ?? 90) * 86400000 : null,
    login: user?.login ?? null,
    ...usage,
    limit: pro ? 0 : usage.limit,
    plans: PLANS,
  });
}
