'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ChartBoard from '@/components/ChartBoard';
import TimeAxisPanel from '@/components/TimeAxisPanel';
import InsightPanel, { useInsight, TOPIC_KEYS, type SelectedSiHua, type InsightSection } from '@/components/InsightPanel';
import AnalysisReport from '@/components/AnalysisReport';
import {
  resolveYunxian,
  yunxianPalaceNames,
  yunxianLabel,
  type YunxianSelection,
  type YunxianView,
} from '@/lib/ziwei/yunxian';
import { BRANCHES } from '@/lib/ziwei/constants';
import type { Palace, ZiweiChart } from '@/lib/ziwei/types';

const VIEWS: { key: YunxianView; label: string }[] = [
  { key: 'mingpan', label: '本命' },
  { key: 'daxian', label: '大限' },
  { key: 'liunian', label: '流年' },
  { key: 'liuyue', label: '流月' },
  { key: 'liuri', label: '流日' },
  { key: 'liushi', label: '流时' },
];

const DEFAULT_LEFT_WIDTH = 520;
const MIN_LEFT_WIDTH = 400;
const MAX_LEFT_WIDTH = 760;

/**
 * 命盘工作台
 *
 * 左：返回 + 出生日期 + 运限 tab，命盘（运限命宫描边 + 四化叠加），时间轴
 * 右：命盘分析 / AI 对话 + 主题标签 + 宫位标签，内容区始终占满
 * 中间分隔条可拖拽调整宽度，双击复位
 */
export default function ChartWorkspace({ chart, onReset }: { chart: ZiweiChart; onReset: () => void }) {
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [selectedSiHua, setSelectedSiHua] = useState<SelectedSiHua | null>(null);
  const [selection, setSelection] = useState<YunxianSelection>(() => ({
    view: 'mingpan',
    year: new Date().getFullYear(),
    month: 1,
    day: 1,
    hour: 0,
    daXianIndex: chart.currentDaXianIndex,
  }));
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH);
  const dragging = useRef(false);

  const insight = useInsight(chart, selectedPalace, selectedSiHua);
  const update = (next: Partial<YunxianSelection>) => setSelection(prev => ({ ...prev, ...next }));
  const overlay = resolveYunxian(chart, selection);

  /* 运限宫名覆盖：大限官禄宫 / 流年财帛宫 … */
  const nameOverrides = (() => {
    if (selection.view === 'mingpan' || overlay.branch === null) return undefined;
    const map = yunxianPalaceNames(chart, overlay.branch);
    const prefix = yunxianLabel(selection.view);
    const out: Record<number, string> = {};
    Object.entries(map).forEach(([branch, name]) => {
      out[Number(branch)] = `${prefix}${name}`;
    });
    return out;
  })();

  /* 选中运限 → 右栏生成对应解读（同一运限只触发一次） */
  const periodKey = `${selection.view}:${selection.year}:${selection.month}:${selection.day}:${selection.hour}:${selection.daXianIndex}`;
  const lastPeriodKey = useRef('');
  useEffect(() => {
    if (selection.view === 'mingpan') {
      lastPeriodKey.current = '';
      return;
    }
    if (lastPeriodKey.current === periodKey) return;
    lastPeriodKey.current = periodKey;
    insight.openPeriod(selection, overlay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodKey]);

  /* 点中宫：回到最初状态（清除选中 + 回到本命 + 命格总览） */
  const resetToNatal = () => {
    setSelectedPalace(null);
    setSelectedSiHua(null);
    update({ view: 'mingpan' });
    insight.openTopic('overview');
  };

  /* 拖拽分栏 */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setLeftWidth(Math.max(MIN_LEFT_WIDTH, Math.min(MAX_LEFT_WIDTH, e.clientX)));
    };
    const stop = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stop);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', stop);
    };
  }, []);

  const startDrag = () => {
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const reportSections = [...TOPIC_KEYS, ...insight.dynamicKeys]
    .map(key => insight.sections[key])
    .filter((section): section is InsightSection => !!section);

  const info = chart.birthInfo;

  return (
    <div className="chart-page-root">
      <div
        className="chart-workspace"
        style={{ gridTemplateColumns: `${leftWidth}px 6px minmax(0, 1fr)` }}
      >
        {/* ── 左：命盘 + 时间轴 ── */}
        <section className="chart-workspace-left no-print">
          <div className="chart-left-head">
            <Link href="/" className="btn-glass flex-none !px-2.5" title="返回首页">
              ←
            </Link>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium" style={{ color: 'var(--tx-1)' }}>
                {info.name ? `${info.name} · ` : ''}
                {info.year}年{info.month}月{info.day}日
              </div>
              <div className="truncate text-[9px]" style={{ color: 'var(--tx-3)' }}>
                {BRANCHES[info.hour]}时 · 命宫{BRANCHES[chart.mingGongBranch]} · {chart.wuxingJuName}
              </div>
            </div>
          </div>

          <div className="chart-left-tabs">
            {VIEWS.map(v => {
              const isActive = selection.view === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => update({ view: v.key })}
                  className="chart-left-tab"
                  data-active={isActive ? '1' : '0'}
                >
                  {v.label}
                </button>
              );
            })}
          </div>

          <ChartBoard
            chart={chart}
            view={selection.view}
            selectedBranch={selectedPalace?.branch ?? null}
            yunxianBranch={overlay.branch}
            overlayStarHua={overlay.starHua}
            overlayLabel={overlay.badge}
            nameOverrides={nameOverrides}
            onResetSelection={resetToNatal}
            onPalaceSelect={setSelectedPalace}
            onSiHuaClick={(starName, siHua, view) => setSelectedSiHua({ starName, siHua, view })}
          />

          {overlay.caption && (
            <div className="mt-1 text-center text-[9px]" style={{ color: 'var(--ac)', opacity: 0.85 }}>
              {overlay.caption}
            </div>
          )}

          <TimeAxisPanel chart={chart} selection={selection} onChange={update} />
        </section>

        {/* ── 分隔条 ── */}
        <div
          className="chart-splitter no-print"
          role="separator"
          aria-orientation="vertical"
          title="拖动调整命盘与分析的宽度 · 双击复位"
          onMouseDown={startDrag}
          onDoubleClick={() => setLeftWidth(DEFAULT_LEFT_WIDTH)}
        />

        {/* ── 右：分析面板（始终占满） ── */}
        <section className="chart-workspace-right no-print">
          <InsightPanel
            insight={insight}
            chart={chart}
            onExport={() => window.print()}
            onReset={onReset}
            exportHint={insight.anyLoading ? '仍有解读在生成，报告只含已完成的内容' : '调用浏览器打印，另存为 PDF'}
          />
        </section>
      </div>

      {/* 打印视图：屏幕隐藏，导出时由浏览器渲染 */}
      <AnalysisReport chart={chart} sections={reportSections} />
    </div>
  );
}
