import { NextRequest, NextResponse } from 'next/server';
import { getRevokeCutoff, setRevokeCutoff } from '@/lib/store';

export const dynamic = 'force-dynamic';

function authorized(req: NextRequest): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  return req.headers.get('authorization') === `Bearer ${token}`;
}

/** 查看当前吊销线（毫秒时间戳，0 表示未启用） */
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const cutoff = await getRevokeCutoff();
  return NextResponse.json({ ok: true, kv: true, cutoff, revokedAll: cutoff > 0 });
}

/**
 * 停用历史订单：把吊销线推到指定时间（默认当前时间）。
 * 此前签发的所有兑换凭证立即失效，用户需使用新兑换码。
 */
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { at?: number };
  const at = typeof body.at === 'number' && body.at > 0 ? body.at : Date.now();
  try {
    await setRevokeCutoff(at);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: '存储不可用', detail: e instanceof Error ? e.message : String(e) },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true, cutoff: at });
}
