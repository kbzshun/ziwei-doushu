'use client';
import { useEffect, useState } from 'react';
import BirthForm from '@/components/BirthForm';
import ChartWorkspace from '@/components/ChartWorkspace';
import RecentCharts from '@/components/RecentCharts';
import { generateChart } from '@/lib/ziwei/algorithm';
import {
  clearHistory,
  loadHistory,
  removeChart,
  renameChart,
  saveChart,
  type SavedChart,
} from '@/lib/history';
import type { BirthInfo, ZiweiChart } from '@/lib/ziwei/types';

/**
 * 排盘页：未起盘时是出生信息表单 + 最近命盘，起盘后进入工作台。
 * 历史记录存在本机 localStorage，没有账号体系。
 */
export default function ChartPage() {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [history, setHistory] = useState<SavedChart[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleSubmit = (info: BirthInfo) => {
    const generated = generateChart(info);
    saveChart(info, generated);
    setHistory(loadHistory());
    setChart(generated);
  };

  if (!chart) {
    return (
      <StartScreen
        onSubmit={handleSubmit}
        history={history}
        onLoad={item => setChart(item.chart)}
        onRename={(id, name) => setHistory(renameChart(id, name))}
        onDelete={id => setHistory(removeChart(id))}
        onClear={() => setHistory(clearHistory())}
      />
    );
  }

  return <ChartWorkspace chart={chart} onReset={() => setChart(null)} />;
}

/* ─── 未起盘：输入页 ─────────────────────────────────────── */

function StartScreen({
  onSubmit, history, onLoad, onRename, onDelete, onClear,
}: {
  onSubmit: (info: BirthInfo) => void;
  history: SavedChart[];
  onLoad: (item: SavedChart) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-14">
      <div className="mb-9 text-center">
        <div className="eyebrow mb-3">ZI WEI DOU SHU</div>
        <h1 className="mb-3 text-[30px] font-semibold leading-tight tracking-wide" style={{ color: 'var(--tx-0)' }}>
          紫微斗数<span style={{ color: 'var(--ac)' }}>排盘</span>
        </h1>
        <p className="mx-auto max-w-md text-[12.5px] leading-7" style={{ color: 'var(--tx-2)' }}>
          输入出生年月日时，本地即时生成完整命盘，再按主题生成 AI 深度解读。
        </p>
      </div>

      <div className="card-glass p-6 sm:p-8">
        <BirthForm onSubmit={onSubmit} />
      </div>

      <RecentCharts
        items={history}
        onLoad={onLoad}
        onRename={onRename}
        onDelete={onDelete}
        onClear={onClear}
      />

      <p className="mt-6 text-center text-[11px]" style={{ color: 'var(--tx-3)' }}>
        排盘在本地完成 · 生成解读才需要模型 · 出生信息仅用于本次排盘
      </p>
    </main>
  );
}
