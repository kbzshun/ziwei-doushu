/**
 * 从 AI 正文里抽取「六维评分」与三张结论卡片。
 *
 * 提示词会让模型在【六维评分】小节下只输出一行 JSON：
 *   {"综合":78,"事业":82,"财运":70,"感情":65,"性格":80,"健康":72}
 * 其余【核心优势】【关系模式】【成长课题】按普通分段读取。
 * 解析失败时返回 null，界面自动退化为纯文字，不影响其它内容。
 */

export interface RadarScore {
  key: string;
  label: string;
  value: number;
}

export interface InsightExtras {
  scores: RadarScore[];
  cards: { title: string; body: string }[];
}

const DIMENSION_ORDER = ['综合', '事业', '财运', '感情', '性格', '健康'] as const;

/** 按 `**【标题】**` 切段，返回 标题 → 正文 */
function splitSections(text: string): { title: string; body: string }[] {
  const out: { title: string; body: string }[] = [];
  let current: { title: string; body: string } | null = null;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    const match = line.match(/^\*\*【(.+?)】\*\*$/);
    if (match) {
      if (current) out.push(current);
      current = { title: match[1], body: '' };
      continue;
    }
    if (current) current.body += (current.body ? '\n' : '') + line;
  }
  if (current) out.push(current);
  return out;
}

function pickJsonObject(body: string): Record<string, unknown> | null {
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  const raw = body.slice(start, end + 1);
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // 常见脏数据：中文引号、多余逗号
    try {
      const cleaned = raw
        .replace(/[“”]/g, '"')
        .replace(/,\s*}/g, '}')
        .replace(/(\d)\s*分/g, '$1');
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

export function parseInsightExtras(text: string): InsightExtras | null {
  if (!text) return null;

  const sections = splitSections(text);
  if (sections.length === 0) return null;

  let scores: RadarScore[] = [];

  const scoreSection = sections.find(s => s.title.includes('评分'));
  if (scoreSection) {
    const obj = pickJsonObject(scoreSection.body);
    if (obj) {
      scores = DIMENSION_ORDER.flatMap(label => {
        const raw = obj[label];
        const num = typeof raw === 'number' ? raw : Number(raw);
        if (!Number.isFinite(num)) return [];
        return [{ key: label, label, value: Math.max(0, Math.min(100, Math.round(num))) }];
      });
    }
  }

  const CARD_TITLES = ['核心优势', '关系模式', '成长课题'];
  const cards = CARD_TITLES.flatMap(title => {
    const sec = sections.find(s => s.title.includes(title));
    if (!sec) return [];
    const body = sec.body
      .split('\n')
      .filter(line => line && !/^\{.*\}$/.test(line))
      .join('')
      .trim();
    if (!body) return [];
    return [{ title, body }];
  });

  if (scores.length === 0 && cards.length === 0) return null;
  return { scores, cards };
}

/** 评分小节本身是给机器读的，渲染正文时应跳过 */
export function stripMachineSections(text: string): string {
  const sections = splitSections(text);
  if (sections.length === 0) return text;
  return sections
    .filter(s => !s.title.includes('评分'))
    .map(s => `**【${s.title}】**\n${s.body}`)
    .join('\n\n');
}
