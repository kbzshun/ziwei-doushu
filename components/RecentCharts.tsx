'use client';
import { useState } from 'react';
import type { SavedChart } from '@/lib/history';
import { BRANCHES } from '@/lib/ziwei/constants';

interface RecentChartsProps {
  items: SavedChart[];
  onLoad: (item: SavedChart) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

/**
 * 最近命盘。
 * 注意：开源版没有账号体系，记录只存在本机浏览器，换设备不同步。
 */
export default function RecentCharts({ items, onLoad, onRename, onDelete, onClear }: RecentChartsProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  if (items.length === 0) return null;

  const submitRename = (id: string) => {
    onRename(id, draft);
    setEditingId(null);
  };

  return (
    <div className="card-glass mt-4 overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <span className="eyebrow">最近命盘</span>
        <span className="chip">{items.length}</span>
        <span className="ml-auto text-[10px]" style={{ color: 'var(--tx-3)' }}>
          {open ? '收起' : '展开'}
        </span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--bdr)' }}>
          <ul>
            {items.map(item => {
              const b = item.birth;
              const isEditing = editingId === item.id;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2 px-4 py-2.5"
                  style={{ borderBottom: '1px solid var(--bdr)' }}
                >
                  {isEditing ? (
                    <input
                      autoFocus
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitRename(item.id)}
                      className="input-base !py-1.5 !text-[11px]"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onLoad(item)}
                      className="min-w-0 flex-1 text-left"
                      title="载入这张命盘"
                    >
                      <div className="truncate text-[12px] font-medium" style={{ color: 'var(--tx-1)' }}>
                        {item.name}
                      </div>
                      <div className="truncate text-[9px]" style={{ color: 'var(--tx-3)' }}>
                        {b.year}-{b.month}-{b.day} {BRANCHES[b.hour]}时 · {b.gender === 'male' ? '男' : '女'}
                      </div>
                    </button>
                  )}

                  <div className="flex flex-none items-center gap-1">
                    {isEditing ? (
                      <>
                        <button type="button" onClick={() => submitRename(item.id)} className="btn-glass !px-2 !py-1 !text-[10px]">保存</button>
                        <button type="button" onClick={() => setEditingId(null)} className="btn-glass !px-2 !py-1 !text-[10px]">取消</button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => { setEditingId(item.id); setDraft(item.name); }}
                          className="btn-glass !px-2 !py-1 !text-[10px]"
                        >
                          改名
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
                          className="btn-glass !px-2 !py-1 !text-[10px]"
                          style={{ color: 'var(--ji)' }}
                        >
                          删除
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-[9px]" style={{ color: 'var(--tx-3)' }}>
              仅保存在本机浏览器，换设备不同步
            </span>
            <button
              type="button"
              onClick={() => { if (window.confirm('确定要清空全部命盘记录吗？此操作不可撤销。')) onClear(); }}
              className="btn-glass !px-2 !py-1 !text-[10px]"
              style={{ color: 'var(--ji)' }}
            >
              清空全部
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
