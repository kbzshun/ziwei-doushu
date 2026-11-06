/**
 * POST /api/heming —— 紫微合盘 AI 分析（流式）。
 * 请求体: { chartA: ZiweiChart, chartB: ZiweiChart, question?: string }
 * 响应: SSE，data: {"delta":{"text":"..."}} ... data: [DONE]
 */
import { NextRequest } from 'next/server';
import { streamChatToProjectSSE, ChatMessage } from '@/lib/ai/llm';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `你是一位精通紫微斗数的命理顾问，基于倪海厦《天纪》三合派体系做合盘（双人命盘比对）分析。
方法论（heming-knowledge 摘要）：
- 双盘命宫主星兼容性：主星五行生克、庙旺利陷强弱对比；
- 夫妻宫互参：A 的夫妻宫与 B 的命宫/身宫互看，反之亦然；
- 三方四正交互：双方财帛/官禄/迁移宫的互补或冲突；
- 四化交会：一方的化禄/化权/化科/化忌飞入另一方的命宫或夫妻宫，是合盘关键。

输出要求：
- 简体中文，结构化：先总体匹配度印象，再分「感情相性 / 相处模式 / 潜在摩擦点 / 相处建议」；
- 若用户带了具体问题（question），重点回应该问题；
- 语气客观克制，不做绝对化断言，不做医疗/投资/法律建议；
- 命盘只是"天"的三分之一，提醒双方的经营与选择同样重要。

下面是待分析的两个紫微命盘完整数据（JSON，chartA 与 chartB）：
`;

export async function POST(req: NextRequest) {
  let body: { chartA?: unknown; chartB?: unknown; question?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  const { chartA, chartB, question } = body;
  if (!chartA || !chartB) {
    return Response.json({ error: 'missing chartA or chartB' }, { status: 400 });
  }

  const payload: ChatMessage[] = [
    {
      role: 'system',
      content:
        SYSTEM_PROMPT +
        'chartA:\n' +
        JSON.stringify(chartA, null, 0) +
        '\nchartB:\n' +
        JSON.stringify(chartB, null, 0),
    },
  ];

  if (question && question.trim()) {
    payload.push({ role: 'user', content: question });
  } else {
    payload.push({
      role: 'user',
      content: '请给出这两张命盘的完整合盘分析。',
    });
  }

  return streamChatToProjectSSE(payload);
}
