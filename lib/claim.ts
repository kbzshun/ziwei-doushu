/** 订单号 → 兑换码 的绑定（用于用户自助领码） */
import { kvGet, kvSet } from './store';

export interface ClaimRecord {
  code: string;
  createdAt: number;
  claimedAt?: number;
}

const key = (order: string) => `ziwei:claim:${order.toUpperCase()}`;

export async function bindOrder(order: string, code: string): Promise<void> {
  await kvSet(key(order), { code, createdAt: Date.now() } satisfies ClaimRecord);
}

/** 领取：首次返回码并记录领取时间，重复领取仍返回同一个码 */
export async function claimOrder(order: string): Promise<{ code: string; first: boolean } | null> {
  const rec = await kvGet<ClaimRecord>(key(order));
  if (!rec) return null;
  if (!rec.claimedAt) {
    await kvSet(key(order), { ...rec, claimedAt: Date.now() });
    return { code: rec.code, first: true };
  }
  return { code: rec.code, first: false };
}
