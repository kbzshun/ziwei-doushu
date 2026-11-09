import { NextRequest, NextResponse } from 'next/server';
import { createCodes, listCodes, kvEnabled, deleteCode, deleteAllCodes } from '@/lib/store';
import { planById } from '@/lib/plans';

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
  const body = (await req.json().catch(() => ({}))) as { count?: number; prefix?: string; plan?: string };
  const count = Math.min(Math.max(Number(body.count) || 1, 1), 100);

  try {
    const plan = planById(body.plan) ? body.plan! : 'quarter';
    const codes = await createCodes(count, body.prefix?.toUpperCase() || 'ZW', plan);
    return NextResponse.json({ ok: true, codes });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: '存储服务不可用，请检查 Upstash 配置', detail },
      { status: 503 },
    );
  }
}

/** 删除兑换码：{ all: true } 清空，或 { codes: ["ZWM-XXX"] } 指定删除 */
export async function DELETE(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { all?: boolean; codes?: string[] };
  try {
    if (body.all) {
      const n = await deleteAllCodes();
      return NextResponse.json({ ok: true, deleted: n });
    }
    const list = (body.codes ?? []).filter(Boolean);
    for (const c of list) await deleteCode(c);
    return NextResponse.json({ ok: true, deleted: list.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: '存储不可用', detail: e instanceof Error ? e.message : String(e) }, { status: 503 });
  }
}
