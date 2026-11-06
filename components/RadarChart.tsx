'use client';
import type { RadarScore } from '@/lib/ai/radar';

interface RadarChartProps {
  scores: RadarScore[];
  size?: number;
}

/**
 * 六维雷达图（纯 SVG，无第三方库）。
 * 只做「相对强弱示意」，不做评分排行——这一点与参考站的说明一致。
 */
export default function RadarChart({ scores, size = 240 }: RadarChartProps) {
  if (scores.length < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.32;
  const n = scores.length;

  const pointAt = (index: number, ratio: number): [number, number] => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / n;
    return [cx + Math.cos(angle) * radius * ratio, cy + Math.sin(angle) * radius * ratio];
  };

  const rings = [0.25, 0.5, 0.75, 1];

  const dataPoints = scores.map((s, i) => pointAt(i, Math.max(0.08, s.value / 100)));

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label="六维相对强弱示意图">
        {/* 底网 */}
        {rings.map(r => (
          <polygon
            key={r}
            points={scores.map((_, i) => pointAt(i, r).join(',')).join(' ')}
            fill="none"
            stroke="var(--bdr)"
            strokeWidth={r === 1 ? 1.1 : 0.7}
          />
        ))}
        {scores.map((_, i) => {
          const [x, y] = pointAt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--bdr)" strokeWidth={0.7} />;
        })}

        {/* 数据面 */}
        <polygon
          points={dataPoints.map(p => p.join(',')).join(' ')}
          fill="var(--ac-bg)"
          stroke="var(--ac)"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        {dataPoints.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.4} fill="var(--ac)" />
        ))}

        {/* 维度标签 */}
        {scores.map((s, i) => {
          const [lx, ly] = pointAt(i, 1.22);
          const cos = Math.cos(-Math.PI / 2 + (Math.PI * 2 * i) / n);
          const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
          return (
            <g key={s.key}>
              <text
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize={11}
                fill="var(--tx-2)"
              >
                {s.label}
              </text>
              <text
                x={lx}
                y={ly + 13}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize={9}
                fill="var(--tx-3)"
              >
                {s.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
