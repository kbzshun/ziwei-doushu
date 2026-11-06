'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace, Star } from '@/lib/ziwei/types';
import { BRANCHES } from '@/lib/ziwei/constants';
import PalaceCell from './PalaceCell';
import type { TimeView } from './TimeNav';

interface ChartBoardProps {
  chart: ZiweiChart;
  /** 仅用于四化点击回传当前视角 */
  view?: TimeView;
  /** 选中的宫位地支（三方四正连线） */
  selectedBranch?: number | null;
  /** 当前运限命宫地支（描边高亮） */
  yunxianBranch?: number | null;
  /** 星名 → 四化，叠加在盘面星曜上 */
  overlayStarHua?: Record<string, string>;
  /** 叠加角标：限 / 年 / 月 / 日 / 时 */
  overlayLabel?: string;
  /** 运限宫名覆盖：地支 → 「大限官禄宫」 */
  nameOverrides?: Record<number, string>;
  /** 点中宫：清除选中、回到本命 */
  onResetSelection?: () => void;
  onStarSelect?: (star: Star, palace: Palace) => void;
  onPalaceSelect?: (palace: Palace) => void;
  onSiHuaClick?: (starName: string, siHua: string, view: TimeView) => void;
}

const BRANCH_GRID_POS: Record<number, [number, number]> = {
  5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4],
  4: [2, 1], 9: [2, 4],
  3: [3, 1], 10: [3, 4],
  2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4],
};

// 每个地支宫位在网格中的中心坐标（百分比）
const BRANCH_SVG_POS: Record<number, [number, number]> = {
  5: [12.5, 12.5], 6: [37.5, 12.5], 7: [62.5, 12.5], 8: [87.5, 12.5],
  4: [12.5, 37.5],                                      9: [87.5, 37.5],
  3: [12.5, 62.5],                                     10: [87.5, 62.5],
  2: [12.5, 87.5], 1: [37.5, 87.5], 0: [62.5, 87.5], 11: [87.5, 87.5],
};

// 十二地支对应方位（与参考站同一套三分方位命名）
// 子=正北 丑=北北东 寅=东东北 卯=正东 辰=东东南 巳=南东南
// 午=正南 未=南南西 申=西西南 酉=正西 戌=西西北 亥=北西北
const BRANCH_DIRECTION = [
  '正北', '北北东', '东东北', '正东', '东东南', '南东南',
  '正南', '南南西', '西西南', '正西', '西西北', '北西北',
];

// 绕盘面顺时针排列（用于三方四正四边形排序）
const CLOCKWISE_INDEX: Record<number, number> = {
  5: 0, 6: 1, 7: 2, 8: 3,
  9: 4, 10: 5,
  11: 6, 0: 7, 1: 8, 2: 9,
  3: 10, 4: 11,
};

/** 三方四正：本宫 + 对宫 + 两个三合宫 */
function getSanFangSiZheng(branch: number): [number, number, number, number] {
  return [branch, (branch + 6) % 12, (branch + 4) % 12, (branch + 8) % 12];
}

const ANIMATION_ORDER = [5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4];

export default function ChartBoard({
  chart,
  view = 'mingpan',
  selectedBranch = null,
  yunxianBranch = null,
  overlayStarHua,
  overlayLabel,
  nameOverrides,
  onResetSelection,
  onStarSelect,
  onPalaceSelect,
  onSiHuaClick,
}: ChartBoardProps) {
  const palaceMap: Record<number, Palace> = {};
  chart.palaces.forEach(p => { palaceMap[p.branch] = p; });

  const handlePalaceClick = (branch: number) => {
    const palace = palaceMap[branch];
    if (palace) onPalaceSelect?.(palace);
  };

  // 三方四正
  const sanFangBranches = selectedBranch !== null ? getSanFangSiZheng(selectedBranch) : null;
  const sanFangSet = sanFangBranches ? new Set(sanFangBranches) : null;

  // 中宫：点击等同于点命宫
  const mingPalace = palaceMap[chart.mingGongBranch];

  const overlayData = overlayStarHua && Object.keys(overlayStarHua).length > 0 ? overlayStarHua : undefined;

  return (
    <div className="w-full select-none">
      <div className="relative" style={{ padding: '16px 18px' }}>
        {/* 外圈方位标注 */}
        {ANIMATION_ORDER.map(branch => {
          const [row, col] = BRANCH_GRID_POS[branch];
          const style: React.CSSProperties = {
            position: 'absolute',
            fontSize: 9,
            letterSpacing: '0.08em',
            color: 'var(--tx-3)',
            opacity: 0.75,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          };
          if (row === 1) {
            style.top = 4;
            style.left = `${(col - 0.5) * 25}%`;
            style.transform = 'translateX(-50%)';
          } else if (row === 4) {
            style.bottom = 4;
            style.left = `${(col - 0.5) * 25}%`;
            style.transform = 'translateX(-50%)';
          } else if (col === 1) {
            style.left = 0;
            style.top = `${(row - 0.5) * 25}%`;
            style.transform = 'translateY(-50%)';
          } else {
            style.right = 0;
            style.top = `${(row - 0.5) * 25}%`;
            style.transform = 'translateY(-50%)';
          }
          return (
            <span key={`dir-${branch}`} style={style} aria-hidden>
              {BRANCH_DIRECTION[branch]}
            </span>
          );
        })}

        {/* 4x4 命盘网格（含 SVG 叠加层） */}
        <div
          className="grid rounded-xl overflow-hidden relative"
          style={{
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(4, auto)',
            gap: '1px',
            background: 'var(--bdr)',
            border: '1px solid var(--bdr)',
            boxShadow: 'var(--sh-md)',
          }}
        >
          {ANIMATION_ORDER.map((branch, i) => {
            const [row, col] = BRANCH_GRID_POS[branch];
            const palace = palaceMap[branch];
            if (!palace) return null;
            return (
              <div key={branch} style={{ gridRow: row, gridColumn: col, background: 'var(--bg-0)' }}>
                <PalaceCell
                  palace={palace}
                  onClick={() => handlePalaceClick(branch)}
                  onStarClick={(star) => onStarSelect?.(star, palace)}
                  isSelected={selectedBranch === branch}
                  isSanFang={!!(sanFangSet?.has(branch) && selectedBranch !== branch)}
                  isYunxian={yunxianBranch === branch}
                  nameOverride={nameOverrides?.[branch]}
                  delay={i * 0.04}
                  overlayStarSiHua={overlayData}
                  overlayLabel={overlayLabel}
                  onSiHuaClick={(starName, siHua) => onSiHuaClick?.(starName, siHua, view)}
                />
              </div>
            );
          })}

          {/* 中央信息区（可点击 → 命宫） */}
        <motion.button
          type="button"
          onClick={() => (onResetSelection ? onResetSelection() : mingPalace && onPalaceSelect?.(mingPalace))}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.99 }}
          title="点中宫复位：清除选中宫位与连线"
          aria-label="点中宫复位：清除选中宫位与连线"
            className="flex flex-col items-center justify-center p-4 gap-3 cursor-pointer"
            style={{
              gridRow: '2 / 4',
              gridColumn: '2 / 4',
              background: 'var(--bg-0)',
              border: 'none',
              color: 'inherit',
              borderRadius: 0,
            }}
          >
            <div
              className="text-5xl select-none leading-none"
              style={{ color: 'var(--tx-3)', opacity: 0.18 }}
            >
              ☯
            </div>

            <div className="text-center space-y-1">
              <div className="text-[9px] tracking-[0.3em] font-medium" style={{ color: 'var(--tx-2)' }}>
                紫微斗数
              </div>
              <div className="text-[10px] space-y-0.5" style={{ color: 'var(--tx-3)' }}>
                <div>命宫 <span style={{ color: 'var(--tx-1)' }}>{BRANCHES[chart.mingGongBranch]}</span></div>
                <div>身宫 <span style={{ color: 'var(--tx-2)' }}>{BRANCHES[chart.shenGongBranch]}</span></div>
                <div className="text-[9px]" style={{ color: 'var(--tx-2)' }}>{chart.wuxingJuName}</div>
              </div>
            </div>

            {chart.currentDaXianIndex >= 0 && (() => {
              const dx = chart.daXians[chart.currentDaXianIndex];
              if (!dx) return null;
              return (
                <div
                  className="rounded-lg px-3 py-1.5 text-center"
                  style={{ background: 'var(--bg-1)', border: '1px solid var(--bdr)' }}
                >
                  <div className="text-[8px] tracking-wider" style={{ color: 'var(--tx-3)' }}>当前大限</div>
                  <div className="text-[12px] font-medium tabular-nums" style={{ color: 'var(--tx-1)' }}>
                    {dx.startAge}–{dx.endAge}岁
                  </div>
                  <div className="text-[9px]" style={{ color: 'var(--tx-3)' }}>{dx.palaceName}</div>
                </div>
              );
            })()}

            <div className="text-[8px] text-center leading-relaxed font-mono" style={{ color: 'var(--tx-3)' }}>
              {chart.lunarInfo.lunarYear}·{chart.lunarInfo.isLeapMonth ? '闰' : ''}
              {chart.lunarInfo.lunarMonth}·{chart.lunarInfo.lunarDay}
            </div>
          </motion.button>

          {/* ── 三方四正 SVG 连线 ── */}
          {/* 运限连线：本命命宫 → 运限命宫，以及运限命宫自己的三方四正 */}
          {yunxianBranch !== null && (
            <svg
              className="pointer-events-none"
              style={{ position: 'absolute', inset: 0, zIndex: 14 }}
              width="100%"
              height="100%"
              aria-hidden
            >
              {(() => {
                const P = BRANCH_SVG_POS;
                const [self, opposite, san1, san2] = getSanFangSiZheng(yunxianBranch);
                const quad = [self, san1, san2];
                const stroke = 'var(--tx-3)';
                return (
                  <>
                    {/* 本命命宫 → 运限命宫 */}
                    {yunxianBranch !== chart.mingGongBranch && (
                      <line
                        x1={`${P[chart.mingGongBranch][0]}%`}
                        y1={`${P[chart.mingGongBranch][1]}%`}
                        x2={`${P[self][0]}%`}
                        y2={`${P[self][1]}%`}
                        stroke={stroke}
                        strokeWidth="1.2"
                        strokeDasharray="5,4"
                        opacity="0.45"
                      />
                    )}

                    {/* 运限命宫 ↔ 对宫 */}
                    <line
                      x1={`${P[self][0]}%`} y1={`${P[self][1]}%`}
                      x2={`${P[opposite][0]}%`} y2={`${P[opposite][1]}%`}
                      stroke={stroke} strokeWidth="1.1" strokeDasharray="4,4" opacity="0.4"
                    />

                    {/* 三方三角形：本宫 → 三合1 → 三合2 → 本宫 */}
                    {[0, 1, 2].map(i => {
                      const a = P[quad[i]];
                      const b = P[quad[(i + 1) % 3]];
                      return (
                        <line
                          key={i}
                          x1={`${a[0]}%`} y1={`${a[1]}%`}
                          x2={`${b[0]}%`} y2={`${b[1]}%`}
                          stroke={stroke} strokeWidth="1.1" strokeDasharray="4,4" opacity="0.4"
                        />
                      );
                    })}

                    {[self, opposite, san1, san2].map((br, i) => (
                      <circle
                        key={br}
                        cx={`${P[br][0]}%`} cy={`${P[br][1]}%`} r={i === 0 ? 3 : 2.2}
                        fill={stroke} opacity={i === 0 ? 0.75 : 0.4}
                      />
                    ))}
                  </>
                );
              })()}
            </svg>
          )}

          <AnimatePresence>
            {sanFangBranches !== null && (
              <motion.div
                key={`sf-${selectedBranch}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-none"
                style={{ position: 'absolute', inset: 0, zIndex: 20 }}
              >
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                  {(() => {
                    const p0 = BRANCH_SVG_POS[sanFangBranches[0]];
                    const p1 = BRANCH_SVG_POS[sanFangBranches[1]];
                    const p2 = BRANCH_SVG_POS[sanFangBranches[2]];
                    const p3 = BRANCH_SVG_POS[sanFangBranches[3]];
                    const dash = '6,5';
                    const stroke = 'rgba(96,165,250,0.55)';
                    const sw = '1.5';
                    return (
                      <>
                        <line x1={`${p0[0]}%`} y1={`${p0[1]}%`} x2={`${p1[0]}%`} y2={`${p1[1]}%`}
                          stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeLinecap="round" />
                        <line x1={`${p0[0]}%`} y1={`${p0[1]}%`} x2={`${p2[0]}%`} y2={`${p2[1]}%`}
                          stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeLinecap="round" />
                        <line x1={`${p2[0]}%`} y1={`${p2[1]}%`} x2={`${p3[0]}%`} y2={`${p3[1]}%`}
                          stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeLinecap="round" />
                        <line x1={`${p3[0]}%`} y1={`${p3[1]}%`} x2={`${p0[0]}%`} y2={`${p0[1]}%`}
                          stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeLinecap="round" />
                        {[p0, p1, p2, p3].map((p, i) => (
                          <circle key={i} cx={`${p[0]}%`} cy={`${p[1]}%`} r="3"
                            fill={i === 0 ? 'rgba(96,165,250,0.8)' : 'rgba(96,165,250,0.45)'} />
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 图例 */}
      <div className="mt-1 flex items-center justify-center gap-2 text-[9px] flex-wrap">
        {[
          { h: '化禄', c: 'text-emerald-500 border-emerald-500/30' },
          { h: '化权', c: 'text-blue-500 border-blue-500/30' },
          { h: '化科', c: 'text-yellow-500 border-yellow-500/30' },
          { h: '化忌', c: 'text-red-500 border-red-500/30' },
        ].map(({ h, c }) => (
          <span key={h} className={`border px-1.5 py-0.5 rounded-full font-medium ${c}`}>{h}</span>
        ))}
        <span className="px-1.5 py-0.5 rounded-full" style={{ color: 'var(--tx-3)', border: '1px solid var(--bdr)' }}>
          点击宫位看三方四正 · 中宫看命宫
        </span>
      </div>
    </div>
  );
}
