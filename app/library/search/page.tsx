/**
 * /library/search?q=xxx — 搜索结果页
 */

import Link from 'next/link';
import { searchClassics, getParagraphById } from '@/lib/classics';

export const metadata = {
  title: '搜索 · 古籍原典库',
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const hits = q ? searchClassics(q, 50) : [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-0)' }}>
      <header className="glass-nav sticky top-0 z-40">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <Link href="/library" className="text-[12px] transition-colors hover:text-[color:var(--ac-hi)]"
            style={{ color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
            ← 古籍库
          </Link>
          <div className="hidden text-[12px] sm:block" style={{ color: 'var(--tx-3)', letterSpacing: '0.2em' }}>
            搜索结果
          </div>
          <Link href="/" className="text-[12px] transition-colors hover:text-[color:var(--ac-hi)]"
            style={{ color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
            首页 →
          </Link>
        </div>
      </header>

      <main className="container-page max-w-3xl py-10">
        <div className="eyebrow mb-2">搜索关键词</div>
        <h1 className="text-[26px] font-semibold" style={{ color: 'var(--tx-0)', letterSpacing: '0.06em' }}>
          「{q || '（空）'}」
        </h1>
        <p className="mt-2 mb-8 text-[12.5px]" style={{ color: 'var(--tx-2)' }}>
          共找到 <strong style={{ color: 'var(--ac)' }}>{hits.length}</strong> 条古籍原文匹配
        </p>

        {hits.length === 0 ? (
          <div className="card-glass px-4 py-10 text-center sm:px-5" style={{ color: 'var(--tx-2)' }}>
            <div className="text-[40px] mb-3" style={{ opacity: 0.4 }}>📜</div>
            {q ? (
              <>
                <div className="text-[14px] mb-1.5">暂未在已收录古籍中找到这个关键词</div>
                <div className="text-[11px] leading-7" style={{ color: 'var(--tx-3)' }}>
                  我们持续补充内容中。可尝试搜索：<br />
                  <span style={{ color: 'var(--ac)' }}>七杀朝斗 / 双禄朝垣 / 化忌 / 紫微 / 命宫 / 机月同梁</span>
                </div>
              </>
            ) : (
              <div className="text-[13px]">请输入要搜索的关键词</div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {hits.map((hit, i) => {
              const ctx = getParagraphById(hit.paragraphId);
              const chapterIdx = ctx?.chapterIdx ?? 0;
              return (
                <Link
                  key={i}
                  href={`/library/${hit.bookSlug}/${chapterIdx}#${hit.paragraphId}`}
                  className="card-glass hover-lift block px-4 py-4 sm:px-5"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="flex items-center gap-2 text-[11px] mb-2" style={{
                    color: 'var(--tx-3)',
                    letterSpacing: '0.1em',
                  }}>
                    <span style={{ color: 'var(--ac)', fontWeight: 600 }}>《{hit.bookTitle}》</span>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span>{hit.chapterTitle}</span>
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'var(--tx-0)',
                      lineHeight: 1.9,
                      letterSpacing: '0.02em',
                    }}
                    dangerouslySetInnerHTML={{ __html: hit.snippet }}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <style>{`
        mark { background: var(--ac-bg); color: var(--ac-hi); padding: 0 2px; border-radius: 2px; font-weight: 600; }
      `}</style>
    </div>
  );
}
