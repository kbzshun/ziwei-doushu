/**
 * /knowledge — 知识库主页
 * 列出 14 主星，每星可看其在 13 宫位的解读
 */

import Link from 'next/link';
import { ALL_STARS, ALL_TOPICS, getKnowledge, STAR_BRIEF_SEO, STAR_TO_SLUG } from '@/lib/seo/knowledge';
import { TOPIC_LABEL } from '@/lib/ziwei/db-analysis';

export const metadata = {
  title: '紫微斗数知识库 · 14 主星 × 13 宫位 · 倪海厦正宗体系',
  description: '基于倪海厦《天纪》体系与古籍《紫微斗数全集》《骨髓赋》编纂的紫微斗数知识库。覆盖 14 主星在 13 个宫位的完整论断，含一句话定调、核心论断、命盘依据、经典出处。',
  keywords: ['紫微斗数', '倪海厦', '倪海厦紫微斗数', '紫微斗数全集', '紫微斗数全书', '14 主星', '12 宫位'],
};

export default function KnowledgeHomePage() {
  const STAR_DESCRIPTIONS_QUICK = STAR_BRIEF_SEO;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-0)' }}>
      {/* 顶栏 */}
      <header className="glass-nav sticky top-0 z-40">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <Link href="/" className="text-[12px] transition-colors hover:text-[color:var(--ac-hi)]"
            style={{ color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
            ← 首页
          </Link>
          <div className="text-[12px]" style={{ color: 'var(--tx-3)', letterSpacing: '0.2em' }}>
            倪师方法论 · 知识库
          </div>
          <Link href="/library" className="text-[12px] transition-colors hover:text-[color:var(--ac-hi)]"
            style={{ color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
            古籍 →
          </Link>
        </div>
      </header>

      <main className="container-page py-10">
        {/* 标题区 */}
        <div className="eyebrow mb-2">KNOWLEDGE BASE</div>
        <h1 className="text-[26px] font-semibold" style={{ color: 'var(--tx-0)' }}>紫微斗数知识库</h1>
        <p className="mt-2 mb-8 max-w-[640px] text-[12.5px]" style={{ color: 'var(--tx-2)', lineHeight: 1.8 }}>
          14 主星 × 13 宫位 = <strong style={{ color: 'var(--ac)' }}>{ALL_STARS.length * ALL_TOPICS.length}</strong> 项专题
          · 基于倪海厦《天纪》体系编纂 · 含古籍引证
        </p>

        {/* 14 主星卡片 */}
        <div className="label-section mb-3">十四主星</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {ALL_STARS.map(star => (
            <Link
              key={star}
              href={`/knowledge/${STAR_TO_SLUG[star]}/overview`}
              className="card-glass hover-lift block px-3 py-3.5 text-center"
              style={{ textDecoration: 'none' }}
            >
              <div className="text-[18px] font-bold" style={{ color: 'var(--tx-0)', letterSpacing: '0.15em' }}>
                {star}
              </div>
            </Link>
          ))}
        </div>

        {/* 详细列表（每个主星 + 简介 + 进入按钮） */}
        <div className="mt-12 space-y-4">
          {ALL_STARS.map(star => (
            <div key={star} className="card-glass p-4 sm:p-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-[20px] font-bold" style={{ color: 'var(--tx-0)', letterSpacing: '0.1em' }}>
                  {star}星
                </span>
                <span className="text-[11px]" style={{ color: 'var(--tx-3)', letterSpacing: '0.15em' }}>
                  ZI WEI · 14 STARS
                </span>
              </div>
              <p className="text-[12px] mb-3" style={{ color: 'var(--tx-2)', lineHeight: 1.7 }}>
                {STAR_DESCRIPTIONS_QUICK[star] || ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_TOPICS.map(t => {
                  const k = getKnowledge(star, t);
                  if (!k.exists) return null;
                  return (
                    <Link
                      key={t}
                      href={`/knowledge/${STAR_TO_SLUG[star]}/${t}`}
                      className="chip transition-colors hover:border-[color:var(--ac-bdr)] hover:text-[color:var(--ac)]"
                      style={{ textDecoration: 'none' }}
                    >
                      入{k.palaceName} · {TOPIC_LABEL[t]}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
