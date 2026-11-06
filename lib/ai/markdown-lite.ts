/**
 * AI 输出的轻量排版解析。
 *
 * 模型按提示词返回的格式固定为：
 *   **【小标题】**
 *   正文，**加粗**强调
 *   - 列表项
 *
 * 这里只做「分块 + 加粗」两级解析，不引入 markdown 依赖：
 * 屏幕上由 AiContent 渲染成金色小标题，打印时由 AnalysisReport 渲染成 h3/strong。
 */

export interface InlineSpan {
  text: string;
  bold: boolean;
}

export type AiBlock =
  | { kind: 'section'; title: string }
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'bullet'; spans: InlineSpan[] }
  | { kind: 'text'; spans: InlineSpan[] }
  | { kind: 'blank' };

/** 把 `**加粗**` 切成普通片段与加粗片段 */
function splitInline(line: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  const parts = line.split(/\*\*(.+?)\*\*/g);
  parts.forEach((part, i) => {
    if (!part) return;
    spans.push({ text: part, bold: i % 2 === 1 });
  });
  return spans.length > 0 ? spans : [{ text: line, bold: false }];
}

export function parseAiMarkdown(raw: string): AiBlock[] {
  if (!raw) return [];
  const blocks: AiBlock[] = [];

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push({ kind: 'blank' });
      continue;
    }

    // 机器可读的评分行（{"综合":78,...}）不展示给用户
    if (/^\{.*\}$/.test(trimmed)) {
      continue;
    }

    // **【命格定性】**
    const section = trimmed.match(/^\*\*【(.+?)】\*\*$/);
    if (section) {
      blocks.push({ kind: 'section', title: section[1] });
      continue;
    }

    // ### 三级标题
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({
        kind: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2].trim(),
      });
      continue;
    }

    // - 列表项
    const bullet = trimmed.match(/^[-*·]\s+(.+)$/);
    if (bullet) {
      blocks.push({ kind: 'bullet', spans: splitInline(bullet[1]) });
      continue;
    }

    blocks.push({ kind: 'text', spans: splitInline(trimmed) });
  }

  return blocks;
}

/** 抽取纯文本块的小标题，用于生成报告目录 */
export function listSections(raw: string): string[] {
  return parseAiMarkdown(raw)
    .filter((b): b is Extract<AiBlock, { kind: 'section' }> => b.kind === 'section')
    .map(b => b.title);
}
