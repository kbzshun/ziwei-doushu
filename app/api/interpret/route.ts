/**
 * POST /api/interpret —— 紫微命盘 AI 解读（流式）。
 * 请求体: { chart: ZiweiChart, messages: {role, content}[] }
 * 响应: SSE，data: {"delta":{"text":"..."}} ... data: [DONE]
 */
import { NextRequest } from 'next/server';
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
  let body: { chart?: unknown; messages?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  const { chart, messages } = body;
  if (!chart) {
    return Response.json({ error: 'missing chart' }, { status: 400 });
  }

  const history: ChatMessage[] = (messages ?? [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

  const payload: ChatMessage[] = [
    {
      role: 'system',
      content: SYSTEM_PROMPT + JSON.stringify(chart, null, 0),
    },
    ...history,
  ];

  return streamChatToProjectSSE(payload);
}
