import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, readSession, isProUser } from '@/lib/auth';
import { FREE_TOPIC_KEYS } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

/** 当前登录状态与权限，前端据此决定是否放行付费标签 */
export async function GET(req: NextRequest) {
  const user = readSession(req.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json({
    loggedIn: !!user,
    login: user?.login ?? null,
    name: user?.name ?? null,
    avatar: user?.avatar ?? null,
    pro: isProUser(user?.login),
    freeKeys: FREE_TOPIC_KEYS,
  });
}
