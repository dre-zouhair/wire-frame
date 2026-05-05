import { useEffect, useState } from 'react';
import { useStore, type WireframeElement } from '@/store/useStore';

export default function SidebarRight() {
  const elements = useStore((state) => state.elements);
  const selectedIds = useStore((state) => state.selectedIds);
  const updateElement = useStore((state) => state.updateElement);
  const changeArtboardSize = useStore((state) => state.changeArtboardSize);

  const selectedElement = selectedIds[0]
    ? elements.find((element) => element.id === selectedIds[0]) ?? null
    : null;

  const [x, setX] = useState('0');
  const [y, setY] = useState('0');
  const [w, setW] = useState('0');
  const [h, setH] = useState('0');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!selectedElement) {
      return;
    }

    setX(String(selectedElement.x));
    setY(String(selectedElement.y));
    setW(String(selectedElement.width));
    setH(String(selectedElement.height));
    setName(selectedElement.name ?? '');
    setText(selectedElement.text ?? '');
    setChecked(Boolean(selectedElement.checked));
  }, [selectedElement]);

  if (!selectedElement) {
    return (
      <aside className="flex h-full w-64 shrink-0 flex-col border-l border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Properties
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-zinc-400">Select an element to edit its properties.</p>
        </div>
      </aside>
    );
  }

  const supportsText = ['heading', 'text', 'button', 'input', 'dropdown', 'checkbox'].includes(
    selectedElement.type
  );
  const supportsLayout = selectedElement.type === 'container' || selectedElement.type === 'artboard';
  const isArtboard = selectedElement.type === 'artboard';
  const layoutMode = selectedElement.layoutMode ?? 'absolute';
  const commitPosition = () => {
    updateElement(selectedElement.id, {
      x: Number(x) || 0,
      y: Number(y) || 0,
    });
  };

  const commitSize = () => {
    const nextWidth = Math.max(1, Number(w) || selectedElement.width);
    const nextHeight = Math.max(1, Number(h) || selectedElement.height);

    if (isArtboard) {
      changeArtboardSize(nextWidth, nextHeight);
      return;
    }

    updateElement(selectedElement.id, {
      width: nextWidth,
      height: nextHeight,
    });
  };

  const commitName = () => {
    updateElement(selectedElement.id, { name });
  };

  const commitText = () => {
    if (!supportsText) return;
    updateElement(selectedElement.id, { text });
  };

  const commitLayout = (nextProps: Partial<WireframeElement>) => {
    updateElement(selectedElement.id, nextProps);
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-l border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Properties
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={commitName}
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Type
            </label>
            <div className="text-sm font-medium capitalize text-zinc-800">
              {selectedElement.type.replace('-', ' ')}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Parent
            </label>
            <div className="text-sm text-zinc-700">
              {selectedElement.parentId ?? 'None'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                X
              </label>
              <input
                type="number"
                value={x}
                onChange={(event) => setX(event.target.value)}
                onBlur={commitPosition}
                className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400 disabled:bg-zinc-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Y
              </label>
              <input
                type="number"
                value={y}
                onChange={(event) => setY(event.target.value)}
                onBlur={commitPosition}
                className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400 disabled:bg-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Width
              </label>
              <input
                type="number"
                value={w}
                onChange={(event) => setW(event.target.value)}
                onBlur={commitSize}
                className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Height
              </label>
              <input
                type="number"
                value={h}
                onChange={(event) => setH(event.target.value)}
                onBlur={commitSize}
                className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          {supportsText ? (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Text
              </label>
              <input
                type="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                onBlur={commitText}
                className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
              />
            </div>
          ) : null}

          {selectedElement.type === 'checkbox' ? (
            <label className="flex items-center gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  const nextChecked = event.target.checked;
                  setChecked(nextChecked);
                  updateElement(selectedElement.id, { checked: nextChecked });
                }}
                className="h-4 w-4 border-zinc-300 text-zinc-900"
              />
              Checked
            </label>
          ) : null}

          {supportsLayout ? (
            <div className="space-y-3 border-t border-zinc-200 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Layout Settings
              </h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Layout Mode
                </label>
                <select
                  value={layoutMode}
                  onChange={(event) => {
                    const nextMode = event.target.value as 'absolute' | 'vertical' | 'horizontal';
                    commitLayout({ layoutMode: nextMode });
                  }}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="absolute">Absolute</option>
                  <option value="vertical">Vertical Stack</option>
                  <option value="horizontal">Horizontal Stack</option>
                </select>
              </div>

              {layoutMode !== 'absolute' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Gap
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={selectedElement.gap ?? 0}
                        onChange={(event) =>
                          commitLayout({ gap: Math.max(0, Number(event.target.value) || 0) })
                        }
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Padding
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={selectedElement.padding ?? 0}
                        onChange={(event) =>
                          commitLayout({ padding: Math.max(0, Number(event.target.value) || 0) })
                        }
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Alignment
                    </label>
                    <select
                      value={selectedElement.align ?? 'start'}
                      onChange={(event) =>
                        commitLayout({
                          align: event.target.value as 'start' | 'center' | 'end',
                        })
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                    >
                      <option value="start">Start</option>
                      <option value="center">Center</option>
                      <option value="end">End</option>
                    </select>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
