import { NextRequest, NextResponse } from 'next/server';
import { clientIp } from '@/lib/usage';
import { dayKey, hashIp, isBot, maskIp, recordVisit } from '@/lib/analytics';
import { kvEnabled, kvRaw } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * 访问上报（公开接口，前端用 sendBeacon 调用）
 * 只做统计，任何异常都返回 ok，避免影响页面。
 */
export async function POST(req: NextRequest) {
  try {
    if (!kvEnabled) return NextResponse.json({ ok: true, skipped: 'no-kv' });

    const body = (await req.json().catch(() => ({}))) as { path?: unknown; referrer?: unknown };
    const path = typeof body.path === 'string' ? body.path.slice(0, 200) : '';
    if (!path) return NextResponse.json({ ok: true, skipped: 'no-path' });

    const ua = req.headers.get('user-agent') ?? '';
    if (isBot(ua)) return NextResponse.json({ ok: true, skipped: 'bot' });

    const ip = clientIp(req.headers);
    if (!ip || ip === 'unknown') return NextResponse.json({ ok: true, skipped: 'no-ip' });

    const hash = hashIp(ip);

    // 30 秒内同一 IP 同一页面只算一次，防止刷新/脚本刷量
    const seen = await kvRaw<string>([
      'SET', `ziwei:analytics:seen:${dayKey()}:${hash}:${path}`, 1, 'EX', 30, 'NX',
    ]);
    if (!seen) return NextResponse.json({ ok: true, deduped: true });

    await recordVisit({
      ip: maskIp(ip),
      hash,
      path,
      ref: typeof body.referrer === 'string' ? body.referrer.slice(0, 200) : '',
      ua: ua.slice(0, 120),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: true, skipped: 'error', detail: e instanceof Error ? e.message : String(e) });
  }
}
