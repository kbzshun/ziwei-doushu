/**
 * 极简 KV（订单 / 兑换码）
 * - 配了 Upstash Redis 就用它（免费额度够几百单）
 * - 没配则退化为环境变量里的静态兑换码列表（不可标记已用，仅适合自测）
 * 只用 fetch 调 Upstash REST，不引入依赖。
 */

const URL_ENV = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_ENV = process.env.UPSTASH_REDIS_REST_TOKEN;

export const kvEnabled = Boolean(URL_ENV && TOKEN_ENV);

async function cmd(args: (string | number)[]): Promise<unknown> {
  if (!kvEnabled) return null;

  // 常见配置错误先拦下来，给出人话提示
  const base = (URL_ENV ?? '').trim().replace(/\/+$/, '');
  if (!/^https:\/\//.test(base)) {
    throw new Error('UPSTASH_REDIS_REST_URL 必须以 https:// 开头且不带端口（当前值格式不对）');
  }
  if (/upstash\.io:\d+/.test(base)) {
    throw new Error('UPSTASH_REDIS_REST_URL 带上了端口，请改用 REST API 里那条 https 地址');
  }

  const res = await fetch(`${base}/${args.map(a => encodeURIComponent(String(a))).join('/')}`, {
    headers: { Authorization: `Bearer ${(TOKEN_ENV ?? '').trim()}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`upstash ${res.status} ${body.slice(0, 120)}`);
  }
  const json = (await res.json()) as { result?: unknown };
  return json.result ?? null;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const raw = await cmd(['GET', key]);
  if (typeof raw !== 'string') return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export async function kvSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const payload = JSON.stringify(value);
  if (ttlSeconds) await cmd(['SET', key, payload, 'EX', ttlSeconds]);
  else await cmd(['SET', key, payload]);
}

export async function kvDel(key: string): Promise<void> {
  await cmd(['DEL', key]);
}

/** 未配 Redis 时的兜底：环境变量 REDEEM_CODES="ZW-AAA,ZW-BBB" */
function envCodes(): string[] {
  return (process.env.REDEEM_CODES || '')
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);
}

export interface RedeemRecord {
  used: boolean;
  usedAt?: number;
  note?: string;
}

export async function getCode(code: string): Promise<RedeemRecord | null> {
  const key = `ziwei:code:${code.toUpperCase()}`;
  if (kvEnabled) return await kvGet<RedeemRecord>(key);
  return envCodes().includes(code.toUpperCase()) ? { used: false } : null;
}

export async function markCodeUsed(code: string): Promise<void> {
  if (!kvEnabled) return;   // 兜底模式无法持久化，见 README 说明
  await kvSet(`ziwei:code:${code.toUpperCase()}`, { used: true, usedAt: Date.now() });
}

export async function createCodes(count: number, prefix = 'ZW'): Promise<string[]> {
  const made: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    await kvSet(`ziwei:code:${code}`, { used: false });
    made.push(code);
  }
  return made;
}

export async function listCodes(): Promise<{ code: string; record: RedeemRecord }[]> {
  if (!kvEnabled) return envCodes().map(c => ({ code: c, record: { used: false } }));
  const keys = await cmd(['KEYS', 'ziwei:code:*']);
  if (!Array.isArray(keys)) return [];
  const out: { code: string; record: RedeemRecord }[] = [];
  for (const k of keys as string[]) {
    const rec = await kvGet<RedeemRecord>(k);
    if (rec) out.push({ code: k.replace('ziwei:code:', ''), record: rec });
  }
  return out.sort((a, b) => (b.record.usedAt ?? 0) - (a.record.usedAt ?? 0));
}
