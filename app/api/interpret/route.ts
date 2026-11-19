/**
 * POST /api/interpret —— 紫微命盘 AI 解读（流式）。
 * 请求体: { chart: ZiweiChart, messages: {role, content}[] }
 * 响应: SSE，data: {"delta":{"text":"..."}} ... data: [DONE]
 */
import { NextRequest } from 'next/server';
import { SESSION_COOKIE, REDEEM_COOKIE, readSession, readActiveRedeem, isProUser } from '@/lib/auth';
import { isFreeKey } from '@/lib/entitlements';
import { clientIp, consumeUsage } from '@/lib/usage';
import { streamChatToProjectSSE, ChatMessage } from '@/lib/ai/llm';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `你是一位精通紫微斗数的命理顾问，严格遵循倪海厦《天纪》三合派体系解读命盘：
- 以命宫为本，三方四正（财帛、官禄、迁移）为用，四化（禄、权、科、忌）为纲；
- 空宫必须借对宫星曜论断；
- 十四主星与庙旺利陷亮度结合分析，杀破狼、机月同梁等格局综合判断；
- 大限十年一运，流年看当年宫位。

输出要求：
- 使用简体中文，语气客观、克制、有条理，先总后分；
- 回答聚焦用户问题（性格、事业、财运、感情、健康等维度），不确定的地方明说，不做绝对化断言；
- 遵循倪师命运观：命盘只是"天"的三分之一，还有地理环境与人心意念，解读中适当体现，鼓励用户主动把握人生；
- 不提供医疗、投资、法律等专业决策建议，健康话题只做传统命理角度的提示并建议就医。

下面是待解读的紫微命盘完整数据（JSON）：
`;

export async function POST(req: NextRequest) {
  let body: { chart?: unknown; messages?: { role: string; content: string }[]; feature?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  const { chart, messages, feature } = body;

  const user = readSession(req.cookies.get(SESSION_COOKIE)?.value);
  const redeem = await readActiveRedeem(req.cookies.get(REDEEM_COOKIE)?.value);
  const paid = isProUser(user?.login) || !!redeem;

  // 付费功能：未付费直接拦
  if (feature && !isFreeKey(feature) && !paid) {
    return Response.json({ error: 'pro-required' }, { status: 403 });
  }

  // 免费 5 次/天，付费 50 次/天——付费也不能无限调用
  const quota = await consumeUsage(clientIp(req.headers), paid ? 'pro' : 'free');
  if (quota.exceeded) {
    return Response.json(
      {
        error: paid ? 'pro-limit-reached' : 'limit-reached',
        used: quota.used,
        limit: quota.limit,
      },
      { status: 429 },
    );
  }
  if (!chart) {
    return Response.json({ error: 'missing chart' }, { status: 400 });
  }

  const history: ChatMessage[] = (messages ?? [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

  // 输出模式：放在系统提示最前面，比塞在用户消息里更能约束模型
  const MODE_RULES = paid
    ? `【当前输出模式：专业深度｜用户已付费】
1) 严格按用户消息里要求的**【小节名】**逐节输出，每节不少于 100 字，全文不少于 900 字。
2) 每个结论都必须给出盘面依据：哪颗星、落哪个宫、庙旺利陷、哪一化、成什么格局。
3) 术语第一次出现用一句白话解释；引用倪海厦体系观点时标注来源，无法确认出处就写「倪师体系通说」，严禁编造页码。
4) 禁止绝对化断言与医疗/投资/法律结论；结尾单独一句「命理分析仅供参考，人生走向以个人选择与努力为准」。
`
    : `【当前输出模式：免费精简｜必须严格遵守】
1) 全文不超过 300 字（含标点）。
2) 只用 **【小节名】** 作标题，禁止使用 Markdown 的 #、##、### 标题，禁止项目符号列表。
3) 只输出用户消息里要求的那些小节，不得自行增加「命格定性」「主星解读」「三方四正」「当前大限」等额外小节。
4) 每节最多 2 句，结论先行；不解释术语、不引用古籍、不做推演、不写免责声明。
`;

  const payload: ChatMessage[] = [
    {
      role: 'system',
      content: MODE_RULES + '\n' + SYSTEM_PROMPT + JSON.stringify(chart, null, 0),
    },
    ...history,
  ];

  // 免费版同时兜底限制输出长度，避免模型无视字数约束
  return streamChatToProjectSSE(payload, { maxTokens: paid ? 4000 : 600 });
}
