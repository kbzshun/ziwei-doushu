'use client';
import { useEffect, useState } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import { detectPatterns, getMingGongSummary } from '@/lib/ziwei/patterns';
import { parseAiMarkdown } from '@/lib/ai/markdown-lite';
import ReportChartGrid from './ReportChartGrid';
import type { InsightSection } from './InsightPanel';

interface AnalysisReportProps {
  chart: ZiweiChart;
  /** 已生成内容的节，按展示顺序传入 */
  sections: InsightSection[];
}

/**
 * 打印版分析报告。
 *
 * 常驻在页面里（`.print-only` 屏上隐藏），点「导出 PDF」时调用 window.print()，
 * 由浏览器打印对话框选择“另存为 PDF”。好处是完全离线、无第三方库、样式可控。
 */
export default function AnalysisReport({ chart, sections }: AnalysisReportProps) {
  const [printedAt, setPrintedAt] = useState('');

  useEffect(() => {
    const stamp = () => setPrintedAt(new Date().toLocaleString('zh-CN', { hour12: false }));
    stamp();
    window.addEventListener('beforeprint', stamp);
    return () => window.removeEventListener('beforeprint', stamp);
  }, []);

  const patterns = detectPatterns(chart);
  const { stars: mingStars, keywords, nature } = getMingGongSummary(chart);
  const currentDx = chart.daXians[chart.currentDaXianIndex];
  const info = chart.birthInfo;

  const siHuaList: { star: string; hua: string; palace: string }[] = [];
  for (const palace of chart.palaces) {
    for (const star of palace.stars) {
      if (star.siHua) siHuaList.push({ star: star.name, hua: star.siHua, palace: palace.name });
    }
  }
  const huaOrder = ['禄', '权', '科', '忌'];
  siHuaList.sort((a, b) => huaOrder.indexOf(a.hua) - huaOrder.indexOf(b.hua));

  const filled = sections.filter(s => s.messages.some(m => m.role === 'assistant' && m.content.trim()));

  return (
    <div className="print-only report">
      <h1>紫微斗数命盘分析报告</h1>
      <p className="report-meta">
        {info.name ? `${info.name} · ` : ''}
        {info.gender === 'male' ? '男' : '女'}
        {info.province ? ` · 出生地 ${info.province}${info.city ?? ''}` : ''}
        {printedAt ? ` · 生成于 ${printedAt}` : ''}
      </p>

      <h2>一、基本信息</h2>
      <table>
        <tbody>
          <tr>
            <th style={{ width: '22%' }}>公历</th>
            <td>{info.year} 年 {info.month} 月 {info.day} 日 {BRANCHES[info.hour]}时</td>
            <th style={{ width: '22%' }}>农历</th>
            <td>
              {chart.lunarInfo.lunarYear} 年{chart.lunarInfo.isLeapMonth ? '闰' : ''}
              {chart.lunarInfo.lunarMonth} 月{chart.lunarInfo.lunarDay} 日
            </td>
          </tr>
          <tr>
            <th>干支</th>
            <td>
              {STEMS[chart.lunarInfo.yearStem]}{BRANCHES[chart.lunarInfo.yearBranch]}年
              {chart.lunarInfo.fourPillars ? ` · ${chart.lunarInfo.fourPillars.join(' ')}` : ''}
            </td>
            <th>性别</th>
            <td>{info.gender === 'male' ? '男' : '女'}{chart.yinYangGender ? ` · ${chart.yinYangGender}` : ''}</td>
          </tr>
          <tr>
            <th>命宫 / 身宫</th>
            <td>{BRANCHES[chart.mingGongBranch]} / {BRANCHES[chart.shenGongBranch]}</td>
            <th>五行局</th>
            <td>{chart.wuxingJuName}</td>
          </tr>
          <tr>
            <th>命主 / 身主</th>
            <td>{chart.mingZhu ?? '—'} / {chart.shenZhu ?? '—'}</td>
            <th>当前大限</th>
            <td>
              {currentDx ? `${currentDx.startAge}–${currentDx.endAge} 岁 · ${currentDx.palaceName}` : '—'}
              （虚岁 {chart.currentAge}）
            </td>
          </tr>
        </tbody>
      </table>

      <h2>二、命盘</h2>
      <ReportChartGrid chart={chart} />

      <h2>三、命盘概要</h2>
      <p>
        <strong>命宫主星：</strong>
        {mingStars.length > 0 ? mingStars.join('、') : '空宫（借对宫）'}
        {nature ? `（${nature}）` : ''}
      </p>
      {keywords.length > 0 && (
        <p><strong>性格特质：</strong>{keywords.join('、')}</p>
      )}
      {siHuaList.length > 0 && (
        <p>
          <strong>本命四化：</strong>
          {siHuaList.map(s => `${s.star}化${s.hua}（${s.palace}）`).join('、')}
        </p>
      )}

      {patterns.length > 0 && (
        <>
          <h3>识别到的格局（{patterns.length}）</h3>
          <ul>
            {patterns.map((p, i) => (
              <li key={i}>
                <strong>{p.name}</strong>
                {p.palaces.length > 0 ? `（${p.palaces.map(x => x.replace('宫', '')).join('、')}）` : ''}
                ：{p.description}
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>四、AI 深度解读</h2>
      {filled.length === 0 ? (
        <p className="report-meta">尚未生成解读内容。请先在页面上点击需要分析的主题，再导出报告。</p>
      ) : (
        filled.map(section => (
          <div key={section.key} className="report-section">
            <h3>{section.label}{section.hint ? ` · ${section.hint}` : ''}</h3>
            {section.messages.map((msg, i) => {
              if (msg.role === 'user') {
                return (
                  <p key={i} className="report-meta">
                    <strong>追问：</strong>{msg.content}
                  </p>
                );
              }
              return <ReportAiText key={i} text={msg.content} />;
            })}
          </div>
        ))
      )}

      <div className="report-foot">
        <hr />
        本报告由排盘引擎依据倪海厦《天纪》三合派体系生成，AI 内容仅供参考，不构成医疗、投资、法律等专业建议。
        <br />
        命盘只是「天」的三分之一，环境与选择同样重要。
      </div>
    </div>
  );
}

/** 打印版正文：把模型的分段结构还原成标题 + 段落，白底黑字 */
function ReportAiText({ text }: { text: string }) {
  const blocks = parseAiMarkdown(text);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.kind === 'blank') return null;
        if (block.kind === 'section') {
          return <p key={i} style={{ marginTop: '3mm' }}><strong>【{block.title}】</strong></p>;
        }
        if (block.kind === 'heading') {
          return <p key={i}><strong>{block.text}</strong></p>;
        }
        if (block.kind === 'bullet') {
          return (
            <ul key={i}>
              <li>
                {block.spans.map((s, j) => (s.bold ? <strong key={j}>{s.text}</strong> : <span key={j}>{s.text}</span>))}
              </li>
            </ul>
          );
        }
        return (
          <p key={i}>
            {block.spans.map((s, j) => (s.bold ? <strong key={j}>{s.text}</strong> : <span key={j}>{s.text}</span>))}
          </p>
        );
      })}
    </>
  );
}
