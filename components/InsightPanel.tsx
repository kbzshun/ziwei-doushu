'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import AiContent from './AiContent';
import RadarChart from './RadarChart';
import { parseInsightExtras, stripMachineSections } from '@/lib/ai/radar';
import type { YunxianSelection } from '@/lib/ziwei/yunxian';
import { yunxianLabel, normalizePalaceName } from '@/lib/ziwei/yunxian';
import {
  clearAnalysis,
  loadAnalysisHistory,
  removeAnalysis,
  saveAnalysis,
  type AnalysisRecord,
} from '@/lib/history';
import AnalysisHistory, { AnalysisRecordView } from './AnalysisHistory';
import { isFreeKey, isPro, setPro } from '@/lib/entitlements';

/* ══════════════════════════════════════════════════════════
   交互模型：一个主题 = 一节内容（section）
   - 点「感情」只显示感情的解读，不再把新内容追加到旧内容后面；
   - 每节自己的追问、自己的流式状态，互不串台；
   - 已生成的节会被缓存，切回来直接显示，不重复请求。
   主题分两层：6 个领域主题 + 7 个宫位主题（与主题重叠的 5 宫不重复列出）。
   ══════════════════════════════════════════════════════════ */

export interface InsightTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface InsightSection {
  key: string;
  label: string;
  hint?: string;
  messages: InsightTurn[];
  loading: boolean;
  error?: string;
  lastPrompt?: string;
}

export interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

export interface InsightApi {
  sections: Record<string, InsightSection>;
  dynamicKeys: string[];
  activeKey: string;
  active: InsightSection | undefined;
  setActiveKey: (key: string) => void;
  openTopic: (key: string) => void;
  openPalace: (palace: Palace) => void;
  /** 选中某个运限（大限 / 流年 / 流月 / 流日 / 流时）→ 生成对应解读 */
  openPeriod: (
    sel: YunxianSelection,
    info: { caption: string; stemName?: string; starHua: Record<string, string> },
  ) => void;
  ask: (text: string) => void;
  retry: () => void;
  anyLoading: boolean;
  loadedCount: number;
  pro: boolean;
  quota: { used: number; limit: number; remaining: number } | null;
  planInfo: string | null;
  /** 被拦截的付费功能 key，非空时前端显示升级弹层 */
  upsellKey: string | null;
  dismissUpsell: () => void;
  /** 重新拉取身份与套餐（核销成功后调用，避免整页刷新丢失命盘） */
  refreshEntitlements: () => Promise<void>;
}

const TOPICS = [
  { key: 'overview',    label: '命格总览', hint: '命格总览' },
  { key: 'wealth',      label: '财运',     hint: '财运模式' },
  { key: 'career',      label: '事业',     hint: '事业格局' },
  { key: 'love',        label: '感情',     hint: '感情婚姻' },
  { key: 'personality', label: '性格',     hint: '性格特质' },
  { key: 'health',      label: '健康',     hint: '健康运势' },
] as const;

export const TOPIC_KEYS: string[] = TOPICS.map(t => t.key);

/** 宫位主题：命宫/财帛/官禄/夫妻/疾厄已由上面 6 个主题覆盖，不重复列出 */
const PALACE_TABS: { name: string; label: string }[] = [
  { name: '兄弟宫', label: '兄弟合伙' },
  { name: '子女宫', label: '子女' },
  { name: '迁移宫', label: '迁移外出' },
  { name: '交友宫', label: '人际贵人' },
  { name: '田宅宫', label: '田宅' },
  { name: '福德宫', label: '福德' },
  { name: '父母宫', label: '父母长辈' },
];

const TOPIC_PROMPTS: Record<string, string> = {
  overview: `请生成命格总览，按以下结构输出：

**【六维评分】**
只输出一行 JSON，键固定为综合/事业/财运/感情/性格/健康，值取 0-100 的整数，不要任何解释：
{"综合":78,"事业":82,"财运":70,"感情":65,"性格":80,"健康":72}

**【一句话定调】**
一句提纲挈领的总论，20 字以内。

**【一句话展开】**
紧接着用两三句话解释这句定调，说清这个命盘的底层逻辑。

**【核心优势】**
一句话概括他最稳的优势，落到具体可验证的做事方式。

**【关系模式】**
一句话说明他与人相处的默认模式。

**【成长课题】**
一句话点出他最容易卡住、最该修炼的地方。

**【命格定性】**
用一句话概括这个命盘的核心格局与命主气质。

**【主星解读】**
命宫主星的核心特质，引用倪海厦原话或观点。

**【三方四正】**
财、官、迁三宫的联动分析及整体格局。

**【当前大限】**
当下大限运势方向与最值得关注的事项。

**【优势与注意】**
命盘天赋优势，以及需要注意的风险或功课。`,

  love: `请深度分析感情婚姻运，按以下结构输出：

**【感情格局】**
一句话定性感情命格。

**【夫妻宫分析】**
夫妻宫主星、四化，以及倪海厦体系的具体解读。

**【三方联动】**
相关宫位对感情的影响。

**【当前大限感情运】**
当下10年感情走向与关键节点。

**【实际建议】**
具体可行的感情建议。`,

  career: `请深度分析事业运，按以下结构输出：

**【事业格局】**
一句话定性事业命格，宜任职或宜创业。

**【官禄宫分析】**
官禄宫主星、四化，以及倪师对这种配置的判断。

**【财帛宫联动】**
财运与事业的关系，财路来源分析。

**【当前大限事业运】**
当下10年事业走向。

**【实际建议】**
适合的方向、行业与策略。`,

  wealth: `请深度分析财运，按以下结构输出：

**【财运格局】**
一句话定性财运模式，是主动财还是被动财。

**【财帛宫分析】**
财帛宫主星、四化，财富来源与流动模式。

**【田宅宫（财库）】**
积蓄能力与不动产运势分析。

**【当前大限财运】**
当下财运走向与注意事项。

**【理财建议】**
具体的财务建议。`,

  health: `请分析健康运势，按以下结构输出：

**【疾厄宫主星】**
疾厄宫星曜与健康含义。

**【主要风险】**
结合倪海厦子午流注理论，分析主要健康隐患与需关注的部位。

**【大限健康走势】**
当下健康趋势与关键时间段。

**【预防建议】**
具体注意事项与养生方向。`,

  personality: `请深度解析性格特质，按以下结构输出：

**【命宫主星性格】**
命宫主星的核心性格特质，引用倪师原话。

**【三方性格综合】**
财、官、迁三宫对性格的影响，全貌描绘。

**【人际关系模式】**
与他人互动方式、待人处世风格。

**【优势与人生课题】**
天赋优势，以及需要面对的人生功课。`,
};

const PALACE_ROLES: Record<string, string> = {
  '命宫':   '自我、性格、先天格局',
  '兄弟宫': '兄弟关系、合伙人',
  '夫妻宫': '感情关系、婚姻状态',
  '子女宫': '子女缘分、下属关系',
  '财帛宫': '财运来源、收入方式',
  '疾厄宫': '身体健康、意外',
  '迁移宫': '外出机遇、人际格局',
  '交友宫': '朋友圈、贵人、小人',
  '官禄宫': '事业成就、社会地位',
  '田宅宫': '不动产、家庭环境',
  '福德宫': '精神享受、内心福分',
  '父母宫': '父母关系、文书契约',
};

function buildPalacePrompt(palace: Palace): string {
  const majorStars = palace.stars.filter(s => s.type === 'major');
  const starDesc = majorStars.length > 0
    ? majorStars.map(s => `${s.name}${s.siHua ? '化' + s.siHua : ''}`).join('、')
    : `空宫（借对宫${palace.borrowedFromName ?? ''}）`;
  const role = PALACE_ROLES[palace.name] ?? PALACE_ROLES[`${normalizePalaceName(palace.name)}宫`] ?? '';

  return `请重点分析【${palace.name}】（主管：${role}），该宫主星为${starDesc}，按以下结构输出：

**【宫位定性】**
${palace.name}在命盘中的意义，以及这种星曜配置的整体判断。

**【主星解读】**
主星在此宫的倪海厦体系解读，引用具体观点。

**【三方四正联动】**
三方四正宫位对此宫的影响。

**【实际建议】**
基于此宫的具体建议。`;
}

function buildSiHuaPrompt(chart: ZiweiChart, sihua: SelectedSiHua): string {
  const palaceOfStar = chart.palaces.find(p => p.stars.some(s => s.name === sihua.starName));
  const palaceName = palaceOfStar?.name ?? '未知宫位';
  const viewLabel = sihua.view === 'daxian' ? '大限' : '流年';

  return `请分析【${viewLabel}${sihua.starName}化${sihua.siHua}】的飞化影响，按以下结构输出：

**【化${sihua.siHua}基本含义】**
化${sihua.siHua}在倪海厦体系中的核心含义，以及${sihua.starName}化${sihua.siHua}的特殊含义。

**【落宫影响】**
${sihua.starName}化${sihua.siHua}落在【${palaceName}】，该宫主管的领域受到何种影响，倪师如何解读。

**【三方四正飞化路径】**
化${sihua.siHua}入${palaceName}后，对其三方四正（对宫、两个三合宫）的联动影响。

**【当前运势影响】**
在${viewLabel}时间维度下，此化${sihua.siHua}对命主近期运势的具体影响。

**【实际建议】**
基于此四化的具体可操作建议。`;
}

interface StartOptions {
  key: string;
  label: string;
  hint?: string;
  prompt: string;
  bubble?: string;
  append?: boolean;
  force?: boolean;
}

export function useInsight(
  chart: ZiweiChart,
  selectedPalace?: Palace | null,
  selectedSiHua?: SelectedSiHua | null,
): InsightApi {
  const [sections, setSections] = useState<Record<string, InsightSection>>({});
  const [dynamicKeys, setDynamicKeys] = useState<string[]>([]);
  const [activeKey, setActiveKey] = useState<string>(TOPICS[0].key);

  const chartRef = useRef(chart);
  chartRef.current = chart;
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const startedRef = useRef<Set<string>>(new Set());
  const inflightRef = useRef<Set<string>>(new Set());

  /* 权限：由服务端下发（GitHub 白名单 或 已核销的兑换码） */
  const [pro, setPro] = useState(false);
  const proRef = useRef(false);
  proRef.current = pro;
  const [upsellKey, setUpsellKey] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const [planInfo, setPlanInfo] = useState<string | null>(null);

  /* 身份与套餐：可重复调用（核销兑换码后刷新，不必整页重载） */
  const refreshEntitlements = useCallback(async () => {
    try {
      const me = (await fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.json())) as { pro?: boolean };
      setPro(!!me.pro);
    } catch { /* 离线时按未付费处理 */ }

    try {
      const d = (await fetch('/api/usage', { cache: 'no-store' }).then(r => r.json())) as {
        pro?: boolean; used?: number; limit?: number; remaining?: number;
        planName?: string | null; expiresAt?: number | null;
      };
      if (!d.pro) {
        setQuota({ used: d.used ?? 0, limit: d.limit ?? 0, remaining: d.remaining ?? 0 });
        setPlanInfo(null);
      } else if (d.planName) {
        const exp = d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('zh-CN') : '';
        setPlanInfo(`${d.planName}${exp ? ` · 到期 ${exp}` : ''}`);
      }
    } catch { /* 忽略 */ }
  }, []);

  useEffect(() => { void refreshEntitlements(); }, [refreshEntitlements]);

  const writeStreamingText = useCallback((key: string, text: string) => {
    setSections(prev => {
      const sec = prev[key];
      if (!sec) return prev;
      const messages = [...sec.messages];
      if (messages.length === 0) return prev;
      messages[messages.length - 1] = { role: 'assistant', content: text };
      return { ...prev, [key]: { ...sec, messages } };
    });
  }, []);

  const finishSection = useCallback((key: string, patch: Partial<InsightSection>, errorText?: string) => {
    inflightRef.current.delete(key);
    setSections(prev => {
      const sec = prev[key];
      if (!sec) return prev;
      const messages = [...sec.messages];
      if (errorText) {
        const last = messages[messages.length - 1];
        if (last && last.role === 'assistant' && !last.content) {
          messages[messages.length - 1] = { role: 'assistant', content: errorText };
        } else {
          messages.push({ role: 'assistant', content: errorText });
        }
      }
      return { ...prev, [key]: { ...sec, ...patch, messages } };
    });
  }, []);

  const runStream = useCallback(async (key: string, apiMessages: InsightTurn[]) => {
    try {
      const send = (withFeature: boolean) =>
        fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chart: chartRef.current,
            messages: apiMessages,
            ...(withFeature ? { feature: key } : {}),
          }),
        });

      let res = await send(true);
      // 兜底：免费主题被服务端误判为付费（旧缓存前端、key 不一致等），
      // 去掉 feature 再请求一次，服务端按免费主题处理并计入每日限额。
      if ((res.status === 403 || res.status === 401) && isFreeKey(key)) res = await send(false);
      if (res.status === 404) throw new Error('api-missing');
      if (res.status === 401) throw new Error('login-required');
      if (res.status === 403) throw new Error('pro-required');
      if (res.status === 429) throw new Error('limit-reached');
      if (!res.ok) throw new Error(`请求失败（${res.status}）`);
      if (!res.body) throw new Error('无响应流');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // SSE 分片可能截断在半行，必须把尾部留到下一轮再解析
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const delta: string = JSON.parse(data)?.delta?.text ?? '';
            if (!delta) continue;
            acc += delta;
            writeStreamingText(key, acc);
          } catch {
            /* 半行 JSON，交给下一轮 */
          }
        }
      }

      if (!acc.trim()) {
        finishSection(key, { loading: false, error: '模型没有返回内容' }, '模型没有返回内容，请重试。');
      } else {
        finishSection(key, { loading: false, error: undefined });

        // 生成完就落一条历史，方便回看
        const sec = sectionsRef.current[key];
        const kind = key.startsWith('palace:') ? 'palace'
          : key.startsWith('period:') ? 'period'
          : key.startsWith('sihua:') ? 'sihua'
          : 'topic';
        const b = chartRef.current.birthInfo;
        saveAnalysis({
          label: sec?.label ?? '解读',
          kind,
          chartLabel: `${b.name || '未命名'} ${b.year}-${b.month}-${b.day}`,
          content: acc,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误';
      const text = msg === 'api-missing'
        ? '未找到 /api/interpret 接口，请确认已配置 DeepSeek Key 且服务正常启动。'
        : msg === 'login-required'
          ? '该功能属于专业版，请输入兑换码解锁。'
          : msg === 'pro-required'
            ? '该功能属于专业版，请输入兑换码解锁。'
            : msg === 'limit-reached'
              ? '今日免费解读次数已用完，升级套餐后不限次数。'
              : `解读失败：${msg}`;
      if (msg === 'limit-reached') setUpsellKey(key);
      finishSection(key, { loading: false, error: text }, text);
    }
  }, [finishSection, writeStreamingText]);

  const startSection = useCallback((opts: StartOptions) => {
    const { key, label, hint, prompt, bubble, append, force } = opts;

    // 所有入口（标签、盘面宫格、运限时间轴）统一在这里拦截
    if (!isFreeKey(key) && !proRef.current) {
      setUpsellKey(key);
      return;
    }

    const current = sectionsRef.current[key];

    if (!append && current && !force) return;   // 已存在：直接复用，不重复请求
    if (inflightRef.current.has(key)) return;   // 同一节只允许一个请求在飞
    inflightRef.current.add(key);
    startedRef.current.add(key);

    // 免费 / 专业版用不同深度的提示词（追问不追加，避免污染对话）
    const depth = proRef.current
      ? '\n\n【深度模式】每个小节不少于 300 字，按「结论 → 盘面依据 → 具体建议」三段写。盘面依据要指明涉及哪些星曜（含庙旺利陷）、哪些宫位、哪几化、命中什么格局；古籍依据可引用《紫微斗数全书》《骨髓赋》等原文。\n额外要求：① 用大白话解释术语，让没接触过命理的读者也能看懂；② 能给表格的用表格对比（如三方四正各宫主星一览）；③ 避免绝对化断言，健康与风险用中性表述；④ 涉及大限时说明当前大限与近三年流年的走向；⑤ 结尾加一句「命理分析仅供参考，人生走向以个人选择与努力为准」。'
      : '\n\n【精简模式】整体控制在 600 字以内，每个小节 2-3 句话，先给结论，不展开举例。';

    const finalPrompt = append ? prompt : prompt + depth;
    const history = append ? (current?.messages ?? []) : [];
    const apiMessages: InsightTurn[] = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: finalPrompt },
    ];

    setSections(prev => {
      const base = prev[key];
      const seeded: InsightTurn[] = [];
      if (append && base) seeded.push(...base.messages);
      if (bubble) seeded.push({ role: 'user', content: bubble });
      seeded.push({ role: 'assistant', content: '' });

      return {
        ...prev,
        [key]: { key, label, hint, lastPrompt: finalPrompt, loading: true, error: undefined, messages: seeded },
      };
    });

    if (!TOPIC_KEYS.includes(key)) {
      setDynamicKeys(prev => (prev.includes(key) ? prev : [...prev, key]));
    }

    void runStream(key, apiMessages);
  }, [runStream]);

  /* ── 换盘：清空所有节 ── */
  const chartIdentity = useRef(chart);
  useEffect(() => {
    if (chartIdentity.current === chart) return;
    chartIdentity.current = chart;
    startedRef.current.clear();
    inflightRef.current.clear();
    setSections({});
    setDynamicKeys([]);
    setActiveKey(TOPICS[0].key);
  }, [chart]);

  /* ── 首次进入：自动生成命格总览 ── */
  useEffect(() => {
    if (startedRef.current.has('overview')) return;
    startSection({ key: 'overview', label: '命格总览', hint: '命格总览', prompt: TOPIC_PROMPTS.overview });
  }, [startSection]);

  const openPalace = useCallback((palace: Palace) => {
    const key = `palace:${palace.branch}`;
    setActiveKey(key);
    startSection({
      key,
      label: palace.name.replace('宫', '') || '命宫',
      hint: PALACE_ROLES[palace.name] ?? PALACE_ROLES[`${normalizePalaceName(palace.name)}宫`],
      prompt: buildPalacePrompt(palace),
    });
  }, [startSection]);

  /* ── 点盘面宫位 ── */
  useEffect(() => {
    if (!selectedPalace) return;
    openPalace(selectedPalace);
  }, [selectedPalace, openPalace]);

  /* ── 点四化 ── */
  useEffect(() => {
    if (!selectedSiHua) return;
    const key = `sihua:${selectedSiHua.starName}:${selectedSiHua.siHua}:${selectedSiHua.view}`;
    setActiveKey(key);
    startSection({
      key,
      label: `${selectedSiHua.starName}化${selectedSiHua.siHua}`,
      hint: selectedSiHua.view === 'daxian' ? '大限四化' : '流年四化',
      prompt: buildSiHuaPrompt(chart, selectedSiHua),
    });
  }, [selectedSiHua, chart, startSection]);

  const openTopic = useCallback((key: string) => {
    const topic = TOPICS.find(t => t.key === key);
    setActiveKey(key);
    if (!topic) return;
    startSection({ key, label: topic.label, hint: topic.hint, prompt: TOPIC_PROMPTS[key] });
  }, [startSection]);

  const openPeriod = useCallback((
    sel: YunxianSelection,
    info: { caption: string; stemName?: string; starHua: Record<string, string> },
  ) => {
    if (sel.view === 'mingpan') return;
    const key = `period:${sel.view}:${sel.year}:${sel.month}:${sel.day}:${sel.hour}:${sel.daXianIndex}`;
    const label = `${yunxianLabel(sel.view)}运势`;
    const huaList = Object.entries(info.starHua).map(([star, hua]) => `${star}化${hua}`).join('、') || '（无四化）';

    setActiveKey(key);
    startSection({
      key,
      label,
      hint: info.caption,
      prompt: `请分析【${info.caption}】这段运限的整体运势。本运限四化：${huaList}。

按以下结构输出：

**【运限定性】**
一句话概括这段运限的整体基调（吉凶倾向、宜进宜守）。

**【四化落宫】**
逐颗说明上面列出的四化分别落在哪一宫、对该宫主管领域的具体影响。

**【重点宫位】**
这段运限里最值得关注的 2-3 个宫位，说明判断依据。

**【应事建议】**
具体可执行的建议：该抓什么、该避什么。`,
    });
  }, [startSection]);

  const ask = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const key = activeKey;
    const sec = sectionsRef.current[key];
    startSection({
      key,
      label: sec?.label ?? '追问',
      hint: sec?.hint,
      prompt: trimmed,
      bubble: trimmed,
      append: true,
    });
  }, [activeKey, startSection]);

  const retry = useCallback(() => {
    const key = activeKey;
    const sec = sectionsRef.current[key];
    if (!sec?.lastPrompt) return;
    setSections(prev => {
      const cur = prev[key];
      if (!cur) return prev;
      return { ...prev, [key]: { ...cur, error: undefined } };
    });
    startSection({ key, label: sec.label, hint: sec.hint, prompt: sec.lastPrompt, force: true });
  }, [activeKey, startSection]);

  const anyLoading = Object.values(sections).some(s => s.loading);
  const loadedCount = Object.values(sections).filter(s => s.messages.some(m => m.role === 'assistant' && m.content)).length;

  return {
    sections,
    dynamicKeys,
    activeKey,
    active: sections[activeKey],
    setActiveKey,
    openTopic,
    openPalace,
    openPeriod,
    ask,
    retry,
    anyLoading,
    loadedCount,
    pro,
    quota,
    planInfo,
    upsellKey,
    dismissUpsell: () => setUpsellKey(null),
    refreshEntitlements,
  };
}

/* ────────────────────────────────────────────────────────── */

interface InsightPanelProps {
  insight: InsightApi;
  /** 命盘页左侧选中的宫位（点击盘面时同步高亮对应标签） */
  chart?: ZiweiChart;
  onExport?: () => void;
  onReset?: () => void;
  exportHint?: string;
}

export default function InsightPanel({ insight, chart, onExport, onReset, exportHint }: InsightPanelProps) {
  const { sections, dynamicKeys, activeKey, active, openTopic, openPalace, setActiveKey, ask, retry, anyLoading, loadedCount, quota, planInfo, upsellKey, dismissUpsell, refreshEntitlements } = insight;
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'analysis' | 'chat'>('analysis');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeMsg, setCodeMsg] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);

  const submitCode = async () => {
    const code = codeInput.trim();
    if (!code || codeBusy) return;
    setCodeBusy(true);
    setCodeMsg('');
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        // 关键：不能 location.reload()，整页刷新会把已排好的命盘清空
        await refreshEntitlements();
        setCodeInput('');
        setCodeMsg('已解锁，点击上方标签即可查看对应解读');
        setTimeout(() => { dismissUpsell(); setCodeMsg(''); }, 1200);
      } else {
        setCodeMsg(data.error ?? '核销失败，请稍后重试');
      }
    } catch {
      setCodeMsg('网络异常，请稍后重试');
    } finally {
      setCodeBusy(false);
    }
  };

  const [historyItems, setHistoryItems] = useState<AnalysisRecord[]>([]);
  const [viewingRecord, setViewingRecord] = useState<AnalysisRecord | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const lastAssistant = active?.messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content ?? '';
  const thinking = !!active?.loading && !lastAssistant;

  /* 命格总览的结构化部分：六维雷达 + 三张结论卡 */
  const extras = useMemo(
    () => (active?.key === 'overview' ? parseInsightExtras(lastAssistant) : null),
    [active?.key, lastAssistant],
  );

  /* 切换标签：内容回到顶部，不要自动滚到底 */
  useEffect(() => {
    stickToBottom.current = false;
    scrollRef.current?.scrollTo({ top: 0 });
  }, [activeKey]);

  /* 流式输出：只有用户本来就在底部时才跟随 */
  useEffect(() => {
    if (!stickToBottom.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastAssistant]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
  };

  const handleSend = () => {
    if (!input.trim() || active?.loading) return;
    ask(input);
    setInput('');
    stickToBottom.current = true;
  };

  /* 四化 / 运限节作为胶囊显示；宫位节已经在固定标签里 */
  const sihuaSections = dynamicKeys
    .filter(k => k.startsWith('sihua:') || k.startsWith('period:'))
    .map(k => sections[k])
    .filter(Boolean);

  // 宫名后缀不统一（兄弟 / 仆役 无「宫」），按归一化名匹配
  const palaceOf = (name: string) =>
    chart?.palaces.find(p => normalizePalaceName(p.name) === normalizePalaceName(name));

  return (
    <div className="card-glass relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
      {/* 头部：分析 / 对话 */}
      <div className="flex flex-none items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--bdr)' }}>
        <div className="flex gap-1">
          {([['analysis', '命盘分析'], ['chat', 'AI 对话']] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setMode(k)}
              className="rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
              style={{
                background: mode === k ? 'var(--ac-bg)' : 'transparent',
                border: `1px solid ${mode === k ? 'var(--ac-bdr)' : 'var(--bdr)'}`,
                color: mode === k ? 'var(--ac)' : 'var(--tx-3)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 text-[10px]" style={{ color: 'var(--tx-3)' }}>
          {anyLoading && (
            <span className="flex items-center gap-1.5" style={{ color: 'var(--ac)' }}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: 'var(--ac)' }} />
              生成中
            </span>
          )}
          {!anyLoading && loadedCount > 0 && <span>已生成 {loadedCount} 项</span>}
          {planInfo && (
            <span className="chip chip-ac !px-2 !py-0 !text-[9px]">{planInfo}</span>
          )}
          {quota && (
            <span className="chip !px-2 !py-0 !text-[9px]"
              style={quota.remaining === 0 ? { color: 'var(--ji)', borderColor: 'var(--ji)' } : undefined}>
              今日剩余 {quota.remaining}/{quota.limit}
            </span>
          )}
          <button
            type="button"
            onClick={() => { setHistoryItems(loadAnalysisHistory()); setViewingRecord(null); setHistoryOpen(true); }}
            className="btn-glass !px-2.5 !py-1 !text-[10px]"
          >
            历史
          </button>
          {onReset && (
            <button type="button" onClick={onReset} className="btn-glass !px-2.5 !py-1 !text-[10px]">
              重新起盘
            </button>
          )}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="btn-accent !px-3 !py-1 !text-[10px]"
              title={exportHint ?? '调用浏览器打印，另存为 PDF'}
            >
              ⬇ 导出 PDF
            </button>
          )}
        </div>
      </div>

      {/* 主题 / 宫位 标签 */}
      {mode === 'analysis' && (
        <div className="flex-none px-3 pb-2.5 pt-2.5" style={{ borderBottom: '1px solid var(--bdr)' }}>
          <div className="grid grid-cols-6 gap-1">
            {TOPICS.map(topic => {
              const isActive = activeKey === topic.key;
              const sec = sections[topic.key];
              const done = !!sec && sec.messages.some(m => m.role === 'assistant' && m.content) && !sec.loading;
              return (
                <button
                  key={topic.key}
                  type="button"
                  onClick={() => openTopic(topic.key)}
                  className="relative rounded-lg py-1.5 text-[11px] font-medium transition-all duration-150"
                  style={{
                    background: isActive ? 'var(--ac-bg)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--ac-bdr)' : 'var(--bdr)'}`,
                    color: isActive ? 'var(--ac)' : done ? 'var(--tx-2)' : 'var(--tx-3)',
                  }}
                >
                  {topic.label}
                  {sec?.loading && (
                    <span className="absolute right-1 top-1 h-1 w-1 animate-pulse rounded-full" style={{ background: 'var(--ac)' }} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span className="mr-1 text-[9px] tracking-wider" style={{ color: 'var(--tx-3)' }}>宫位</span>
            {PALACE_TABS.map(tab => {
              const palace = palaceOf(tab.name);
              const key = palace ? `palace:${palace.branch}` : '';
              const isActive = !!key && activeKey === key;
              const sec = key ? sections[key] : undefined;
              const done = !!sec && sec.messages.some(m => m.role === 'assistant' && m.content) && !sec.loading;
              return (
                <button
                  key={tab.name}
                  type="button"
                  disabled={!palace}
                  onClick={() => palace && openPalace(palace)}
                  className="relative rounded-full px-2.5 py-1 text-[10px] transition-colors disabled:opacity-40"
                  style={{
                    background: isActive ? 'var(--ac-bg)' : 'var(--glass-bg-2)',
                    border: `1px solid ${isActive ? 'var(--ac-bdr)' : 'var(--bdr)'}`,
                    color: isActive ? 'var(--ac)' : done ? 'var(--tx-2)' : 'var(--tx-3)',
                  }}
                >
                  {tab.label}
                  {sec?.loading && (
                    <span className="absolute right-0.5 top-0.5 h-1 w-1 animate-pulse rounded-full" style={{ background: 'var(--ac)' }} />
                  )}
                </button>
              );
            })}

            {sihuaSections.map(sec => {
              const isActive = activeKey === sec.key;
              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => setActiveKey(sec.key)}
                  className="rounded-full px-2.5 py-1 text-[10px] transition-colors"
                  style={{
                    background: isActive ? 'var(--ac-bg)' : 'var(--glass-bg-2)',
                    border: `1px solid ${isActive ? 'var(--ac-bdr)' : 'var(--bdr)'}`,
                    color: isActive ? 'var(--ac)' : 'var(--tx-3)',
                  }}
                >
                  {sec.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 当前节内容 */}
      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {active?.hint && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[10px] tracking-wider" style={{ color: 'var(--tx-3)' }}>{active.hint}</span>
            <span className="h-px flex-1" style={{ background: 'var(--bdr)' }} />
          </div>
        )}

        {extras && (
          <div className="mb-5">
            {extras.scores.length >= 3 && (
              <div className="card-inner flex flex-col items-center px-3 py-2">
                <RadarChart scores={extras.scores} size={260} />
                <p className="mt-1 text-center text-[9px]" style={{ color: 'var(--tx-3)' }}>
                  六边形按本盘星曜、四化与辅煞的相对强弱示意，不是打分
                </p>
              </div>
            )}

            {extras.cards.length > 0 && (
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {extras.cards.map(card => (
                  <div key={card.title} className="card-inner p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium" style={{ color: 'var(--ac)' }}>
                      <span aria-hidden>✦</span>
                      {card.title}
                    </div>
                    <p className="text-[11px] leading-6" style={{ color: 'var(--tx-2)' }}>{card.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {thinking && (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <span className="text-2xl" style={{ color: 'var(--ac)', opacity: 0.25 }}>✦</span>
            <span className="animate-pulse text-[11px]" style={{ color: 'var(--tx-3)' }}>正在推演…</span>
          </div>
        )}

        {!thinking && !active && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="text-2xl" style={{ color: 'var(--ac)', opacity: 0.25 }}>✦</span>
            <span className="text-[11px]" style={{ color: 'var(--tx-3)' }}>
              选一个主题或宫位，生成对应解读
            </span>
          </div>
        )}

        {active?.messages.map((msg, i) => {
          if (msg.role === 'user') {
            return (
              <div key={i} className="mb-3 flex justify-end">
                <div
                  className="max-w-[85%] rounded-xl px-3 py-2 text-[11px]"
                  style={{ background: 'var(--ac-bg)', border: '1px solid var(--ac-bdr)', color: 'var(--ac)' }}
                >
                  {msg.content}
                </div>
              </div>
            );
          }
          const shown = active.key === 'overview' ? stripMachineSections(msg.content) : msg.content;
          if (!shown) return null;
          const isLast = i === active.messages.length - 1;
          return (
            <div key={i} className="mb-4">
              {i > 0 && (
                <div className="mb-2 flex items-center gap-1.5 text-[9px] tracking-widest" style={{ color: 'var(--tx-3)' }}>
                  <span style={{ color: 'var(--ac)', opacity: 0.5 }}>✦</span>
                  命理解读
                </div>
              )}
              <AiContent text={shown} streaming={!!active.loading && isLast} />
            </div>
          );
        })}

        {active?.error && (
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[10px]" style={{ color: 'var(--ji)' }}>{active.error}</span>
            <button type="button" onClick={retry} className="btn-glass">重试</button>
          </div>
        )}
      </div>

      {/* 追问（只作用于当前标签） */}
      <div className="flex-none px-3 pb-3 pt-2" style={{ borderTop: '1px solid var(--bdr)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={mode === 'chat' ? '问点什么，例如：今年适合换工作吗？' : `就「${active?.label ?? '当前主题'}」继续追问…`}
            disabled={active?.loading}
            className="input-base !py-2 !text-[11px]"
          />
          <button type="button" onClick={handleSend} disabled={active?.loading || !input.trim()} className="btn-glass">
            {active?.loading ? '…' : '发送'}
          </button>
        </div>
      </div>


      {upsellKey && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,14,24,0.35)', backdropFilter: 'blur(4px)' }}>
          <div className="card-glass w-full max-w-sm p-5">
            <div className="mb-1 text-[15px] font-semibold" style={{ color: 'var(--tx-0)' }}>升级专业版</div>
            <p className="mb-4 text-[11.5px] leading-6" style={{ color: 'var(--tx-2)' }}>
              感情、十二宫位、运限（大限/流年/流月/流日/流时）与四化解读为专业版功能。
              免费可查看：排盘、命格总览、财运、事业、性格、健康。
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/redeem-qr.png" alt="微信收款码"
              className="mx-auto mb-3 w-44 rounded-lg"
              style={{ border: '1px solid var(--bdr)' }} />
            <div className="mb-2 space-y-1 text-[11px]" style={{ color: 'var(--tx-2)' }}>
              <div className="flex justify-between"><span>包月 · 30 天</span><span style={{ color: 'var(--tx-0)' }}>¥9.9</span></div>
              <div className="flex justify-between"><span>包季 · 90 天</span><span style={{ color: 'var(--tx-0)' }}>¥19.9</span></div>
              <div className="flex justify-between"><span>永久 · 一次买断（最划算）</span><span style={{ color: 'var(--tx-0)' }}>¥39.9</span></div>
            </div>
            <p className="mb-3 text-[10.5px] leading-5" style={{ color: 'var(--tx-3)' }}>
              扫码付款（金额按上面套餐），备注写「你的微信名 + 套餐」（如 张三包月）。作者核对后会通知你领取。
              填入下方即可解锁，同一浏览器有效期 90 天。
            </p>
            <input
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitCode()}
              placeholder="输入兑换码，如 ZW-7K3F9"
              className="input-base mb-2 !py-2 !text-[12px]"
            />
            {codeMsg && (
              <p className="mb-2 text-[10px]" style={{ color: 'var(--ji)' }}>{codeMsg}</p>
            )}
            <div className="mb-2 text-center text-[10px]" style={{ color: 'var(--tx-3)' }}>
              <a href="/pricing" className="underline">查看套餐详情</a> · <a href="/claim" className="underline">已付款，去领取兑换码</a>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-accent flex-1 !py-2 !text-[12px]"
                disabled={codeBusy} onClick={submitCode}>
                {codeBusy ? '核销中…' : '解锁'}
              </button>
              <button type="button" className="btn-glass !py-2 !text-[12px]"
                onClick={dismissUpsell}>
                稍后
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 历史浮层：覆盖在面板上，不改动主内容区结构 */}
      {historyOpen && (
        <div
          className="absolute inset-0 z-30 flex flex-col p-3"
          style={{ background: 'var(--bg-0)' }}
        >
          {viewingRecord ? (
            <AnalysisRecordView item={viewingRecord} onBack={() => setViewingRecord(null)} />
          ) : (
            <AnalysisHistory
              items={historyItems}
              onOpen={setViewingRecord}
              onDelete={id => setHistoryItems(removeAnalysis(id))}
              onClear={() => setHistoryItems(clearAnalysis())}
              onBack={() => setHistoryOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
