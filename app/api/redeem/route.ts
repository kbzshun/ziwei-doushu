import { NextRequest, NextResponse } from 'next/server';
import { REDEEM_COOKIE, createRedeemToken } from '@/lib/auth';
import { getCode, markCodeUsed, kvEnabled } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** 核销兑换码 → 签发解锁 Cookie */
export async function POST(req: NextRequest) {
  let code = '';
  try {
    const body = (await req.json()) as { code?: string };
    code = (body.code ?? '').trim().toUpperCase();
  } catch {
    return NextResponse.json({ ok: false, error: '参数错误' }, { status: 400 });
  }

  if (!/^[A-Z0-9-]{4,32}$/.test(code)) {
    return NextResponse.json({ ok: false, error: '兑换码格式不对' }, { status: 400 });
  }

  const record = await getCode(code);
  if (!record) {
    return NextResponse.json({ ok: false, error: '兑换码不存在，请核对后重试' }, { status: 404 });
  }
  if (record.used) {
    return NextResponse.json({ ok: false, error: '该兑换码已被使用' }, { status: 409 });
  }

  await markCodeUsed(code);

  const res = NextResponse.json({ ok: true, kv: kvEnabled });
  res.cookies.set(REDEEM_COOKIE, createRedeemToken(code), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
    secure: new URL(req.url).protocol === 'https:',
  });
  return res;
}
