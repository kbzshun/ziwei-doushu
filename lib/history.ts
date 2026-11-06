/**
 * 本地命盘历史（localStorage）。
 * 参考站把记录存在账号下；开源版不接后端，改为存在本机浏览器，
 * 换设备不同步、清缓存会丢——界面上需要如实提示。
 */

import type { BirthInfo, ZiweiChart } from './ziwei/types';

const STORAGE_KEY = 'ziwei_chart_history_v1';
const MAX_ITEMS = 20;

export interface SavedChart {
  id: string;
  /** 用户可改的展示名 */
  name: string;
  savedAt: number;
  birth: BirthInfo;
  chart: ZiweiChart;
}

function safeParse(raw: string | null): SavedChart[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter(item => item && item.id && item.chart);
  } catch {
    return [];
  }
}

export function loadHistory(): SavedChart[] {
  if (typeof window === 'undefined') return [];
  try {
    return safeParse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function write(list: SavedChart[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch {
    /* 超出配额或被禁用：静默失败，不影响排盘 */
  }
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 新增一条记录（同一天同一时辰同一人视为重复，直接返回旧的） */
export function saveChart(birth: BirthInfo, chart: ZiweiChart): SavedChart {
  const list = loadHistory();
  const dup = list.find(item =>
    item.birth.year === birth.year &&
    item.birth.month === birth.month &&
    item.birth.day === birth.day &&
    item.birth.hour === birth.hour &&
    item.birth.gender === birth.gender &&
    (item.birth.name ?? '') === (birth.name ?? ''),
  );
  if (dup) return dup;

  const item: SavedChart = {
    id: makeId(),
    name: birth.name?.trim() || `${birth.year}-${birth.month}-${birth.day} ${birth.gender === 'male' ? '男' : '女'}`,
    savedAt: Date.now(),
    birth,
    chart,
  };
  write([item, ...list]);
  return item;
}

export function renameChart(id: string, name: string): SavedChart[] {
  const list = loadHistory().map(item => (item.id === id ? { ...item, name: name.trim() || item.name } : item));
  write(list);
  return list;
}

export function removeChart(id: string): SavedChart[] {
  const list = loadHistory().filter(item => item.id !== id);
  write(list);
  return list;
}

export function clearHistory(): SavedChart[] {
  write([]);
  return [];
}

/* ─── AI 分析历史 ─────────────────────────────────────────
   每次生成完一节解读就存一条，方便回看，不依赖后端。
   ──────────────────────────────────────────────────────── */

const ANALYSIS_KEY = 'ziwei_analysis_history_v1';
const MAX_ANALYSIS = 50;

export interface AnalysisRecord {
  id: string;
  /** 展示名，如「命格总览」「大限运势」「夫妻」 */
  label: string;
  /** 来源：topic / palace / period / sihua */
  kind: string;
  /** 所属命盘，便于区分 */
  chartLabel: string;
  content: string;
  savedAt: number;
}

function safeAnalysis(raw: string | null): AnalysisRecord[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((x) => x && x.id && x.content) : [];
  } catch {
    return [];
  }
}

export function loadAnalysisHistory(): AnalysisRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return safeAnalysis(localStorage.getItem(ANALYSIS_KEY));
  } catch {
    return [];
  }
}

function writeAnalysis(list: AnalysisRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANALYSIS_KEY, JSON.stringify(list.slice(0, MAX_ANALYSIS)));
  } catch {
    /* 配额满或被禁用：忽略 */
  }
}

/** 保存一条分析；同一命盘 + 同一主题 + 相同正文不重复存 */
export function saveAnalysis(rec: Omit<AnalysisRecord, 'id' | 'savedAt'>): AnalysisRecord[] {
  const list = loadAnalysisHistory();
  const dup = list.find(x =>
    x.label === rec.label && x.chartLabel === rec.chartLabel && x.content === rec.content);
  if (dup) return list;

  const item: AnalysisRecord = {
    ...rec,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    savedAt: Date.now(),
  };
  const next = [item, ...list].slice(0, MAX_ANALYSIS);
  writeAnalysis(next);
  return next;
}

export function removeAnalysis(id: string): AnalysisRecord[] {
  const next = loadAnalysisHistory().filter(x => x.id !== id);
  writeAnalysis(next);
  return next;
}

export function clearAnalysis(): AnalysisRecord[] {
  writeAnalysis([]);
  return [];
}
