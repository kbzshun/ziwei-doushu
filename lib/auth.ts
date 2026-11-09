/**
 * 会话与权限（服务端）
 * - 会话：GitHub OAuth 登录后签发的 HMAC 签名 Cookie，无需数据库
 * - 专业版：由环境变量 PRO_USERS 白名单决定（逗号分隔的 GitHub 用户名）
 * 说明：真实收费应改为查询订阅表/支付回调，这里先做成可用的最小闭环。
 */
import crypto from 'crypto';
import { getRevokeCutoff, isCodeRevoked } from './store';

export const SESSION_COOKIE = 'ziwei_session';

function secret(): string {
  return process.env.AUTH_SECRET || 'dev-insecure-secret-change-me';
}

export interface SessionUser {
  login: string;
  name?: string;
  avatar?: string;
  iat: number;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createSession(user: Omit<SessionUser, 'iat'>): string {
  const body = Buffer.from(JSON.stringify({ ...user, iat: Date.now() })).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function readSession(token?: string | null): SessionUser | null {
  if (!token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  if (sign(body) !== mac) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as SessionUser;
  } catch {
    return null;
  }
}

export function isProUser(login?: string | null): boolean {
  if (!login) return false;
  const list = (process.env.PRO_USERS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(login.toLowerCase());
}

/* ─── 兑换码解锁凭证（无账号方案）─────────────────────────
   用户输入兑换码核销成功后，签发一个 90 天的签名 Cookie。
   换设备/清缓存需重新输入兑换码，这是无账号体系的固有代价。
   ──────────────────────────────────────────────────────── */

export const REDEEM_COOKIE = 'ziwei_redeem';

export function createRedeemToken(code: string, plan = 'quarter', days = 90): string {
  const body = Buffer.from(JSON.stringify({ code, plan, days, iat: Date.now() })).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function readRedeemToken(token?: string | null): { code: string; iat: number; plan?: string; days?: number } | null {
  if (!token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac || sign(body) !== mac) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

/**
 * 读取并校验兑换凭证。
 * 除签名校验外，还会对照 KV 里的吊销线：签发时间早于吊销线的凭证视为已停用，
 * 因此「停用历史订单」只需移动吊销线，无需改动已发给用户的 cookie。
 */
export async function readActiveRedeem(
  token?: string | null,
): Promise<{ code: string; iat: number; plan?: string; days?: number } | null> {
  const redeem = readRedeemToken(token);
  if (!redeem) return null;
  const cutoff = await getRevokeCutoff();
  if (cutoff && redeem.iat < cutoff) return null;
  // 单个码被点名停用：该码发出的凭证一律失效
  if (redeem.code && (await isCodeRevoked(redeem.code))) return null;
  return redeem;
}
