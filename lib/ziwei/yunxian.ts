import type { ZiweiChart } from './types';
import type { SiHua } from './types';
import { STEMS, BRANCHES } from './constants';
import {
  getLiuNianSiHua,
  getLiuYueSiHua,
  getLiuRiSiHua,
  getLiuShiSiHua,
  getSiHuaByStem,
} from './sihua';

export type YunxianView = 'mingpan' | 'daxian' | 'liunian' | 'liuyue' | 'liuri' | 'liushi';

export interface YunxianSelection {
  view: YunxianView;
  year: number;
  /** 农历月 1-12 */
  month: number;
  /** 农历日 1-30 */
  day: number;
  /** 时辰 0-11（子…亥） */
  hour: number;
  daXianIndex: number;
}

export interface YunxianOverlay {
  /** 叠加角标：限 / 年 / 月 / 日 / 时 */
  badge?: string;
  /** 星名 → 四化（用于盘面叠加色章） */
  starHua: Record<string, string>;
  /** 该运限的命宫地支，用于盘面高亮 */
  branch: number | null;
  /** 运限说明，如「2026 丙午年 流年命宫在午」 */
  caption: string;
  /** 该运限对应的天干（有则显示） */
  stemName?: string;
}

const EMPTY: YunxianOverlay = { starHua: {}, branch: null, caption: '' };

const PALACE_ORDER = [
  '命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫',
  '迁移宫', '交友宫', '官禄宫', '田宅宫', '福德宫', '父母宫',
] as const;

/**
 * 宫名归一化。
 * 引擎里宫名后缀不统一（「兄弟」「仆役」不带「宫」，「夫妻宫」「命宫」带），
 * 而且「仆役」在通行说法里是「交友」，比较前统一处理。
 */
export function normalizePalaceName(name: string): string {
  const base = name.replace(/宫$/, '');
  return base === '仆役' ? '交友' : base;
}

/**
 * 按运限命宫重排十二宫名（大限命宫 / 流年财帛宫 …）。
 * 方向不写死：从本命盘已有的「命宫 → 兄弟宫」相对位置反推，
 * 这样男顺女逆、各流派差异都跟随引擎本身的口径。
 */
export function yunxianPalaceNames(chart: ZiweiChart, mingBranch: number): Record<number, string> {
  const natalMing = chart.palaces.find(p => p.isMingGong)?.branch ?? chart.mingGongBranch;
  const natalBrother = chart.palaces.find(p => normalizePalaceName(p.name) === '兄弟')?.branch;

  let dir = 1;
  if (natalBrother !== undefined) {
    const step = ((natalBrother - natalMing) % 12 + 12) % 12;
    if (step === 11) dir = -1;   // 兄弟宫在命宫前一宫 → 地支逆行
  }

  const out: Record<number, string> = {};
  PALACE_ORDER.forEach((name, i) => {
    out[(((mingBranch + dir * i) % 12) + 12) % 12] = name;
  });
  return out;
}

/** 运限中文标签 */
export function yunxianLabel(view: YunxianView): string {
  switch (view) {
    case 'daxian': return '大限';
    case 'liunian': return '流年';
    case 'liuyue': return '流月';
    case 'liuri': return '流日';
    case 'liushi': return '流时';
    default: return '本命';
  }
}

/** 把 `Record<SiHua, 星名>` 反转为 `星名 → SiHua` */
function invertTransforms(transforms: Record<SiHua, string>): Record<string, string> {
  const out: Record<string, string> = {};
  (Object.keys(transforms) as SiHua[]).forEach(hua => {
    const star = transforms[hua];
    if (star) out[star] = hua;
  });
  return out;
}

/**
 * 解析当前运限：给出盘面要叠加的四化、以及运限命宫地支。
 *
 * 命宫口径（通行四化派简化算法，未实现斗君）：
 *   流年命宫 = 流年地支所在宫；
 *   流月命宫 = 流年命宫起正月顺行；
 *   流日命宫 = 流月命宫起初一顺行；
 *   流时命宫 = 流日命宫起子时顺行。
 * 与商业版若采用斗君起月会有出入，需要时可在此单点替换。
 */
export function resolveYunxian(chart: ZiweiChart, sel: YunxianSelection): YunxianOverlay {
  if (sel.view === 'mingpan') return EMPTY;

  if (sel.view === 'daxian') {
    const dx = chart.daXians[sel.daXianIndex] ?? chart.daXians[chart.currentDaXianIndex];
    if (!dx) return EMPTY;
    const palace = chart.palaces.find(p => p.branch === dx.palaceBranch);
    if (!palace) return EMPTY;
    return {
      badge: '限',
      starHua: invertTransforms(getSiHuaByStem(palace.stem)),
      branch: dx.palaceBranch,
      stemName: STEMS[palace.stem],
      caption: `${dx.startAge}–${dx.endAge}岁 · ${STEMS[palace.stem]}${BRANCHES[dx.palaceBranch]} ${dx.palaceName}`,
    };
  }

  const yearBranch = ((sel.year - 4) % 12 + 12) % 12;
  const yearStem = ((sel.year - 4) % 10 + 10) % 10;

  if (sel.view === 'liunian') {
    const r = getLiuNianSiHua(sel.year);
    return {
      badge: '年',
      starHua: invertTransforms(r.transforms),
      branch: yearBranch,
      stemName: r.stemName,
      caption: `${sel.year} ${r.stemName}${BRANCHES[yearBranch]}年 · 流年命宫在${BRANCHES[yearBranch]}`,
    };
  }

  if (sel.view === 'liuyue') {
    const r = getLiuYueSiHua(yearStem, sel.month, {
      isLeapMonth: chart.lunarInfo.isLeapMonth,
      liuriDay: sel.day,
      nextYearStem: ((sel.year + 1 - 4) % 10 + 10) % 10,
    });
    const branch = (yearBranch + (sel.month - 1)) % 12;
    return {
      badge: '月',
      starHua: invertTransforms(r.transforms),
      branch,
      stemName: r.stemName,
      caption: `${sel.year}年${sel.month}月 · ${r.stemName}月 · 流月命宫在${BRANCHES[branch]}`,
    };
  }

  // 流日 / 流时都要先拿到日干
  const dayHua = getLiuRiSiHua(
    sel.year,
    chart.lunarInfo.isLeapMonth ? -Math.abs(sel.month) : sel.month,
    sel.day,
    chart.lunarInfo.isLeapMonth,
  );
  const monthBranch = (yearBranch + (sel.month - 1)) % 12;
  const dayBranch = (monthBranch + (sel.day - 1)) % 12;

  if (sel.view === 'liuri') {
    return {
      badge: '日',
      starHua: dayHua ? invertTransforms(dayHua.transforms) : {},
      branch: dayBranch,
      stemName: dayHua?.stemName,
      caption: `${sel.month}月${sel.day}日 · ${dayHua?.stemName ?? ''}日 · 流日命宫在${BRANCHES[dayBranch]}`,
    };
  }

  // liushi
  const shiHua = getLiuShiSiHua(dayHua?.stemIndex ?? 0, sel.hour);
  const hourBranch = (dayBranch + sel.hour) % 12;
  return {
    badge: '时',
    starHua: invertTransforms(shiHua.transforms),
    branch: hourBranch,
    stemName: shiHua.stemName,
    caption: `${BRANCHES[sel.hour]}时 · ${shiHua.stemName}时 · 流时命宫在${BRANCHES[hourBranch]}`,
  };
}
