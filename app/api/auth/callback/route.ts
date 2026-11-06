import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, createSession } from '@/lib/auth';
import { isProUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** GitHub 回调：换 token → 取用户 → 写会话 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = req.cookies.get('oauth_state')?.value;

  if (!code || !state || state !== cookieState) {
    return NextResponse.json({ error: 'state 校验失败' }, { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: '未配置 GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET' }, { status: 500 });
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    return NextResponse.json({ error: '换取 token 失败' }, { status: 400 });
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}`, Accept: 'application/vnd.github+json' },
  });
  if (!userRes.ok) {
    return NextResponse.json({ error: '获取 GitHub 用户失败' }, { status: 400 });
  }
  const ghUser = (await userRes.json()) as { login: string; name?: string; avatar_url?: string };

  const session = createSession({ login: ghUser.login, name: ghUser.name, avatar: ghUser.avatar_url });
  const res = NextResponse.redirect(`${url.origin}/chart`);
  res.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
    secure: url.protocol === 'https:',
  });
  res.cookies.set('oauth_state', '', { path: '/', maxAge: 0 });
  return res;
}
