import { NextRequest, NextResponse } from 'next/server';
import { kvEnabled } from '@/lib/store';
import { dayKey, readStats, readVisits } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

function authorized(req: NextRequest): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  return req.headers.get('authorization') === `Bearer ${token}`;
}

/**
 * 访问统计
 * GET /api/admin/stats?days=7&recent=20[&day=2026-11-16]
 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const days = Math.min(30, Math.max(1, Number(sp.get('days') ?? 7) || 7));
  const recent = Math.min(200, Math.max(0, Number(sp.get('recent') ?? 20) || 0));
  const day = sp.get('day') || dayKey();

  try {
    const list = await readStats(days);
    const totalPv = list.reduce((s, x) => s + x.pv, 0);
    const avgUv = Math.round(list.reduce((s, x) => s + x.uv, 0) / Math.max(1, list.length));
    const recentList = recent > 0 ? await readVisits(day, recent) : [];
    return NextResponse.json({
      ok: true,
      kv: kvEnabled,
      days: list,
      totalPv,
      avgUv,
      today: list[list.length - 1] ?? null,
      recentDay: day,
      recent: recentList,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: '存储不可用', detail: e instanceof Error ? e.message : String(e) },
      { status: 503 },
    );
  }
}
