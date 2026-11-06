/**
 * /knowledge/[star]/[topic] — SEO 落地页
 *
 * 14 主星 × 13 topic = 182 个独立 URL
 * 每页含完整的 STAR_DB 4 段论断（一句话定调/核心论断/命盘依据/经典出处）
 *
 * SEO 要点：
 *  - title 含主关键词（如"紫微入命宫·倪海厦体系详解"）
 *  - description 用 dingdiao（一句话定调）
 *  - JSON-LD Article 结构化数据
 *  - 内链：同主星其他 12 宫 + 同宫其他 13 主星
 *  - generateStaticParams 静态生成，零运行时开销
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
import {
  ALL_STARS,
  ALL_TOPICS,
  getKnowledge,
  getAllKnowledgeRoutes,
  STAR_BRIEF_SEO,
  STAR_TO_SLUG,
  SLUG_TO_STAR,
} from '@/lib/seo/knowledge';
import { SITE_URL } from '@/lib/site';

// 允许动态参数：如果某个 star/topic 组合不在 generateStaticParams 列表中
// 也允许运行时按需渲染，避免中文 URL 编码问题导致 404
export const dynamicParams = false;

export async function generateStaticParams() {
  const routes = getAllKnowledgeRoutes();
  // URL 用拼音 slug 替代中文，避开 Vercel/CDN 中文路由边界问题
  return routes.map(r => ({ star: r.slug, topic: r.topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const star = SLUG_TO_STAR[slug];
  if (!star) return {};
  const data = getKnowledge(star, topic as TopicKey);
  if (!data.exists) return {};

  const title = `${star}入${data.palaceName}宫 · ${data.topicLabel} · 倪海厦体系详解`;
  const description = data.parsed.dingdiao
    || `${star}入${data.palaceName}宫的紫微斗数解读 — 基于倪海厦《天纪》体系与古籍《紫微斗数全集》《骨髓赋》。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}/knowledge/${slug}/${topic}`,
    },
    alternates: {
      canonical: `${SITE_URL}/knowledge/${slug}/${topic}`,
    },
    keywords: [
      '紫微斗数', '倪海厦', star, data.palaceName, data.topicLabel,
      `${star}${data.palaceName}`, `${star}入${data.palaceName}`,
      `紫微斗数 ${star}`, '倪海厦紫微斗数', '紫微斗数全集',
    ],
  };
}

export default async function KnowledgePage({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const star = SLUG_TO_STAR[slug];
  if (!star) notFound();
  const data = getKnowledge(star, topic as TopicKey);
  if (!data.exists) notFound();

  // 同主星其他 topic
  const otherTopicsForStar = ALL_TOPICS.filter(t => t !== topic && getKnowledge(star, t).exists);
  // 同 topic 其他主星
  const otherStarsForTopic = ALL_STARS.filter(s => s !== star && getKnowledge(s, topic as TopicKey).exists);

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${star}入${data.palaceName}宫 · ${data.topicLabel}`,
    description: data.parsed.dingdiao,
    author: { '@type': 'Organization', name: '紫微研究 · 倪海厦正宗' },
    publisher: {
      '@type': 'Organization',
      name: '紫微研究',
      url: SITE_URL,
    },
    datePublished: '2026-04-28',
    dateModified: '2026-04-28',
    mainEntityOfPage: `${SITE_URL}/knowledge/${slug}/${topic}`,
    articleSection: '紫微斗数 · 倪海厦体系',
    keywords: [`紫微斗数`, star, data.palaceName, data.topicLabel].join(', '),
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-0)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* 顶栏 */}
      <header className="glass-nav sticky top-0 z-40">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <Link href="/" className="text-[12px] transition-colors hover:text-[color:var(--ac-hi)]"
            style={{ color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
            ← 首页
          </Link>
          <div className="hidden text-[12px] sm:block" style={{ color: 'var(--tx-3)', letterSpacing: '0.2em' }}>
            倪师方法论 · 知识库
          </div>
          <Link href="/chart" className="text-[12px] transition-colors hover:text-[color:var(--ac-hi)]"
            style={{ color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
            起盘 →
          </Link>
        </div>
      </header>

      <article className="container-page max-w-3xl py-10">
        {/* 面包屑 */}
        <nav className="mb-4 text-[11px]" style={{ color: 'var(--tx-3)', letterSpacing: '0.1em' }}>
          <Link href="/" className="transition-colors hover:text-[color:var(--ac)]"
            style={{ color: 'var(--tx-3)', textDecoration: 'none' }}>首页</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href="/knowledge" className="transition-colors hover:text-[color:var(--ac)]"
            style={{ color: 'var(--tx-3)', textDecoration: 'none' }}>知识库</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>{star}</span>
          <span style={{ margin: '0 8px' }}>·</span>
          <span style={{ color: 'var(--ac)' }}>{data.palaceName}宫</span>
        </nav>

        {/* 标题区 */}
        <div className="mb-8">
          <div className="eyebrow mb-2">
            {data.topicLabel} · 倪海厦体系详解
          </div>
          <h1 className="text-[26px] font-semibold" style={{ color: 'var(--tx-0)', letterSpacing: '0.06em', lineHeight: 1.3 }}>
            {star}入{data.palaceName}宫
          </h1>
          {STAR_BRIEF_SEO[star] && (
            <p className="mt-3 text-[12.5px]" style={{ color: 'var(--tx-2)', lineHeight: 1.85 }}>
              {STAR_BRIEF_SEO[star]}
            </p>
          )}
        </div>

        {/* 内容 4 段 */}
        {data.parsed.dingdiao && (
          <Section title="一句话定调" gradient>
            <p style={{ fontSize: '17px', color: 'var(--tx-0)', lineHeight: 1.9, fontWeight: 500, letterSpacing: '0.04em' }}>
              {data.parsed.dingdiao}
            </p>
          </Section>
        )}

        {data.parsed.lundian && (
          <Section title="核心论断">
            <div style={{ fontSize: '15px', color: 'var(--tx-0)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
              {data.parsed.lundian}
            </div>
          </Section>
        )}

        {data.parsed.yiju && (
          <Section title="命盘依据">
            <div style={{ fontSize: '14px', color: 'var(--tx-1)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
              {data.parsed.yiju}
            </div>
          </Section>
        )}

        {data.parsed.chuchu && (
          <Section title="经典出处" minimal>
            <div style={{ fontSize: '13px', color: 'var(--tx-2)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
              {data.parsed.chuchu}
            </div>
          </Section>
        )}

        {/* CTA */}
        <div className="card-glass my-8 px-4 py-6 text-center sm:px-6"
          style={{ background: 'var(--ac-bg)', borderColor: 'var(--ac-bdr)' }}>
          <div className="text-[14px] font-semibold mb-1.5" style={{ color: 'var(--tx-0)', letterSpacing: '0.1em' }}>
            想看你自己命盘的{data.topicLabel}？
          </div>
          <div className="text-[12px] mb-4" style={{ color: 'var(--tx-2)' }}>
            输入生辰起盘 · 倪师正宗解读 · AI 答疑伴学
          </div>
          <Link href="/chart" className="btn-accent">
            立即起盘 →
          </Link>
        </div>

        {/* 内链：同主星其他 topic */}
        <Section title={`${star}星的其他宫位解读`} minimal>
          <div className="flex flex-wrap gap-2">
            {otherTopicsForStar.map(t => {
              const d = getKnowledge(star, t);
              return (
                <Link
                  key={t}
                  href={`/knowledge/${slug}/${t}`}
                  className="chip transition-colors hover:border-[color:var(--ac-bdr)] hover:text-[color:var(--ac)]"
                  style={{ textDecoration: 'none', fontSize: '12px' }}
                >
                  {star}入{d.palaceName}
                </Link>
              );
            })}
          </div>
        </Section>

        {/* 内链：同 topic 其他主星 */}
        <Section title={`其他主星入${data.palaceName}宫的解读`} minimal>
          <div className="flex flex-wrap gap-2">
            {otherStarsForTopic.slice(0, 13).map(s => (
              <Link
                key={s}
                href={`/knowledge/${STAR_TO_SLUG[s]}/${topic}`}
                className="chip transition-colors hover:border-[color:var(--ac-bdr)] hover:text-[color:var(--ac)]"
                style={{ textDecoration: 'none', fontSize: '12px' }}
              >
                {s}入{data.palaceName}
              </Link>
            ))}
          </div>
        </Section>

        {/* 古籍库链接 */}
        <div className="card-inner mt-8 px-4 py-4 text-center">
          <div className="text-[11px] mb-1.5" style={{ color: 'var(--ac)', letterSpacing: '0.15em', opacity: 0.85 }}>
            想读原典？
          </div>
          <Link href="/library" className="text-[13px] font-medium transition-colors hover:text-[color:var(--ac-hi)]"
            style={{ color: 'var(--ac)', letterSpacing: '0.1em', textDecoration: 'none' }}>
            📜 查阅古籍原典库 — 紫微斗数全集 / 全书 / 骨髓赋 →
          </Link>
        </div>
      </article>

      {/* 页脚 */}
      <footer className="container-page py-6 text-center text-[11px]" style={{ borderTop: '1px solid var(--bdr)', color: 'var(--tx-3)', letterSpacing: '0.1em' }}>
        <div style={{ marginBottom: '6px' }}>紫微研究 · 基于倪海厦正宗体系 · 仅供学习参考</div>
        <div style={{ opacity: 0.85 }}>本平台不构成任何医疗、投资、法律或重大决策建议</div>
      </footer>
    </div>
  );
}

function Section({ title, children, gradient, minimal }: { title: string; children: React.ReactNode; gradient?: boolean; minimal?: boolean }) {
  return (
    <section style={{ marginBottom: minimal ? '20px' : '26px' }}>
      <h2 className="eyebrow inline-flex items-center gap-2 mb-3" style={{ fontSize: '11px', letterSpacing: '0.2em' }}>
        <span style={{ width: '4px', height: '12px', background: 'var(--ac)', borderRadius: '2px' }} />
        {title}
      </h2>
      <div
        className={minimal ? 'card-inner px-4 py-3.5' : 'card-inner px-4 py-5 sm:px-5'}
        style={gradient ? { background: 'var(--ac-bg)', borderColor: 'var(--ac-bdr)' } : undefined}
      >
        {children}
      </div>
    </section>
  );
}
