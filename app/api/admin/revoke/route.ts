import { NextRequest, NextResponse } from 'next/server';
import {
  getRevokeCutoff,
  setRevokeCutoff,
  clearGlobalRevoke,
  revokeCode,
  restoreCode,
  isCodeRevoked,
  listRevokedCodes,
} from '@/lib/store';

export const dynamic = 'force-dynamic';

function authorized(req: NextRequest): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  return req.headers.get('authorization') === `Bearer ${token}`;
}

function fail(status: number, error: string, detail?: string) {
  return NextResponse.json({ ok: false, error, ...(detail ? { detail } : {}) }, { status });
}

/** GET：不带参数看全局吊销线与停用清单；带 ?code= 查单个码是否被停用 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) return fail(401, 'unauthorized');
  const code = req.nextUrl.searchParams.get('code');
  if (code) {
    return NextResponse.json({ ok: true, code: code.toUpperCase(), revoked: await isCodeRevoked(code) });
  }
  const cutoff = await getRevokeCutoff();
  return NextResponse.json({
    ok: true,
    kv: true,
    cutoff,
    globalRevoked: cutoff > 0,
    revokedCodes: await listRevokedCodes(),
  });
}

/** POST：{code} 停用单个码；{at} 或 {} 停用全部（把吊销线推到指定/当前时间） */
export async function POST(req: NextRequest) {
  if (!authorized(req)) return fail(401, 'unauthorized');
  const body = (await req.json().catch(() => ({}))) as { code?: string; at?: number };
  try {
    if (body.code) {
      await revokeCode(body.code);
      return NextResponse.json({ ok: true, revoked: body.code.toUpperCase() });
    }
    const at = typeof body.at === 'number' && body.at > 0 ? body.at : Date.now();
    await setRevokeCutoff(at);
    return NextResponse.json({ ok: true, cutoff: at, scope: 'all' });
  } catch (e) {
    return fail(503, '存储不可用', e instanceof Error ? e.message : String(e));
  }
}

/** DELETE：{code} 恢复单个码；{all:true} 取消全局吊销 */
export async function DELETE(req: NextRequest) {
  if (!authorized(req)) return fail(401, 'unauthorized');
  const body = (await req.json().catch(() => ({}))) as { code?: string; all?: boolean };
  try {
    if (body.code) {
      await restoreCode(body.code);
      return NextResponse.json({ ok: true, restored: body.code.toUpperCase() });
    }
    if (body.all) {
      await clearGlobalRevoke();
      return NextResponse.json({ ok: true, globalRevoked: false });
    }
    return fail(400, '缺少 code 或 all');
  } catch (e) {
    return fail(503, '存储不可用', e instanceof Error ? e.message : String(e));
  }
}
