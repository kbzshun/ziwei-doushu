/**
 * /library/[book] — 单部古籍目录页
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_BOOKS, getBookBySlug } from '@/lib/classics';

export async function generateStaticParams() {
  return ALL_BOOKS.map(b => ({ book: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) return {};
  return {
    title: `《${book.title}》· ${book.dynasty} · 紫微斗数古籍原典库`,
    description: book.intro,
  };
}

export default async function BookPage({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) notFound();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-0)' }}>
      <header className="glass-nav sticky top-0 z-40">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <Link href="/library" className="text-[12px] transition-colors hover:text-[color:var(--ac-hi)]"
            style={{ color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
            ← 古籍库
          </Link>
          <div className="hidden text-[12px] sm:block" style={{ color: 'var(--tx-3)', letterSpacing: '0.2em' }}>
            《{book.title}》
          </div>
          <Link href="/" className="text-[12px] transition-colors hover:text-[color:var(--ac-hi)]"
            style={{ color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
            首页 →
          </Link>
        </div>
      </header>

      <main className="container-page max-w-3xl py-10">
        {/* 书名信息 */}
        <div className="mb-8">
          <div className="eyebrow mb-2">{book.dynasty} · {book.author}</div>
          <h1 className="text-[26px] font-semibold" style={{ color: 'var(--tx-0)', letterSpacing: '0.08em' }}>
            《{book.title}》
          </h1>
          <p className="mt-3 max-w-[520px] text-[12.5px]" style={{ color: 'var(--tx-2)', lineHeight: 1.85 }}>
            {book.intro}
          </p>
        </div>

        {/* 章节目录 */}
        <div className="card-glass overflow-hidden">
          <div className="px-4 py-3 text-[11px] sm:px-5" style={{
            borderBottom: '1px solid var(--bdr)',
            color: 'var(--tx-3)',
            letterSpacing: '0.3em',
          }}>
            CHAPTERS · 章节目录
          </div>
          {book.chapters.map((chapter, i) => (
            <Link
              key={i}
              href={`/library/${book.slug}/${i}`}
              className="flex items-baseline gap-3.5 px-4 py-3.5 transition-colors hover:bg-[color:var(--glass-bg-2)] sm:px-5"
              style={{
                borderBottom: i === book.chapters.length - 1 ? 'none' : '1px solid var(--bdr)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div className="text-[12px] font-semibold min-w-[40px]" style={{ color: 'var(--ac)', letterSpacing: '0.1em' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-medium mb-0.5" style={{ color: 'var(--tx-0)', letterSpacing: '0.08em' }}>
                  {chapter.title}
                </div>
                {chapter.subtitle && (
                  <div className="text-[11px]" style={{ color: 'var(--tx-3)' }}>
                    {chapter.subtitle}
                  </div>
                )}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--tx-3)', letterSpacing: '0.1em' }}>
                {chapter.paragraphs.length} 段
              </div>
              <div className="text-[12px]" style={{ color: 'var(--ac)' }}>→</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
