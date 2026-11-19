import { kvIncr, kvReadNumber, kvEnabled } from './store';
import { FREE_DAILY_LIMIT, PRO_DAILY_LIMIT } from './plans';

export type UsageScope = 'free' | 'pro';

/** 按天 + IP 归集，UTC+8 自然日；免费与付费各用一个计数器 */
export function usageKey(ip: string, scope: UsageScope = 'free'): string {
  const d = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  return `ziwei:usage:${scope}:${d}:${ip}`;
}

function limitOf(scope: UsageScope): number {
  return scope === 'pro' ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;
}

export function clientIp(headers: Headers): string {
  return (headers.get('x-forwarded-for') ?? '').split(',')[0].trim()
    || headers.get('x-real-ip') || 'unknown';
}

export async function readUsage(
  ip: string,
  scope: UsageScope = 'free',
): Promise<{ used: number; limit: number; remaining: number }> {
  const used = kvEnabled ? await kvReadNumber(usageKey(ip, scope)) : 0;
  const limit = limitOf(scope);
  return { used, limit, remaining: Math.max(0, limit - used) };
}

/** 消耗一次额度，返回消耗后的用量 */
export async function consumeUsage(
  ip: string,
  scope: UsageScope = 'free',
): Promise<{ used: number; limit: number; remaining: number; exceeded: boolean }> {
  const limit = limitOf(scope);
  if (!kvEnabled) {
    // 未配 Redis 时不限流，避免把站点打挂
    return { used: 0, limit, remaining: limit, exceeded: false };
  }
  const used = (await kvIncr(usageKey(ip, scope), 60 * 60 * 36)) ?? 0;
  return { used, limit, remaining: Math.max(0, limit - used), exceeded: used > limit };
}
