'use client';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';

const POS: Record<number, [number, number]> = {
  5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4],
  4: [2, 1], 9: [2, 4],
  3: [3, 1], 10: [3, 4],
  2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4],
};

const ORDER = [5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4];

/**
 * 打印版命盘图。
 *
 * 说明：参考站是把屏幕上的命盘 canvas 截图后嵌进报告；开源版不引第三方截图库，
 * 改为用同一份数据在报告里重绘一张矢量盘面——打印更清晰，也不依赖浏览器渲染截图。
 */
export default function ReportChartGrid({ chart }: { chart: ZiweiChart }) {
  const palaceOf = (branch: number) => chart.palaces.find(p => p.branch === branch);

  return (
    <div
      className="report-chart-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(4, minmax(26mm, auto))',
        gap: 0,
        border: '1px solid #999',
        fontSize: '8.5pt',
        lineHeight: 1.45,
      }}
    >
      {ORDER.map(branch => {
        const [row, col] = POS[branch];
        const palace = palaceOf(branch);
        if (!palace) return null;
        const majors = palace.stars.filter(s => s.type === 'major');
        const others = palace.stars.filter(s => s.type !== 'major');

        return (
          <div
            key={branch}
            style={{
              gridRow: row,
              gridColumn: col,
              border: '1px solid #ccc',
              padding: '1.5mm 2mm',
              minHeight: '26mm',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#444' }}>
              <span>
                {STEMS[palace.stem]}{BRANCHES[palace.branch]}
              </span>
              <span>
                {palace.name}
                {palace.isMingGong ? ' · 命' : ''}
                {palace.isShenGong ? ' · 身' : ''}
              </span>
            </div>

            <div style={{ marginTop: '1mm', fontWeight: 600 }}>
              {majors.length > 0
                ? majors.map(s => `${s.name}${s.siHua ? `(化${s.siHua})` : ''}`).join(' ')
                : '空宫'}
            </div>

            {others.length > 0 && (
              <div style={{ marginTop: '0.8mm', color: '#555', fontSize: '7.5pt' }}>
                {others.map(s => s.name).join(' ')}
              </div>
            )}
          </div>
        );
      })}

      {/* 中宫 */}
      <div
        style={{
          gridRow: '2 / 4',
          gridColumn: '2 / 4',
          border: '1px solid #ccc',
          padding: '2mm',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1mm',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '12pt', letterSpacing: '0.2em', fontWeight: 600 }}>紫微斗数</div>
        <div style={{ fontSize: '8.5pt', color: '#333' }}>{chart.wuxingJuName}</div>
        <div style={{ fontSize: '8.5pt', color: '#333' }}>
          命宫 {BRANCHES[chart.mingGongBranch]} · 身宫 {BRANCHES[chart.shenGongBranch]}
        </div>
        {chart.daXians[chart.currentDaXianIndex] && (
          <div style={{ fontSize: '8pt', color: '#333' }}>
            当前大限 {chart.daXians[chart.currentDaXianIndex].startAge}–
            {chart.daXians[chart.currentDaXianIndex].endAge}岁 ·{' '}
            {chart.daXians[chart.currentDaXianIndex].palaceName}
          </div>
        )}
      </div>
    </div>
  );
}
