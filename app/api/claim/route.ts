import { NextRequest, NextResponse } from 'next/server';
import { claimOrder } from '@/lib/claim';

export const dynamic = 'force-dynamic';

/** 用户凭订单号自助领取兑换码（只回码，不下发权限） */
export async function POST(req: NextRequest) {
  let order = '';
  try {
    const body = (await req.json()) as { order?: string };
    order = (body.order ?? '').trim().toUpperCase();
  } catch {
    return NextResponse.json({ ok: false, error: '参数错误' }, { status: 400 });
  }

  if (!/^[A-Z0-9-]{4,32}$/.test(order)) {
    return NextResponse.json({ ok: false, error: '订单号格式不对' }, { status: 400 });
  }

  try {
    const rec = await claimOrder(order);
    if (!rec) {
      return NextResponse.json(
        { ok: false, error: '订单号未找到，请确认已付款并填写正确' },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, code: rec.code, first: rec.first });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: '服务暂不可用', detail: e instanceof Error ? e.message : String(e) },
      { status: 503 },
    );
  }
}
