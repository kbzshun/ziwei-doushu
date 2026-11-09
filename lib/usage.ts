import { kvIncr, kvReadNumber, kvEnabled } from './store';
import { FREE_DAILY_LIMIT } from './plans';

/** 按天 + IP 归集，UTC+8 自然日 */
export function usageKey(ip: string): string {
  const d = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  return `ziwei:usage:${d}:${ip}`;
}

export function clientIp(headers: Headers): string {
  return (headers.get('x-forwarded-for') ?? '').split(',')[0].trim()
    || headers.get('x-real-ip') || 'unknown';
}

export async function readUsage(ip: string): Promise<{ used: number; limit: number; remaining: number }> {
  const used = kvEnabled ? await kvReadNumber(usageKey(ip)) : 0;
  return {
    used,
    limit: FREE_DAILY_LIMIT,
    remaining: Math.max(0, FREE_DAILY_LIMIT - used),
  };
}

/** 消耗一次额度，返回消耗后的用量 */
export async function consumeUsage(ip: string): Promise<{ used: number; limit: number; remaining: number; exceeded: boolean }> {
  if (!kvEnabled) {
    // 未配 Redis 时不限流，避免把站点打挂
    return { used: 0, limit: FREE_DAILY_LIMIT, remaining: FREE_DAILY_LIMIT, exceeded: false };
  }
  const used = (await kvIncr(usageKey(ip), 60 * 60 * 36)) ?? 0;
  return {
    used,
    limit: FREE_DAILY_LIMIT,
    remaining: Math.max(0, FREE_DAILY_LIMIT - used),
    exceeded: used > FREE_DAILY_LIMIT,
  };
}
