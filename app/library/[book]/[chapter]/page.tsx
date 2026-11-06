/**
 * /library/[book]/[chapter] — 单章节阅读页
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_BOOKS, getChapter } from '@/lib/classics';

export async function generateStaticParams() {
  return ALL_BOOKS.flatMap(b =>
    b.chapters.map((_, i) => ({ book: b.slug, chapter: String(i) }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book: bookSlug, chapter: chIdx } = await params;
  const result = getChapter(bookSlug, parseInt(chIdx));
  if (!result) return {};
  return {
    title: `${result.chapter.title} · 《${result.book.title}》· 紫微斗数古籍`,
    description: result.chapter.subtitle || `《${result.book.title}》${result.chapter.title}原文`,
  };
}

export default async function ChapterPage({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book: bookSlug, chapter: chIdx } = await params;
  const result = getChapter(bookSlug, parseInt(chIdx));
  if (!result) notFound();

  const { book, chapter, chapterIdx } = result;
  const prevIdx = chapterIdx - 1;
  const nextIdx = chapterIdx + 1;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-0)' }}>
      <header className="glass-nav sticky top-0 z-40">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <Link href={`/library/${book.slug}`} className="text-[12px] transition-colors hover:text-[color:var(--ac-hi)]"
            style={{ color: 'var(--ac)', letterSpacing: '0.15em', textDecoration: 'none' }}>
            ← 《{book.title}》目录
          </Link>
          <div className="hidden text-[12px] sm:block" style={{ color: 'var(--tx-3)', letterSpacing: '0.15em' }}>
            {chapter.title}
          </div>
          <Link href="/library" className="text-[12px] transition-colors hover:text-[color:var(--ac-hi)]"
            style={{ color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
            古籍库 →
          </Link>
        </div>
      </header>

      <article className="container-page max-w-3xl py-10">
        {/* 标题 */}
        <div className="mb-8">
          <div className="eyebrow mb-2">《{book.title}》· {book.dynasty}</div>
          <h1 className="text-[26px] font-semibold" style={{ color: 'var(--tx-0)', letterSpacing: '0.08em' }}>
            {chapter.title}
          </h1>
          {chapter.subtitle && (
            <div className="mt-2 text-[12.5px]" style={{ color: 'var(--tx-2)', letterSpacing: '0.1em' }}>
              {chapter.subtitle}
            </div>
          )}
        </div>

        {/* 段落 */}
        <div className="card-glass px-4 py-6 sm:px-7 sm:py-8">
          {chapter.paragraphs.map((p, i) => (
            <div
              key={p.id}
              id={p.id}
              style={{
                marginBottom: i === chapter.paragraphs.length - 1 ? 0 : '20px',
                paddingBottom: i === chapter.paragraphs.length - 1 ? 0 : '20px',
                borderBottom: i === chapter.paragraphs.length - 1 ? 'none' : '1px solid var(--bdr)',
                scrollMarginTop: '80px',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
              }}>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--ac)',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  minWidth: '24px',
                }}>
                  {String(p.idx).padStart(2, '0')}
                </span>
                <p style={{
                  flex: 1,
                  fontSize: '16px',
                  color: 'var(--tx-0)',
                  lineHeight: 2,
                  letterSpacing: '0.04em',
                  fontFamily: '"PingFang SC", "Hiragino Sans GB", serif',
                }}>
                  {p.text}
                </p>
              </div>
              {p.translation && (
                <div className="card-inner" style={{
                  marginTop: '8px',
                  marginLeft: '36px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  color: 'var(--tx-2)',
                  lineHeight: 1.8,
                }}>
                  <span style={{ fontSize: '10px', color: 'var(--ac)', marginRight: '6px' }}>白话</span>
                  {p.translation}
                </div>
              )}
              {p.niNote && (
                <div className="card-inner" style={{
                  marginTop: '8px',
                  marginLeft: '36px',
                  padding: '8px 12px',
                  borderLeft: '2px solid var(--ji)',
                  fontSize: '13px',
                  color: 'var(--tx-2)',
                  lineHeight: 1.8,
                }}>
                  <span style={{ fontSize: '10px', color: 'var(--ji)', marginRight: '6px' }}>倪师注</span>
                  {p.niNote}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 章节导航 */}
        <div className="mt-5 flex justify-between gap-3">
          {prevIdx >= 0 ? (
            <Link
              href={`/library/${book.slug}/${prevIdx}`}
              className="card-inner hover-lift flex-1 px-4 py-3.5"
              style={{ textDecoration: 'none', color: 'var(--tx-0)' }}
            >
              <div className="text-[10px] mb-0.5" style={{ color: 'var(--tx-3)', letterSpacing: '0.2em' }}>← 上一章</div>
              <div className="text-[13px] font-medium">{book.chapters[prevIdx].title}</div>
            </Link>
          ) : <div className="flex-1" />}
          {nextIdx < book.chapters.length ? (
            <Link
              href={`/library/${book.slug}/${nextIdx}`}
              className="card-inner hover-lift flex-1 px-4 py-3.5 text-right"
              style={{ textDecoration: 'none', color: 'var(--tx-0)' }}
            >
              <div className="text-[10px] mb-0.5" style={{ color: 'var(--tx-3)', letterSpacing: '0.2em' }}>下一章 →</div>
              <div className="text-[13px] font-medium">{book.chapters[nextIdx].title}</div>
            </Link>
          ) : <div className="flex-1" />}
        </div>
      </article>
    </div>
  );
}
