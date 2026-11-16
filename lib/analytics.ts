/**
 * 访问统计（自建，数据存自己的 Upstash）
 *
 * - PV：按天 INCR
 * - UV：HyperLogLog（PFADD / PFCOUNT），固定约 12KB，不会随访客数膨胀
 * - 明细：按天 LPUSH 最近 500 条，90 天自动过期
 * - Top 页面：按天 ZINCRBY
 *
 * 隐私：默认只记录脱敏网段（1.2.3.x）+ 加盐哈希，不可还原到具体个人。
 * 需要完整 IP 做排障时，在环境变量里设 ANALYTICS_FULL_IP=1。
 */
import crypto from 'crypto';
import { kvRaw, kvEnabled } from './store';

const DAY_MS = 86400000;
const VISIT_TTL = 90 * 24 * 3600;
const MAX_VISITS = 500;

/** UTC+8 自然日：offset=0 今天，1 昨天 */
export function dayKey(offset = 0): string {
  const t = Date.now() + 8 * 3600 * 1000 - offset * DAY_MS;
  return new Date(t).toISOString().slice(0, 10);
}

function salt(): string {
  return process.env.ANALYTICS_SALT || process.env.AUTH_SECRET || 'ziwei-analytics';
}

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(salt() + ip).digest('hex').slice(0, 12);
}

/** 脱敏显示：IPv4 保留前三段，IPv6 保留前四组 */
export function maskIp(ip: string): string {
  if (process.env.ANALYTICS_FULL_IP === '1') return ip;
  if (ip.includes(':')) {
    const parts = ip.split(':').filter(Boolean);
    return `${parts.slice(0, 4).join(':')}::`;
  }
  const p = ip.split('.');
  return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.x` : ip;
}

const BOT_RE = /(bot|spider|crawl|slurp|curl|wget|python-requests|headless|monitor|prerender)/i;

export function isBot(ua: string): boolean {
  return !ua || BOT_RE.test(ua);
}

export interface Visit {
  t: number;
  ip: string;
  hash: string;
  path: string;
  ref?: string;
  ua?: string;
}

export async function recordVisit(v: Omit<Visit, 't'>): Promise<void> {
  if (!kvEnabled) return;
  const d = dayKey();
  await kvRaw(['INCR', `ziwei:analytics:pv:${d}`]);
  await kvRaw(['PFADD', `ziwei:analytics:uv:${d}`, v.hash]);
  await kvRaw(['LPUSH', `ziwei:analytics:visits:${d}`, JSON.stringify({ ...v, t: Date.now() })]);
  await kvRaw(['LTRIM', `ziwei:analytics:visits:${d}`, 0, MAX_VISITS - 1]);
  await kvRaw(['EXPIRE', `ziwei:analytics:visits:${d}`, VISIT_TTL]);
  await kvRaw(['ZINCRBY', `ziwei:analytics:paths:${d}`, 1, v.path]);
}

export interface DayStats {
  day: string;
  pv: number;
  uv: number;
  topPaths: { path: string; count: number }[];
}

export async function readDay(day: string): Promise<DayStats> {
  const pv = Number((await kvRaw(['GET', `ziwei:analytics:pv:${day}`])) ?? 0) || 0;
  const uv = Number((await kvRaw(['PFCOUNT', `ziwei:analytics:uv:${day}`])) ?? 0) || 0;
  const flat = ((await kvRaw(['ZREVRANGE', `ziwei:analytics:paths:${day}`, 0, 9, 'WITHSCORES'])) ?? []) as string[];
  const topPaths: { path: string; count: number }[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    topPaths.push({ path: flat[i], count: Number(flat[i + 1]) || 0 });
  }
  return { day, pv, uv, topPaths };
}

/** 最近 days 天（含今天），按时间升序 */
export async function readStats(days = 7): Promise<DayStats[]> {
  const out: DayStats[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(await readDay(dayKey(i)));
  return out;
}

export async function readVisits(day: string, limit = 50): Promise<Visit[]> {
  const raw = ((await kvRaw(['LRANGE', `ziwei:analytics:visits:${day}`, 0, Math.max(0, limit - 1)])) ?? []) as string[];
  const out: Visit[] = [];
  for (const s of raw) {
    try { out.push(JSON.parse(s) as Visit); } catch { /* 跳过坏数据 */ }
  }
  return out;
}
