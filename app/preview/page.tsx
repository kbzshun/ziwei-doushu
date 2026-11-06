'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ScrollIntro from '@/components/ScrollIntro';

export default function PreviewPage() {
  const router = useRouter();
  // replayKey 用于强制重置 ScrollIntro（用户点"再播放一次"时）
  const [replayKey, setReplayKey] = useState(0);
  const [done, setDone] = useState(false);

  return (
    <>
      {/* 卷轴开场动画 */}
      <ScrollIntro key={replayKey} onComplete={() => setDone(true)} />

      {/* 动画结束后的「样片说明 + 操作按钮」面板 */}
      {done && (
        <div className="min-h-screen" style={{ background: 'var(--bg-0)' }}>
          <header className="glass-nav sticky top-0 z-40">
            <div className="container-page flex h-14 items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-1 text-[13px] transition-colors"
                style={{ color: 'var(--tx-3)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ac)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--tx-3)'; }}
              >
                <span style={{ fontSize: '16px' }}>‹</span>
                <span>返回</span>
              </button>
              <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
              <span className="text-[12px]" style={{ color: 'var(--ac)', letterSpacing: '0.2em' }}>紫微命盘</span>
            </div>
          </header>

          <main
            className="container-page flex min-h-[calc(100vh-56px)] flex-col items-center justify-center py-12 text-center"
            style={{ fontFamily: '"STSong", "Songti SC", serif' }}
          >
            <div className="eyebrow mb-4" style={{ letterSpacing: '0.4em' }}>
              SCROLL · INTRO · PREVIEW
            </div>
            <h1 className="text-[26px] font-semibold mb-4" style={{ color: 'var(--tx-0)', letterSpacing: '0.16em' }}>
              紫微卷轴 · 开场预览
            </h1>
            <p
              className="text-[12.5px] max-w-[500px] mb-9"
              style={{ color: 'var(--tx-2)', lineHeight: 1.9, letterSpacing: '0.1em' }}
            >
              刚才看到的卷轴效果会在每次进入主页时缓缓铺开。<br />
              如果满意，告诉我，我把它接到主页 / 上线。
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button
                onClick={() => { setDone(false); setReplayKey(k => k + 1); }}
                className="btn-accent"
                style={{ letterSpacing: '0.2em' }}
              >
                再 播 放 一 次
              </button>
              <button
                onClick={() => router.push('/')}
                className="btn-ghost"
                style={{ letterSpacing: '0.2em' }}
              >
                进 入 原 版 首 页
              </button>
            </div>

            <div
              className="mt-8 flex gap-5 text-[12px]"
              style={{ color: 'var(--tx-3)', letterSpacing: '0.15em' }}
            >
              <Link href="/" className="transition-colors hover:text-[color:var(--ac)]" style={{ color: 'inherit', textDecoration: 'none' }}>原版 ↗</Link>
              <span>·</span>
              <Link href="/chart" className="transition-colors hover:text-[color:var(--ac)]" style={{ color: 'inherit', textDecoration: 'none' }}>命盘</Link>
              <span>·</span>
              <Link href="/heming" className="transition-colors hover:text-[color:var(--ac)]" style={{ color: 'inherit', textDecoration: 'none' }}>合盘</Link>
            </div>

            {/* 时间轴说明 */}
            <div
              className="card-glass mt-12 max-w-[500px] px-4 py-5 text-left sm:px-8"
              style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.9, letterSpacing: '0.1em' }}
            >
              <div className="text-[11px] mb-3" style={{ color: 'var(--ac)', letterSpacing: '0.2em' }}>动画时间轴</div>
              <div>· 0.0 ~ 1.7 s &nbsp;&nbsp;卷轴从中央向两侧展开</div>
              <div>· 1.9 ~ 2.7 s &nbsp;&nbsp;宣纸内容浮现（标题 + 副标 + 朱砂印）</div>
              <div>· 2.7 ~ 3.5 s &nbsp;&nbsp;停留欣赏</div>
              <div>· 3.5 ~ 4.2 s &nbsp;&nbsp;整体淡出，进入主页</div>
              <div className="mt-3 text-[11px]" style={{ color: 'var(--tx-3)' }}>
                用户随时可点右下「跳过」直接进入主页。
              </div>
            </div>
          </main>
        </div>
      )}
    </>
  );
}
