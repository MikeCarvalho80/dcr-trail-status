import { useState, useEffect, useRef } from 'react';

/**
 * Progressively renders a large list by starting with `initialCount` items
 * and adding `batchSize` more as the user scrolls near the bottom.
 * Returns the number of items to render.
 */
export function useProgressiveRender(
  totalCount: number,
  initialCount = 20,
  batchSize = 20,
): number {
  const [renderCount, setRenderCount] = useState(Math.min(initialCount, totalCount));
  const sentinelRef = useRef<IntersectionObserver | null>(null);

  // Reset when the list changes (e.g., filters applied)
  useEffect(() => {
    setRenderCount(Math.min(initialCount, totalCount));
  }, [totalCount, initialCount]);

  // Set up IntersectionObserver on a sentinel element
  useEffect(() => {
    if (renderCount >= totalCount) return;

    const sentinel = document.getElementById('progressive-render-sentinel');
    if (!sentinel) return;

    sentinelRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRenderCount((prev) => Math.min(prev + batchSize, totalCount));
        }
      },
      { rootMargin: '400px' }, // trigger 400px before sentinel is visible
    );

    sentinelRef.current.observe(sentinel);

    return () => {
      sentinelRef.current?.disconnect();
    };
  }, [renderCount, totalCount, batchSize]);

  return renderCount;
}
