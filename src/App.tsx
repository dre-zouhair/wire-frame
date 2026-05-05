import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import SidebarLeft from '@/components/SidebarLeft';
import SidebarRight from '@/components/SidebarRight';
import CanvasArea from '@/components/CanvasArea';

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setSize({ width: cr.width, height: cr.height });
      }
    });

    observer.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });

    return () => observer.disconnect();
  }, [ref]);

  return size;
}

export default function App() {
  const deleteSelected = useStore((state) => state.deleteSelected);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasSize = useContainerSize(canvasContainerRef);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();
        const isInput = tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          deleteSelected();
        }
      }
    },
    [deleteSelected]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-gray-50">
      <SidebarLeft />
      <div ref={canvasContainerRef} className="flex-1 relative">
        <CanvasArea width={canvasSize.width} height={canvasSize.height} />
      </div>
      <SidebarRight />
    </div>
  );
}
