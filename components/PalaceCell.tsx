'use client';
import { motion } from 'framer-motion';
import type { Palace, Star } from '@/lib/ziwei/types';
import { STEMS, BRANCHES } from '@/lib/ziwei/constants';
import clsx from 'clsx';

interface PalaceCellProps {
  palace: Palace;
  onClick?: () => void;
  onStarClick?: (star: Star) => void;
  isSelected?: boolean;
  isSanFang?: boolean;
  /** 当前运限命宫：画在格子自身边框上，避免绝对定位错位 */
  isYunxian?: boolean;
  /** 运限宫名覆盖，如「大限官禄宫」；有值时替代本命宫名显示 */
  nameOverride?: string;
  delay?: number;
  /** 叠加四化：星名 → 四化类型（'禄'/'权'/'科'/'忌'） */
  overlayStarSiHua?: Record<string, string>;
  /** 叠加标签：'年'（流年）或 '限'（大限） */
  overlayLabel?: string;
  /** 点击叠加四化 badge 回调 */
  onSiHuaClick?: (starName: string, siHua: string) => void;
}

const SIHUA_STYLES: Record<string, string> = {
  '禄': 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30',
  '权': 'text-blue-600 bg-blue-500/10 border-blue-500/30',
  '科': 'text-sky-600 bg-sky-500/10 border-sky-500/30',
  '忌': 'text-red-600 bg-red-500/10 border-red-500/30',
};

const SiHuaBadge = ({
  siHua,
  overlay,
  label,
  onClick,
}: {
  siHua: string;
  overlay?: boolean;
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
}) => (
  <span
    className={clsx(
      'mt-0.5 inline-flex items-center rounded-sm border px-px text-[7px] font-bold leading-[1.35]',
      SIHUA_STYLES[siHua],
      overlay && 'border-dashed opacity-80',
      onClick && 'cursor-pointer hover:opacity-100',
    )}
    onClick={onClick}
  >
    {overlay && label && <span className="mr-px opacity-70">{label}</span>}
    {siHua}
  </span>
);

/** 单颗星：竖排名 + 下方亮度，对应参考图「廉贞／陷」的排版 */
function StarColumn({
  star,
  overlaySiHua,
  overlayLabel,
  onStarClick,
  onSiHuaClick,
}: {
  star: Star;
  overlaySiHua?: string;
  overlayLabel?: string;
  onStarClick?: (star: Star) => void;
  onSiHuaClick?: (starName: string, siHua: string) => void;
}) {
  const color = star.type === 'major' ? 'var(--tx-0)' : 'var(--tx-1)';
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex cursor-pointer flex-col items-center text-[13px] font-bold leading-[1.02] tracking-tight transition-all hover:brightness-75"
        style={{ color }}
        onClick={(e) => { e.stopPropagation(); onStarClick?.(star); }}
      >
        {star.name.split('').map((ch, i) => <span key={i}>{ch}</span>)}
      </div>
      {star.brightnessRaw && (
        <span className="mt-px text-[8px] font-medium leading-none" style={{ color: 'var(--t-faint)' }}>
          {star.brightnessRaw}
        </span>
      )}
      {star.siHua && <SiHuaBadge siHua={star.siHua} />}
      {overlaySiHua && (
        <SiHuaBadge
          siHua={overlaySiHua}
          overlay
          label={overlayLabel}
          onClick={(e) => { e.stopPropagation(); onSiHuaClick?.(star.name, overlaySiHua); }}
        />
      )}
    </div>
  );
}

export default function PalaceCell({
  palace, onClick, onStarClick, isSelected, isSanFang, isYunxian, delay = 0,
  overlayStarSiHua, overlayLabel, onSiHuaClick, nameOverride,
}: PalaceCellProps) {
  const { branch, stem, name, stars, daXianAge, isCurrentDaXian, isMingGong, isShenGong } = palace;
  const ganzhi = `${STEMS[stem]}${BRANCHES[branch]}`;

  // 主星 / 六吉 / 六煞 竖排在格子上部，与参考图一致
  const shown = stars.filter(s => s.type === 'major' || s.type === 'lucky' || s.type === 'sha');
  // 其余杂曜以小字排在左下
  const tiny = stars.filter(s => s.type === 'minor');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      onClick={onClick}
      className="relative flex h-full cursor-pointer flex-col p-1.5 transition-all duration-200"
      style={{
        minHeight: '96px',
        /* 宫格底色统一纯白，状态只用描边表达 */
        background: 'var(--bg-card)',
        boxShadow: [
          isYunxian ? 'inset 0 0 0 2px var(--tx-3)' : '',
          isCurrentDaXian ? 'inset 3px 0 0 var(--bdr-heavy)' : '',
          isSelected ? 'inset 0 0 0 1.5px rgba(37,99,235,0.55)' : '',
          isSanFang ? 'inset 0 0 0 1px rgba(37,99,235,0.35)' : '',
        ].filter(Boolean).join(', ') || 'none',
      }}
    >
      {/* 星曜区 */}
      <div className="flex flex-1 flex-wrap content-start gap-x-1.5 gap-y-1">
        {shown.length === 0 && (
          <span className="text-[10px] italic" style={{ color: 'var(--t-faint)', opacity: 0.6 }}>空宫</span>
        )}
        {shown.map(star => (
          <StarColumn
            key={star.name}
            star={star}
            overlaySiHua={overlayStarSiHua?.[star.name]}
            overlayLabel={overlayLabel}
            onStarClick={onStarClick}
            onSiHuaClick={onSiHuaClick}
          />
        ))}
      </div>

      {/* 底部：左侧杂曜，右侧干支 / 大限 / 宫名 */}
      <div className="mt-1 flex items-end justify-between gap-1">
        <div
          className="flex max-w-[58%] flex-wrap gap-x-1 text-[8px] leading-[1.25]"
          style={{ color: 'var(--t-faint)', opacity: 0.9 }}
        >
          {tiny.map(s => <span key={s.name}>{s.name}</span>)}
        </div>

        <div className="shrink-0 text-right leading-[1.25]">
          <div className="font-mono text-[10px] font-semibold" style={{ color: 'var(--tx-1)' }}>
            {ganzhi}
          </div>
          {daXianAge && (
            <div
              className="font-mono text-[8px] tabular-nums"
              style={{ color: isCurrentDaXian ? 'var(--ac)' : 'var(--t-faint)' }}
            >
              {daXianAge[0]}-{daXianAge[1]}
            </div>
          )}
          <div className="flex items-center justify-end gap-0.5">
            {isMingGong && (
              <span
                className="rounded-sm px-0.5 text-[7px] leading-tight"
                style={{ color: 'var(--ji)', border: '1px solid var(--ji)' }}
              >
                命
              </span>
            )}
            {isShenGong && (
              <span
                className="rounded-sm px-0.5 text-[7px] leading-tight"
                style={{ color: 'var(--tx-2)', border: '1px solid var(--bdr-med)' }}
              >
                身
              </span>
            )}
            <span
              className="text-[10px] font-semibold"
              style={{ color: isMingGong ? 'var(--tx-0)' : 'var(--tx-2)' }}
            >
              {nameOverride ?? name}
            </span>
          </div>
        </div>
      </div>

    </motion.div>
  );
}
