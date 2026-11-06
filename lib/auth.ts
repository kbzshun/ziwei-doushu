/**
 * 会话与权限（服务端）
 * - 会话：GitHub OAuth 登录后签发的 HMAC 签名 Cookie，无需数据库
 * - 专业版：由环境变量 PRO_USERS 白名单决定（逗号分隔的 GitHub 用户名）
 * 说明：真实收费应改为查询订阅表/支付回调，这里先做成可用的最小闭环。
 */
import crypto from 'crypto';

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
