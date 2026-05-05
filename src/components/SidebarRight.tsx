import { useEffect, useState } from 'react';
import { useStore, type FillStyle, type FontSize, type FontWeight, type IconName, type TextAlign, type WireframeElement } from '@/store/useStore';

const typographyTypes = new Set<WireframeElement['type']>(['heading', 'text', 'button']);
const shapeTypes = new Set<WireframeElement['type']>(['box', 'container', 'button', 'input', 'dropdown']);
const layoutTypes = new Set<WireframeElement['type']>(['container', 'box', 'artboard']);

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
  const [layoutMode, setLayoutMode] = useState<'absolute' | 'vertical' | 'horizontal'>('absolute');
  const [gap, setGap] = useState('0');
  const [padding, setPadding] = useState('0');
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('start');
  const [fontSize, setFontSize] = useState<FontSize>(16);
  const [fontWeight, setFontWeight] = useState<FontWeight>('normal');
  const [textAlign, setTextAlign] = useState<TextAlign>('left');
  const [borderRadius, setBorderRadius] = useState('0');
  const [strokeWidth, setStrokeWidth] = useState('1');
  const [fill, setFill] = useState<FillStyle>('transparent');
  const [iconName, setIconName] = useState<IconName>('search');
  const [rows, setRows] = useState('3');
  const [cols, setCols] = useState('3');

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
    setLayoutMode(selectedElement.layoutMode ?? 'absolute');
    setGap(String(selectedElement.gap ?? 0));
    setPadding(String(selectedElement.padding ?? 0));
    setAlign(selectedElement.align ?? 'start');
    setFontSize((selectedElement.fontSize ?? 16) as FontSize);
    setFontWeight(selectedElement.fontWeight ?? 'normal');
    setTextAlign(selectedElement.textAlign ?? 'left');
    setBorderRadius(String(selectedElement.borderRadius ?? 0));
    setStrokeWidth(String(selectedElement.strokeWidth ?? 1));
    setFill(selectedElement.fill ?? 'transparent');
    setIconName(selectedElement.iconName ?? 'search');
    setRows(String(selectedElement.rows ?? 3));
    setCols(String(selectedElement.cols ?? 3));
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

  const supportsTypography = typographyTypes.has(selectedElement.type);
  const supportsShapeProps = shapeTypes.has(selectedElement.type);
  const supportsLayout = layoutTypes.has(selectedElement.type);
  const isArtboard = selectedElement.type === 'artboard';
  const isTable = selectedElement.type === 'table';
  const isIcon = selectedElement.type === 'icon';

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

  const commitElement = (nextProps: Partial<WireframeElement>) => {
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
              onBlur={() => commitElement({ name })}
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
            <div className="text-sm text-zinc-700">{selectedElement.parentId ?? 'None'}</div>
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

          {supportsTypography ? (
            <section className="space-y-3 border-t border-zinc-200 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Typography
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Font Size
                  </label>
                  <select
                    value={fontSize}
                    onChange={(event) => {
                      const nextSize = Number(event.target.value) as FontSize;
                      setFontSize(nextSize);
                      commitElement({ fontSize: nextSize });
                    }}
                    className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                  >
                    {[12, 16, 24, 36, 48].map((size) => (
                      <option key={size} value={size}>
                        {size}px
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Weight
                  </label>
                  <select
                    value={fontWeight}
                    onChange={(event) => {
                      const nextWeight = event.target.value as FontWeight;
                      setFontWeight(nextWeight);
                      commitElement({ fontWeight: nextWeight });
                    }}
                    className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Alignment
                </label>
                <select
                  value={textAlign}
                  onChange={(event) => {
                    const nextAlign = event.target.value as TextAlign;
                    setTextAlign(nextAlign);
                    commitElement({ textAlign: nextAlign });
                  }}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </section>
          ) : null}

          {supportsShapeProps ? (
            <section className="space-y-3 border-t border-zinc-200 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Shape
              </h3>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Border Radius
                </label>
                <input
                  type="number"
                  min={0}
                  max={64}
                  value={borderRadius}
                  onChange={(event) => {
                    const nextRadius = String(Math.max(0, Math.min(64, Number(event.target.value) || 0)));
                    setBorderRadius(nextRadius);
                    commitElement({ borderRadius: Number(nextRadius) });
                  }}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Stroke Width
                </label>
                <select
                  value={strokeWidth}
                  onChange={(event) => {
                    const nextStroke = event.target.value;
                    setStrokeWidth(nextStroke);
                    commitElement({ strokeWidth: Number(nextStroke) });
                  }}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="1">1px</option>
                  <option value="2">2px</option>
                  <option value="4">4px</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Fill Style
                </label>
                <select
                  value={fill}
                  onChange={(event) => {
                    const nextFill = event.target.value as FillStyle;
                    setFill(nextFill);
                    commitElement({ fill: nextFill });
                  }}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="solid">Solid</option>
                  <option value="light">Light</option>
                  <option value="transparent">Transparent</option>
                </select>
              </div>
            </section>
          ) : null}

          {supportsLayout ? (
            <section className="space-y-3 border-t border-zinc-200 pt-4">
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
                    setLayoutMode(nextMode);
                    commitElement({ layoutMode: nextMode });
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
                        value={gap}
                        onChange={(event) => {
                          const nextGap = Math.max(0, Number(event.target.value) || 0);
                          setGap(String(nextGap));
                          commitElement({ gap: nextGap });
                        }}
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
                        value={padding}
                        onChange={(event) => {
                          const nextPadding = Math.max(0, Number(event.target.value) || 0);
                          setPadding(String(nextPadding));
                          commitElement({ padding: nextPadding });
                        }}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Alignment
                    </label>
                    <select
                      value={align}
                      onChange={(event) => {
                        const nextAlign = event.target.value as 'start' | 'center' | 'end';
                        setAlign(nextAlign);
                        commitElement({ align: nextAlign });
                      }}
                      className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                    >
                      <option value="start">Start</option>
                      <option value="center">Center</option>
                      <option value="end">End</option>
                    </select>
                  </div>
                </>
              ) : null}
            </section>
          ) : null}

          {selectedElement.type === 'checkbox' ? (
            <label className="flex items-center gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  const nextChecked = event.target.checked;
                  setChecked(nextChecked);
                  commitElement({ checked: nextChecked });
                }}
                className="h-4 w-4 border-zinc-300 text-zinc-900"
              />
              Checked
            </label>
          ) : null}

          {selectedElement.text != null ? (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Text
              </label>
              <input
                type="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                onBlur={() => commitElement({ text })}
                className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
              />
            </div>
          ) : null}

          {isTable ? (
            <section className="space-y-3 border-t border-zinc-200 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Table
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Rows
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={rows}
                    onChange={(event) => {
                      const nextRows = Math.max(1, Number(event.target.value) || 1);
                      setRows(String(nextRows));
                      commitElement({ rows: nextRows });
                    }}
                    className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Cols
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={cols}
                    onChange={(event) => {
                      const nextCols = Math.max(1, Number(event.target.value) || 1);
                      setCols(String(nextCols));
                      commitElement({ cols: nextCols });
                    }}
                    className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                  />
                </div>
              </div>
            </section>
          ) : null}

          {isIcon ? (
            <section className="space-y-3 border-t border-zinc-200 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Icon
              </h3>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Icon Name
                </label>
                <select
                  value={iconName}
                  onChange={(event) => {
                    const nextIcon = event.target.value as IconName;
                    setIconName(nextIcon);
                    commitElement({ iconName: nextIcon });
                  }}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="menu">Menu</option>
                  <option value="search">Search</option>
                  <option value="user">User</option>
                  <option value="home">Home</option>
                  <option value="settings">Settings</option>
                </select>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
