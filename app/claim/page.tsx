'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ClaimPage() {
  const [order, setOrder] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!order.trim() || busy) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: order.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; code?: string; error?: string };
      if (data.ok && data.code) setCode(data.code);
      else setMsg(data.error ?? '查询失败');
    } catch {
      setMsg('网络异常，请稍后重试');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-14">
      <div className="mb-8 text-center">
        <div className="eyebrow mb-3">CLAIM</div>
        <h1 className="mb-3 text-[26px] font-semibold" style={{ color: 'var(--tx-0)' }}>领取兑换码</h1>
        <p className="text-[12px] leading-7" style={{ color: 'var(--tx-2)' }}>
          付款时在备注里填写的订单号，粘贴到下面即可取回你的兑换码。
        </p>
      </div>

      <div className="card-glass mb-4 p-4">
        <div className="mb-2 text-[11px] font-medium" style={{ color: 'var(--tx-1)' }}>充值兑换流程</div>
        <ol className="space-y-1 text-[10.5px] leading-5" style={{ color: 'var(--tx-3)' }}>
          <li>1. 在排盘页点付费功能，弹层里扫收款码付款；</li>
          <li>2. 付款备注写「你的微信名 + 套餐」（如 张三包月 / 张三永久）；</li>
          <li>3. 把订单号发给作者，作者绑定后会通知你；</li>
          <li>4. 回到本页输入订单号 → 立即显示兑换码；</li>
          <li>5. 到排盘页点付费功能，输入该兑换码即可解锁。</li>
        </ol>
      </div>

      <div className="card-glass p-6">
        <input
          value={order}
          onChange={e => setOrder(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="输入订单号，如 ZW-7K3F9"
          className="input-base mb-3"
        />
        <button type="button" onClick={submit} disabled={busy} className="btn-accent w-full !py-2.5 !text-[13px]">
          {busy ? '查询中…' : '领取'}
        </button>

        {msg && <p className="mt-3 text-[11px]" style={{ color: 'var(--ji)' }}>{msg}</p>}

        {code && (
          <div className="mt-4 rounded-lg p-4 text-center" style={{ background: 'var(--ac-bg)', border: '1px solid var(--ac-bdr)' }}>
            <div className="text-[10px]" style={{ color: 'var(--tx-3)' }}>你的兑换码</div>
            <div className="my-1 font-mono text-[20px] font-semibold" style={{ color: 'var(--ac)' }}>{code}</div>
            <div className="text-[10px]" style={{ color: 'var(--tx-3)' }}>回到排盘页，点付费功能 → 输入此码解锁</div>
            <Link href="/chart" className="btn-glass mt-3 !py-1.5 !text-[11px]">去解锁 →</Link>
          </div>
        )}
      </div>
    </main>
  );
}
