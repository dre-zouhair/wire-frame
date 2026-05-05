import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type Konva from 'konva';
import SidebarLeft from '@/components/SidebarLeft';
import SidebarRight from '@/components/SidebarRight';
import TopBar from '@/components/TopBar';
import CanvasArea from '@/components/CanvasArea';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function useContainerSize(ref: RefObject<HTMLDivElement | null>) {
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
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const canvasSize = useContainerSize(canvasContainerRef);
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-100">
      <TopBar stageRef={stageRef} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SidebarLeft />
        <main ref={canvasContainerRef} className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <CanvasArea stageRef={stageRef} width={canvasSize.width} height={canvasSize.height} />
        </main>
        <SidebarRight />
      </div>
    </div>
  );
}
