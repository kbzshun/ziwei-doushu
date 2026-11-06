'use client';
import { useEffect, useRef } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import type { TimeView } from './TimeNav';
import type { YunxianSelection } from '@/lib/ziwei/yunxian';

export type { YunxianSelection };

const MONTH_LABELS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];

/** 五档运限各自的主色（写在行容器上，子元素用 var(--yx) 继承） */
const VIEW_COLOR: Record<string, string> = {
  daxian: 'var(--yx-daxian)',
  liunian: 'var(--yx-liunian)',
  liuyue: 'var(--yx-liuyue)',
  liuri: 'var(--yx-liuri)',
  liushi: 'var(--yx-liushi)',
};

const DAY_LABELS = (() => {
  const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  return Array.from({ length: 30 }, (_, i) => {
    const d = i + 1;
    if (d <= 9) return `初${CN[d - 1]}`;      // 初一 … 初九
    if (d === 10) return '初十';
    if (d < 20) return `十${CN[d - 11]}`;     // 十一 … 十九
    if (d === 20) return '二十';
    if (d < 30) return `廿${CN[d - 21]}`;     // 廿一 … 廿九
    return '三十';
  });
})();

interface TimeAxisPanelProps {
  chart: ZiweiChart;
  selection: YunxianSelection;
  onChange: (next: Partial<YunxianSelection>) => void;
}

/**
 * 左下时间轴：大限 / 流年 / 流月 / 流日 / 流时 五行并列，
 * 点任意一格即切到对应维度并选中该值（与顶栏运限 tab 同一份状态）。
 */
export default function TimeAxisPanel({ chart, selection, onChange }: TimeAxisPanelProps) {
  const { view, year, month, day, hour, daXianIndex } = selection;

  const birthYear = chart.lunarInfo.lunarYear;
  const years = Array.from({ length: 100 }, (_, i) => birthYear + i);

  const rowActive = (v: TimeView) => view === v;

  return (
    <div className="card-glass mt-4 overflow-hidden rounded-2xl">
      {/* 大限 */}
      <Row
        label="大限"
        hint="绿框为所选大限·点击切换"
        axis="大限"
        color={VIEW_COLOR.daxian}
        active={rowActive('daxian')}
        onActivate={() => onChange({ view: 'daxian' })}
      >
        {chart.daXians.map((dx, i) => {
          const isCurrent = i === chart.currentDaXianIndex;
          const isPicked = i === daXianIndex;
          const stemName = dx.stemName ?? STEMS[chart.palaces.find(p => p.branch === dx.palaceBranch)?.stem ?? 0];
          return (
            <Chip
              key={i}
              active={isPicked}
              current={isCurrent}
              onClick={() => onChange({ view: 'daxian', daXianIndex: i })}
              title={`${dx.startAge}–${dx.endAge}岁 · ${dx.palaceName}`}
            >
              <span className="block text-[9px] opacity-70">{dx.startAge}–{dx.endAge}岁</span>
              <span className="block text-[10px] font-medium tabular-nums">
                {stemName}{BRANCHES[dx.palaceBranch]}
              </span>
              <span className="block text-[9px] opacity-70">{dx.palaceName.replace('宫', '')}</span>
            </Chip>
          );
        })}
      </Row>

      {/* 流年 */}
      <Row
        label="流年"
        hint="蓝色为所选流年·点击任一年份切换"
        axis="流年"
        color={VIEW_COLOR.liunian}
        active={rowActive('liunian')}
        onActivate={() => onChange({ view: 'liunian' })}
      >
        {years.map(y => (
          <Chip
            key={y}
            active={y === year}
            onClick={() => onChange({ view: 'liunian', year: y })}
            title={`${y} 年（${STEMS[((y - 4) % 10 + 10) % 10]}${BRANCHES[((y - 4) % 12 + 12) % 12]}）`}
          >
            <span className="text-[10px] tabular-nums">{y}</span>
          </Chip>
        ))}
      </Row>

      {/* 流月 */}
      <Row
        label="流月"
        hint="精细到每月运势·点击切换"
        axis="流月"
        color={VIEW_COLOR.liuyue}
        active={rowActive('liuyue')}
        onActivate={() => onChange({ view: 'liuyue' })}
      >
        {MONTH_LABELS.map((m, i) => (
          <Chip
            key={m}
            active={i + 1 === month}
            onClick={() => onChange({ view: 'liuyue', month: i + 1 })}
          >
            <span className="text-[10px]">{m}</span>
          </Chip>
        ))}
      </Row>

      {/* 流日 */}
      <Row
        label="流日"
        hint="精细到每日·点击切换"
        axis="流日"
        color={VIEW_COLOR.liuri}
        active={rowActive('liuri')}
        onActivate={() => onChange({ view: 'liuri' })}
      >
        {DAY_LABELS.map((d, i) => (
          <Chip
            key={i}
            active={i + 1 === day}
            onClick={() => onChange({ view: 'liuri', day: i + 1 })}
          >
            <span className="text-[10px]">{d}</span>
          </Chip>
        ))}
      </Row>

      {/* 流时 */}
      <Row
        label="流时"
        hint="精细到时辰·点击切换"
        axis="流时"
        color={VIEW_COLOR.liushi}
        active={rowActive('liushi')}
        onActivate={() => onChange({ view: 'liushi' })}
        last
      >
        {BRANCHES.map((b, i) => (
          <Chip
            key={b}
            active={i === hour}
            onClick={() => onChange({ view: 'liushi', hour: i })}
          >
            <span className="text-[10px]">{b}时</span>
          </Chip>
        ))}
      </Row>
    </div>
  );
}

/* ── 行容器 ─────────────────────────────────────────────── */
function Row({
  label, hint, axis, active, onActivate, children, last, color,
}: {
  label: string;
  hint: string;
  axis: string;
  active: boolean;
  onActivate: () => void;
  children: React.ReactNode;
  last?: boolean;
  color: string;
}) {
  return (
    <div
      className="px-3 py-2"
      style={{
        borderBottom: last ? 'none' : '1px solid var(--bdr)',
        background: active ? `color-mix(in srgb, ${color} 7%, transparent)` : 'transparent',
        ['--yx' as string]: color,
      }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <button
          type="button"
          onClick={onActivate}
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider transition-colors"
          style={{
            color: active ? color : 'var(--tx-2)',
            background: active ? `color-mix(in srgb, ${color} 12%, transparent)` : 'transparent',
            border: `1px solid ${active ? `color-mix(in srgb, ${color} 40%, transparent)` : 'transparent'}`,
          }}
          title={`切到${axis}`}
        >
          {label}
        </button>
        <span className="text-[9px]" style={{ color: 'var(--tx-3)' }}>{hint}</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">{children}</div>
    </div>
  );
}

/* ── 单元 ───────────────────────────────────────────────── */
function Chip({
  active, current, onClick, children, title,
}: {
  active?: boolean;
  current?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  // 选中项可能在横向滚动区外（如 100 年流年）。
  // 只调整所在行的 scrollLeft，不用 scrollIntoView——后者会连带滚动外层左栏，
  // 把顶部的运限 tab 顶出屏幕。
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    const row = el?.parentElement;
    if (!el || !row) return;
    const rowRect = row.getBoundingClientRect();
    const chipRect = el.getBoundingClientRect();
    row.scrollLeft += (chipRect.left - rowRect.left) - (rowRect.width - chipRect.width) / 2;
  }, [active]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      title={title}
      className="flex-none rounded-lg px-2.5 py-1 text-center transition-all"
      style={{
        background: active
          ? 'color-mix(in srgb, var(--yx) 12%, transparent)'
          : 'var(--glass-bg-2)',
        border: `1px solid ${
          active
            ? 'var(--yx)'
            : current
              ? 'color-mix(in srgb, var(--yx) 45%, transparent)'
              : 'var(--bdr)'
        }`,
        color: active ? 'var(--yx)' : 'var(--tx-2)',
      }}
    >
      {children}
    </button>
  );
}
