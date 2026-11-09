import { NextRequest, NextResponse } from 'next/server';
import { bindOrder } from '@/lib/claim';

export const dynamic = 'force-dynamic';

/** 绑定「订单号 → 兑换码」，用户即可在 /claim 自助取码 */
export async function POST(req: NextRequest) {
  const token = process.env.ADMIN_TOKEN;
  if (!token || req.headers.get('authorization') !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { order?: string; code?: string };
  const order = (body.order ?? '').trim().toUpperCase();
  const code = (body.code ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,32}$/.test(order) || !/^[A-Z0-9-]{4,32}$/.test(code)) {
    return NextResponse.json({ error: '订单号或兑换码格式不对' }, { status: 400 });
  }
  try {
    await bindOrder(order, code);
    return NextResponse.json({ ok: true, order, code });
  } catch (e) {
    return NextResponse.json({ ok: false, error: '存储不可用', detail: e instanceof Error ? e.message : String(e) }, { status: 503 });
  }
}
