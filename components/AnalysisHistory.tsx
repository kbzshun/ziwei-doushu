'use client';
import type { AnalysisRecord } from '@/lib/history';
import AiContent from './AiContent';

interface AnalysisHistoryProps {
  items: AnalysisRecord[];
  onOpen: (item: AnalysisRecord) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onBack: () => void;
}

const KIND_LABEL: Record<string, string> = {
  topic: '主题',
  palace: '宫位',
  period: '运限',
  sihua: '四化',
};

/** 分析历史列表：每次生成完一节解读都会存一条 */
export default function AnalysisHistory({ items, onOpen, onDelete, onClear, onBack }: AnalysisHistoryProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-none items-center gap-2 px-1 pb-2">
        <button type="button" onClick={onBack} className="btn-glass !px-2.5 !py-1 !text-[10px]">
          ← 返回解读
        </button>
        <span className="text-[10px]" style={{ color: 'var(--tx-3)' }}>
          共 {items.length} 条 · 仅存本机
        </span>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => { if (window.confirm('确定清空全部分析记录吗？此操作不可撤销。')) onClear(); }}
            className="btn-glass ml-auto !px-2.5 !py-1 !text-[10px]"
            style={{ color: 'var(--ji)' }}
          >
            清空全部
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <span className="text-2xl" style={{ color: 'var(--ac)', opacity: 0.2 }}>✦</span>
          <span className="text-[11px]" style={{ color: 'var(--tx-3)' }}>
            还没有记录，生成过的解读会自动存在这里
          </span>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {items.map(item => (
            <li
              key={item.id}
              className="flex items-center gap-2 px-2 py-2"
              style={{ borderBottom: '1px solid var(--bdr)' }}
            >
              <button type="button" onClick={() => onOpen(item)} className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium" style={{ color: 'var(--tx-1)' }}>{item.label}</span>
                  {KIND_LABEL[item.kind] && (
                    <span className="chip !px-1.5 !py-0 !text-[9px]">{KIND_LABEL[item.kind]}</span>
                  )}
                </div>
                <div className="truncate text-[9px]" style={{ color: 'var(--tx-3)' }}>
                  {item.chartLabel} · {new Date(item.savedAt).toLocaleString('zh-CN', { hour12: false })}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="btn-glass flex-none !px-2 !py-1 !text-[10px]"
                style={{ color: 'var(--ji)' }}
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 单条历史记录的回看视图 */
export function AnalysisRecordView({ item, onBack }: { item: AnalysisRecord; onBack: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-none items-center gap-2 px-1 pb-2">
        <button type="button" onClick={onBack} className="btn-glass !px-2.5 !py-1 !text-[10px]">
          ← 返回列表
        </button>
        <span className="text-[11px] font-medium" style={{ color: 'var(--tx-1)' }}>{item.label}</span>
        <span className="ml-auto text-[9px]" style={{ color: 'var(--tx-3)' }}>
          {item.chartLabel} · {new Date(item.savedAt).toLocaleString('zh-CN', { hour12: false })}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-1">
        <AiContent text={item.content} />
      </div>
    </div>
  );
}
