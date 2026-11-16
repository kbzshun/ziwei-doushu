'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** 不上报的路径前缀（后台/内部页） */
const SKIP = ['/admin'];

/**
 * 访问上报：路由变化时用 sendBeacon 异步上报一次。
 * 失败静默，不影响任何页面功能。
 */
export function TrackBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || SKIP.some((p) => pathname.startsWith(p))) return;
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
    // 尊重浏览器的 Do Not Track
    if (navigator.doNotTrack === '1') return;

    const payload = JSON.stringify({ path: pathname, referrer: document.referrer || '' });
    try {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    } catch {
      /* 统计失败不影响页面 */
    }
  }, [pathname]);

  return null;
}
