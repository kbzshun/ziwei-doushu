import type { Metadata } from 'next';
import Link from 'next/link';
import { PLANS } from '@/lib/plans';

export const metadata: Metadata = {
  title: '会员套餐 · 紫微命盘',
  description: '解锁感情以外的十二宫位、大限流年与四化解读',
};

export default function PricingPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-14">
      <div className="mb-10 text-center">
        <div className="eyebrow mb-3">PRICING</div>
        <h1 className="mb-3 text-[30px] font-semibold tracking-wide" style={{ color: 'var(--tx-0)' }}>
          会员套餐
        </h1>
        <p className="mx-auto max-w-md text-[12.5px] leading-7" style={{ color: 'var(--tx-2)' }}>
          免费可用：排盘、命格总览、财运、事业、感情、性格、健康（每日 10 次 AI 解读）。
          升级后解锁十二宫位、大限/流年/流月/流日/流时与四化解读，且不限次数。
        </p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className="card-glass hover-lift flex flex-col p-5"
            style={plan.highlight ? { borderColor: 'var(--ac)', boxShadow: 'var(--glow-ac)' } : undefined}
          >
            {plan.highlight && (
              <span className="chip chip-ac mb-2 self-start">最受欢迎</span>
            )}
            <div className="text-[13px] font-medium" style={{ color: 'var(--tx-2)' }}>{plan.name}</div>
            <div className="my-1 flex items-baseline gap-1">
              <span className="text-[12px]" style={{ color: 'var(--ac)' }}>¥</span>
              <span className="text-[30px] font-semibold tabular-nums" style={{ color: 'var(--tx-0)' }}>{plan.price}</span>
              <span className="text-[11px]" style={{ color: 'var(--tx-3)' }}>/ {plan.period}</span>
            </div>
            <p className="mb-4 flex-1 text-[11.5px] leading-6" style={{ color: 'var(--tx-2)' }}>{plan.desc}</p>
            <a href="/chart" className={plan.highlight ? 'btn-accent !py-2 !text-center !text-[12px]' : 'btn-glass !py-2 !text-center !text-[12px]'}>
              去解锁
            </a>
          </div>
        ))}
      </div>

      <div className="card-glass p-6 text-center">
        <div className="mb-3 text-[13px] font-semibold" style={{ color: 'var(--tx-0)' }}>怎么开通</div>
        <ol className="mx-auto max-w-md space-y-2 text-left text-[11.5px] leading-6" style={{ color: 'var(--tx-2)' }}>
          <li>1. 扫码付款，金额对应上面的套餐；</li>
          <li>2. 付款备注里写上「要兑换码」，或直接把订单号发给作者；</li>
          <li>3. 作者核对后发你一串兑换码（形如 <span className="font-mono">ZW-7K3F9</span>）；</li>
          <li>4. 回到排盘页，点任意付费功能 → 输入兑换码 → 立即解锁。</li>
        </ol>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/redeem-qr.png"
          alt="微信收款码"
          className="mx-auto mt-5 w-44 rounded-lg"
          style={{ border: '1px solid var(--bdr)' }}
        />
        <div className="mt-6">
          <Link href="/" className="btn-glass">← 返回首页</Link>
        </div>
      </div>
    </main>
  );
}
