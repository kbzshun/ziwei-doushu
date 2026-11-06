/**
 * 付费框架（仅前端占位，尚未接真实计费）
 *
 * 免费：排盘 + 命格总览 / 财运 / 事业 / 感情 / 性格 / 健康
 * 付费：全部宫位、运限（大限/流年/流月/流日/流时）、四化
 *
 * 真实上线时应由服务端签发权限（例如 GitHub OAuth 登录后查询订阅状态），
 * 这里的 localStorage 只是本地演示，用户可自行篡改，不能作为收费依据。
 */

export const FREE_TOPIC_KEYS = ['overview', 'wealth', 'career', 'love', 'personality', 'health'] as const;

export function isFreeKey(key: string): boolean {
  return (FREE_TOPIC_KEYS as readonly string[]).includes(key);
}

const PRO_KEY = 'ziwei_pro_v1';

export function isPro(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PRO_KEY) === '1';
  } catch {
    return false;
  }
}

export function setPro(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) localStorage.setItem(PRO_KEY, '1');
    else localStorage.removeItem(PRO_KEY);
  } catch {
    /* ignore */
  }
}
