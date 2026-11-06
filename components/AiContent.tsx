'use client';
import { parseAiMarkdown } from '@/lib/ai/markdown-lite';

interface AiContentProps {
  text: string;
  /** 流式输出中：末尾显示光标 */
  streaming?: boolean;
  /** 正文字号：sm 用于侧栏，md 用于整页阅读 */
  size?: 'sm' | 'md';
}

/**
 * AI 解读正文渲染。
 * 屏幕上的视觉稿：`**【小标题】**` → 金色小标题，`**加粗**` → 高亮文字。
 * 打印时走 AnalysisReport 的同源解析，不共用这里的配色。
 */
export default function AiContent({ text, streaming, size = 'sm' }: AiContentProps) {
  const blocks = parseAiMarkdown(text);
  const body = size === 'md' ? 'text-[13px] leading-7' : 'text-[12px] leading-6';

  return (
    <div className="space-y-1">
      {blocks.map((block, i) => {
        if (block.kind === 'blank') return <div key={i} className="h-1.5" />;

        if (block.kind === 'section') {
          return (
            <div key={i} className="pt-4 first:pt-0 flex items-center gap-2">
              <span
                className="h-3 w-[2px] rounded-full"
                style={{ background: 'linear-gradient(180deg, var(--ac-hi), var(--ac-dim))' }}
              />
              <span className="text-[11px] font-semibold tracking-wider" style={{ color: 'var(--ac)' }}>
                {block.title}
              </span>
            </div>
          );
        }

        if (block.kind === 'heading') {
          return (
            <div
              key={i}
              className={
                block.level === 1
                  ? 'text-[14px] font-semibold pt-3'
                  : block.level === 2
                    ? 'text-[13px] font-semibold pt-2'
                    : 'text-[12px] font-semibold pt-2'
              }
              style={{ color: 'var(--tx-0)' }}
            >
              {block.text}
            </div>
          );
        }

        if (block.kind === 'bullet') {
          return (
            <div key={i} className={`flex gap-2 ${body}`} style={{ color: 'var(--tx-2)' }}>
              <span className="mt-[9px] h-[3px] w-[3px] flex-shrink-0 rounded-full" style={{ background: 'var(--ac)' }} />
              <span>
                {block.spans.map((s, j) =>
                  s.bold
                    ? <strong key={j} className="font-medium" style={{ color: 'var(--tx-0)' }}>{s.text}</strong>
                    : <span key={j}>{s.text}</span>,
                )}
              </span>
            </div>
          );
        }

        return (
          <p key={i} className={body} style={{ color: 'var(--tx-2)' }}>
            {block.spans.map((s, j) =>
              s.bold
                ? <strong key={j} className="font-medium" style={{ color: 'var(--tx-0)' }}>{s.text}</strong>
                : <span key={j}>{s.text}</span>,
            )}
          </p>
        );
      })}

      {streaming && (
        <span
          className="inline-block h-3 w-1.5 animate-pulse rounded-sm align-middle"
          style={{ background: 'var(--ac)', opacity: 0.7 }}
        />
      )}
    </div>
  );
}
