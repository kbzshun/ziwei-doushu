/**
 * 古籍原典查询库 · 主页
 *
 * 列出所有收录古籍 + 全局搜索入口
 */

import Link from 'next/link';
import { ALL_BOOKS, TOTAL_PARAGRAPHS } from '@/lib/classics';
import LibrarySearch from './LibrarySearch';

export const metadata = {
  title: '倪师方法论 · 古籍原典库 · 紫微斗数全集 / 全书 / 骨髓赋',
  description: '紫微斗数权威古籍全文检索：《紫微斗数全集》《紫微斗数全书》《骨髓赋》倪海厦《天纪》引证来源',
};

export default function LibraryHomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-0)' }}>
      {/* 顶栏 */}
      <header className="glass-nav sticky top-0 z-40">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <Link href="/" className="text-[12px] transition-colors hover:text-[color:var(--ac-hi)]"
            style={{ color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
            ← 返回首页
          </Link>
          <div className="hidden text-[12px] sm:block" style={{ color: 'var(--tx-3)', letterSpacing: '0.3em' }}>
            古籍原典库 · CLASSICS
          </div>
          <Link href="/chart" className="text-[12px] transition-colors hover:text-[color:var(--ac-hi)]"
            style={{ color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
            起盘 →
          </Link>
        </div>
      </header>

      <main className="container-page py-10">
        {/* 标题区 */}
        <div className="eyebrow mb-2">NI HAI XIA · CURRICULUM</div>
        <h1 className="text-[26px] font-semibold" style={{ color: 'var(--tx-0)' }}>倪师方法论 · 古籍原典库</h1>
        <p className="mt-2 mb-8 max-w-[620px] text-[12.5px]" style={{ color: 'var(--tx-2)', lineHeight: 1.8 }}>
          紫微斗数权威古籍全文检索 · 收录 <strong style={{ color: 'var(--ac)' }}>{ALL_BOOKS.length}</strong> 部古籍
          · 共 <strong style={{ color: 'var(--ac)' }}>{TOTAL_PARAGRAPHS}</strong> 段精华
        </p>

        {/* 搜索 */}
        <div className="max-w-2xl mb-8">
          <LibrarySearch />
        </div>

        {/* 古籍列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ALL_BOOKS.map(book => (
            <Link
              key={book.slug}
              href={`/library/${book.slug}`}
              className="card-glass hover-lift block p-4 sm:p-6"
              style={{ textDecoration: 'none' }}
            >
              <div className="text-[11px] mb-1.5" style={{ color: 'var(--tx-3)', letterSpacing: '0.2em' }}>
                {book.dynasty} · {book.author.split(' ')[0]}
              </div>
              <div className="text-[20px] font-semibold mb-2.5" style={{ color: 'var(--tx-0)', letterSpacing: '0.1em' }}>
                《{book.title}》
              </div>
              <div className="text-[12px] mb-3.5" style={{ color: 'var(--tx-2)', lineHeight: 1.7 }}>
                {book.intro}
              </div>
              <div className="flex gap-3 text-[11px]" style={{ color: 'var(--tx-3)' }}>
                <span>{book.chapters.length} 章节</span>
                <span style={{ color: 'var(--ac-bdr)' }}>·</span>
                <span>{book.chapters.reduce((s, c) => s + c.paragraphs.length, 0)} 段精华</span>
              </div>
              <div className="inline-flex mt-3.5 text-[11px] font-medium" style={{
                color: 'var(--ac)',
                letterSpacing: '0.15em',
              }}>
                进入查阅 →
              </div>
            </Link>
          ))}
        </div>

        {/* 底部说明 */}
        <div className="card-inner mt-12 px-4 py-6 text-center sm:px-6"
          style={{ background: 'var(--ac-bg)', borderColor: 'var(--ac-bdr)' }}>
          <div className="text-[11px] font-semibold mb-2" style={{ color: 'var(--ac)', letterSpacing: '0.15em' }}>
            关于本库
          </div>
          <div className="text-[12px] max-w-[600px] mx-auto" style={{ color: 'var(--tx-2)', lineHeight: 1.8 }}>
            所收录古籍均为公版（明代刊本）。<br />
            内容持续完善，未来将补全《紫微斗数全集》全本与倪海厦《天纪》引证目录。<br />
            如发现任何错误请联系我们。
          </div>
        </div>
      </main>
    </div>
  );
}
