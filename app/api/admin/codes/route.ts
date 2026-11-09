import { NextRequest, NextResponse } from 'next/server';
import { createCodes, listCodes, kvEnabled } from '@/lib/store';

export const dynamic = 'force-dynamic';

function authorized(req: NextRequest): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  return req.headers.get('authorization') === `Bearer ${token}`;
}

/** 列出所有兑换码及其使用状态 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    return NextResponse.json({ kv: kvEnabled, codes: await listCodes() });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ kv: kvEnabled, error: 'Upstash 调用失败', detail }, { status: 503 });
  }
}

/** 批量生成兑换码：POST { count: 10 } */
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!kvEnabled) {
    return NextResponse.json({ error: '未配置 Upstash Redis，无法生成兑换码' }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as { count?: number; prefix?: string };
  const count = Math.min(Math.max(Number(body.count) || 1, 1), 100);

  try {
    const codes = await createCodes(count, body.prefix?.toUpperCase() || 'ZW');
    return NextResponse.json({ ok: true, codes });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: '存储服务不可用，请检查 Upstash 配置', detail },
      { status: 503 },
    );
  }
}
