import { useEffect, useState } from 'react';
import {
  useStore,
  type AlignContent,
  type AlignItems,
  type FlexDirection,
  type FlexWrap,
  type GridAlign,
  type GridAutoFlow,
  type JustifyContent,
  type HeadingVariant,
  type LayoutMode,
  type InputVariant,
  type ButtonSize,
  type ButtonVariant,
  type FillStyle,
  type FontSize,
  type FontWeight,
  type IconName,
  type SizeUnit,
  type TextAlign,
  type WireframeElement,
} from '@/store/useStore';
import { getElementChildren } from '@/utils/geometry';

const typographyTypes = new Set<WireframeElement['type']>([
  'heading',
  'text',
  'button',
  'input',
  'textarea',
  'label',
]);
const shapeTypes = new Set<WireframeElement['type']>([
  'box',
  'container',
  'button',
  'input',
  'textarea',
  'dropdown',
]);
const layoutTypes = new Set<WireframeElement['type']>(['container', 'box', 'artboard']);

const headingSizes: Record<HeadingVariant, FontSize> = {
  h1: 48,
  h2: 36,
  h3: 30,
  h4: 24,
  h5: 20,
  h6: 16,
};

function getViewportBasis(unit: SizeUnit) {
  if (typeof window === 'undefined') {
    return 1;
  }

  return unit === 'vw' ? window.innerWidth : window.innerHeight;
}

function toDisplayDimension(px: number, unit: SizeUnit) {
  const basis = getViewportBasis(unit);
  if (unit !== 'px') {
    return Math.round((px / basis) * 100);
  }

  return Math.round(px);
}

function toPixelDimension(value: number, unit: SizeUnit) {
  const basis = getViewportBasis(unit);
  if (unit !== 'px') {
    return Math.max(1, Math.round((value / 100) * basis));
  }

  return Math.max(1, Math.round(value));
}

export default function SidebarRight() {
  const elements = useStore((state) => state.elements);
  const selectedIds = useStore((state) => state.selectedIds);
  const updateElement = useStore((state) => state.updateElement);
  const changeArtboardSize = useStore((state) => state.changeArtboardSize);
  const createMasterComponent = useStore((state) => state.createMasterComponent);
  const moveSelectedSibling = useStore((state) => state.moveSelectedSibling);
  const setSelection = useStore((state) => state.setSelection);

  const selectedElement = selectedIds[0]
    ? elements.find((element) => element.id === selectedIds[0]) ?? null
    : null;

  const [x, setX] = useState('0');
  const [y, setY] = useState('0');
  const [w, setW] = useState('0');
  const [h, setH] = useState('0');
  const [widthUnit, setWidthUnit] = useState<SizeUnit>('px');
  const [heightUnit, setHeightUnit] = useState<SizeUnit>('px');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('absolute');
  const [inputVariant, setInputVariant] = useState<InputVariant>('text');
  const [headingVariant, setHeadingVariant] = useState<HeadingVariant>('h2');
  const [flexDirection, setFlexDirection] = useState<FlexDirection>('row');
  const [flexWrap, setFlexWrap] = useState<FlexWrap>('nowrap');
  const [justifyContent, setJustifyContent] = useState<JustifyContent>('start');
  const [alignItems, setAlignItems] = useState<AlignItems>('start');
  const [alignContent, setAlignContent] = useState<AlignContent>('start');
  const [gapX, setGapX] = useState('0');
  const [gapY, setGapY] = useState('0');
  const [padding, setPadding] = useState('0');
  const [gridColumns, setGridColumns] = useState('2');
  const [gridRows, setGridRows] = useState('2');
  const [gridAutoFlow, setGridAutoFlow] = useState<GridAutoFlow>('row');
  const [gridJustifyItems, setGridJustifyItems] = useState<GridAlign>('start');
  const [gridAlignItems, setGridAlignItems] = useState<GridAlign>('start');
  const [fontSize, setFontSize] = useState<FontSize>(16);
  const [fontWeight, setFontWeight] = useState<FontWeight>('normal');
  const [textAlign, setTextAlign] = useState<TextAlign>('left');
  const [buttonVariant, setButtonVariant] = useState<ButtonVariant>('primary');
  const [buttonSize, setButtonSize] = useState<ButtonSize>('normal');
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
    const nextWidthUnit = selectedElement.widthUnit ?? 'px';
    const nextHeightUnit = selectedElement.heightUnit ?? 'px';
    setWidthUnit(nextWidthUnit);
    setHeightUnit(nextHeightUnit);
    setW(String(toDisplayDimension(selectedElement.width, nextWidthUnit)));
    setH(String(toDisplayDimension(selectedElement.height, nextHeightUnit)));
    setName(selectedElement.name ?? '');
    setText(selectedElement.text ?? '');
    setChecked(Boolean(selectedElement.checked));
    setLayoutMode(selectedElement.layoutMode ?? 'flex');
    setInputVariant(selectedElement.inputVariant ?? 'text');
    setHeadingVariant(selectedElement.headingVariant ?? 'h2');
    setFlexDirection(selectedElement.flexDirection ?? 'column');
    setFlexWrap(selectedElement.flexWrap ?? 'nowrap');
    setJustifyContent(selectedElement.justifyContent ?? 'start');
    setAlignItems(selectedElement.alignItems ?? 'start');
    setAlignContent(selectedElement.alignContent ?? 'start');
    setGapX(String(selectedElement.gapX ?? 0));
    setGapY(String(selectedElement.gapY ?? 0));
    setPadding(String(selectedElement.padding ?? 0));
    setGridColumns(String(selectedElement.gridColumns ?? 2));
    setGridRows(String(selectedElement.gridRows ?? 2));
    setGridAutoFlow(selectedElement.gridAutoFlow ?? 'row');
    setGridJustifyItems(selectedElement.gridJustifyItems ?? 'start');
    setGridAlignItems(selectedElement.gridAlignItems ?? 'start');
    setFontSize((selectedElement.fontSize ?? 16) as FontSize);
    setFontWeight(selectedElement.fontWeight ?? 'normal');
    setTextAlign(selectedElement.textAlign ?? 'left');
    setButtonVariant(selectedElement.buttonVariant ?? 'primary');
    setButtonSize(selectedElement.buttonSize ?? 'normal');
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
  const supportsBackground = selectedElement.type === 'container' || selectedElement.type === 'artboard';
  const supportsSurfacePadding = selectedElement.type === 'container' || selectedElement.type === 'artboard';
  const isArtboard = selectedElement.type === 'artboard';
  const isTable = selectedElement.type === 'table';
  const isIcon = selectedElement.type === 'icon';
  const isMaster = Boolean(selectedElement.isMasterComponent);
  const parentElement = selectedElement.parentId
    ? elements.find((element) => element.id === selectedElement.parentId) ?? null
    : null;
  const siblingElements = parentElement ? getElementChildren(elements, parentElement.id) : [];
  const siblingIndex = siblingElements.findIndex((element) => element.id === selectedElement.id);
  const canMoveUp = siblingIndex > 0;
  const canMoveDown = siblingIndex >= 0 && siblingIndex < siblingElements.length - 1;
  const masterElement =
    selectedElement.type === 'instance' && selectedElement.masterComponentId
      ? elements.find((element) => element.id === selectedElement.masterComponentId) ?? null
      : null;

  const commitPosition = () => {
    updateElement(selectedElement.id, {
      x: Number(x) || 0,
      y: Number(y) || 0,
    });
  };

  const commitSize = () => {
    const widthValue = Number(w) || toDisplayDimension(selectedElement.width, widthUnit);
    const heightValue = Number(h) || toDisplayDimension(selectedElement.height, heightUnit);
    const nextWidth = toPixelDimension(widthValue, widthUnit);
    const nextHeight = toPixelDimension(heightValue, heightUnit);

    if (isArtboard) {
      changeArtboardSize(nextWidth, nextHeight);
      updateElement(selectedElement.id, {
        widthUnit,
        heightUnit,
      });
      return;
    }

    updateElement(selectedElement.id, {
      width: nextWidth,
      height: nextHeight,
      widthUnit,
      heightUnit,
    });
  };

  const commitElement = (nextProps: Partial<WireframeElement>) => {
    updateElement(selectedElement.id, nextProps);
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

          {parentElement ? (
            <section className="space-y-3 border-t border-zinc-200 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Order
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => moveSelectedSibling('up')}
                  disabled={!canMoveUp}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Move Up
                </button>
                <button
                  type="button"
                  onClick={() => moveSelectedSibling('down')}
                  disabled={!canMoveDown}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Move Down
                </button>
              </div>
            </section>
          ) : null}

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
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="number"
                  value={w}
                  onChange={(event) => setW(event.target.value)}
                  onBlur={commitSize}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                />
                <select
                  value={widthUnit}
                  onChange={(event) => {
                    const nextUnit = event.target.value as SizeUnit;
                    const currentValue =
                      Number(w) || toDisplayDimension(selectedElement.width, widthUnit);
                    const currentPx = toPixelDimension(currentValue, widthUnit);
                    setWidthUnit(nextUnit);
                    setW(String(toDisplayDimension(currentPx, nextUnit)));
                    commitElement({ widthUnit: nextUnit });
                  }}
                  className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="px">px</option>
                  <option value="vw">vw</option>
                  <option value="vh">vh</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Height
              </label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="number"
                  value={h}
                  onChange={(event) => setH(event.target.value)}
                  onBlur={commitSize}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                />
                <select
                  value={heightUnit}
                  onChange={(event) => {
                    const nextUnit = event.target.value as SizeUnit;
                    const currentValue =
                      Number(h) || toDisplayDimension(selectedElement.height, heightUnit);
                    const currentPx = toPixelDimension(currentValue, heightUnit);
                    setHeightUnit(nextUnit);
                    setH(String(toDisplayDimension(currentPx, nextUnit)));
                    commitElement({ heightUnit: nextUnit });
                  }}
                  className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="px">px</option>
                  <option value="vw">vw</option>
                  <option value="vh">vh</option>
                </select>
              </div>
            </div>
          </div>

          {selectedElement.type === 'input' ? (
            <section className="space-y-3 border-t border-zinc-200 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Input
              </h3>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Variant
                </label>
                <select
                  value={inputVariant}
                  onChange={(event) => {
                    const nextVariant = event.target.value as InputVariant;
                    setInputVariant(nextVariant);
                    commitElement({ inputVariant: nextVariant });
                  }}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="password">Password</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
              </div>
            </section>
          ) : null}

          {supportsTypography ? (
            <section className="space-y-3 border-t border-zinc-200 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Typography
              </h3>
              {selectedElement.type === 'heading' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Heading Variant
                  </label>
                  <select
                    value={headingVariant}
                    onChange={(event) => {
                      const nextVariant = event.target.value as HeadingVariant;
                      const nextFontSize = headingSizes[nextVariant];
                      setHeadingVariant(nextVariant);
                      setFontSize(nextFontSize);
                      commitElement({
                        headingVariant: nextVariant,
                        fontSize: nextFontSize,
                      });
                    }}
                    className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                  >
                    <option value="h1">H1</option>
                    <option value="h2">H2</option>
                    <option value="h3">H3</option>
                    <option value="h4">H4</option>
                    <option value="h5">H5</option>
                    <option value="h6">H6</option>
                  </select>
                </div>
              ) : null}
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
                    {[12, 16, 20, 24, 30, 36, 48].map((size) => (
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

          {selectedElement.type === 'button' ? (
            <section className="space-y-3 border-t border-zinc-200 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Button
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Variant
                  </label>
                  <select
                    value={buttonVariant}
                    onChange={(event) => {
                      const nextVariant = event.target.value as ButtonVariant;
                      setButtonVariant(nextVariant);
                      commitElement({ buttonVariant: nextVariant });
                    }}
                    className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="danger">Danger</option>
                    <option value="warning">Warning</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Size
                  </label>
                  <select
                    value={buttonSize}
                    onChange={(event) => {
                      const nextSize = event.target.value as ButtonSize;
                      setButtonSize(nextSize);
                      commitElement({ buttonSize: nextSize });
                    }}
                    className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                  >
                    <option value="small">Small</option>
                    <option value="normal">Normal</option>
                    <option value="large">Large</option>
                  </select>
                </div>
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
                  {supportsBackground ? 'Background' : 'Fill Style'}
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
                {supportsBackground ? (
                  <p className="text-[11px] leading-4 text-zinc-400">
                    Acts like a div background for visual grouping.
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {supportsLayout ? (
            <section className="space-y-3 border-t border-zinc-200 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Layout Settings
              </h3>
              {supportsSurfacePadding ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Page / Container Padding
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={padding}
                    onChange={(event) => {
                      const nextPadding = Math.max(0, Number(event.target.value) || 0);
                      setPadding(String(nextPadding));
                      commitLayout({
                        padding: nextPadding,
                      });
                    }}
                    className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                  />
                  <p className="text-[11px] leading-4 text-zinc-400">
                    Inner space between the page/container edge and its direct children.
                  </p>
                </div>
              ) : null}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Layout Mode
                </label>
                <select
                  value={layoutMode}
                  onChange={(event) => {
                    const nextMode = event.target.value as LayoutMode;
                    setLayoutMode(nextMode);
                    if (nextMode === 'absolute') {
                      commitLayout({ layoutMode: 'absolute' });
                      return;
                    }

                    if (nextMode === 'grid') {
                      commitLayout({
                        layoutMode: 'grid',
                        gridColumns: Number(gridColumns) || 2,
                        gridRows: Number(gridRows) || 2,
                        gridAutoFlow,
                        gridJustifyItems,
                        gridAlignItems,
                        gapX: Number(gapX) || 0,
                        gapY: Number(gapY) || 0,
                        padding: Number(padding) || 0,
                      });
                      return;
                    }

                    commitLayout({
                      layoutMode: 'flex',
                      flexDirection,
                      flexWrap,
                      justifyContent,
                      alignItems,
                      alignContent,
                      gapX: Number(gapX) || 0,
                      gapY: Number(gapY) || 0,
                      padding: Number(padding) || 0,
                    });
                  }}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="absolute">Absolute</option>
                  <option value="flex">Flex</option>
                  <option value="grid">Grid</option>
                </select>
              </div>
              {layoutMode === 'flex' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Gap X
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={gapX}
                        onChange={(event) => {
                          const nextGap = Math.max(0, Number(event.target.value) || 0);
                          setGapX(String(nextGap));
                          commitLayout({
                            layoutMode: 'flex',
                            flexDirection,
                            flexWrap,
                            justifyContent,
                            alignItems,
                            alignContent,
                            gapX: nextGap,
                            gapY: Number(gapY) || 0,
                            padding: Number(padding) || 0,
                          });
                        }}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Gap Y
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={gapY}
                        onChange={(event) => {
                          const nextGap = Math.max(0, Number(event.target.value) || 0);
                          setGapY(String(nextGap));
                          commitLayout({
                            layoutMode: 'flex',
                            flexDirection,
                            flexWrap,
                            justifyContent,
                            alignItems,
                            alignContent,
                            gapX: Number(gapX) || 0,
                            gapY: nextGap,
                            padding: Number(padding) || 0,
                          });
                        }}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Direction
                      </label>
                      <select
                        value={flexDirection}
                        onChange={(event) => {
                          const nextDirection = event.target.value as FlexDirection;
                          setFlexDirection(nextDirection);
                          commitLayout({
                            layoutMode: 'flex',
                            flexDirection: nextDirection,
                            flexWrap,
                            justifyContent,
                            alignItems,
                            alignContent,
                            gapX: Number(gapX) || 0,
                            gapY: Number(gapY) || 0,
                            padding: Number(padding) || 0,
                          });
                        }}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      >
                        <option value="row">Row</option>
                        <option value="column">Column</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Wrap
                      </label>
                      <select
                        value={flexWrap}
                        onChange={(event) => {
                          const nextWrap = event.target.value as FlexWrap;
                          setFlexWrap(nextWrap);
                          commitLayout({
                            layoutMode: 'flex',
                            flexDirection,
                            flexWrap: nextWrap,
                            justifyContent,
                            alignItems,
                            alignContent,
                            gapX: Number(gapX) || 0,
                            gapY: Number(gapY) || 0,
                            padding: Number(padding) || 0,
                          });
                        }}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      >
                        <option value="nowrap">No Wrap</option>
                        <option value="wrap">Wrap</option>
                        <option value="wrap-reverse">Wrap Reverse</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Justify Content
                      </label>
                      <select
                        value={justifyContent}
                        onChange={(event) => {
                          const nextValue = event.target.value as JustifyContent;
                          setJustifyContent(nextValue);
                          commitLayout({
                            layoutMode: 'flex',
                            flexDirection,
                            flexWrap,
                            justifyContent: nextValue,
                            alignItems,
                            alignContent,
                            gapX: Number(gapX) || 0,
                            gapY: Number(gapY) || 0,
                            padding: Number(padding) || 0,
                          });
                        }}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      >
                        <option value="start">Start</option>
                        <option value="center">Center</option>
                        <option value="end">End</option>
                        <option value="space-between">Space Between</option>
                        <option value="space-around">Space Around</option>
                        <option value="space-evenly">Space Evenly</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Align Items
                      </label>
                      <select
                        value={alignItems}
                        onChange={(event) => {
                          const nextValue = event.target.value as AlignItems;
                          setAlignItems(nextValue);
                          commitLayout({
                            layoutMode: 'flex',
                            flexDirection,
                            flexWrap,
                            justifyContent,
                            alignItems: nextValue,
                            alignContent,
                            gapX: Number(gapX) || 0,
                            gapY: Number(gapY) || 0,
                            padding: Number(padding) || 0,
                          });
                        }}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      >
                        <option value="start">Start</option>
                        <option value="center">Center</option>
                        <option value="end">End</option>
                        <option value="stretch">Stretch</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Align Content
                    </label>
                    <select
                      value={alignContent}
                      onChange={(event) => {
                        const nextValue = event.target.value as AlignContent;
                        setAlignContent(nextValue);
                        commitLayout({
                          layoutMode: 'flex',
                          flexDirection,
                          flexWrap,
                          justifyContent,
                          alignItems,
                          alignContent: nextValue,
                          gapX: Number(gapX) || 0,
                          gapY: Number(gapY) || 0,
                          padding: Number(padding) || 0,
                        });
                      }}
                      className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                    >
                      <option value="start">Start</option>
                      <option value="center">Center</option>
                      <option value="end">End</option>
                      <option value="space-between">Space Between</option>
                      <option value="space-around">Space Around</option>
                      <option value="stretch">Stretch</option>
                    </select>
                  </div>
                </>
              ) : null}
              {layoutMode === 'grid' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Columns
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={gridColumns}
                        onChange={(event) => {
                          const nextColumns = Math.max(1, Number(event.target.value) || 1);
                          setGridColumns(String(nextColumns));
                          commitLayout({
                            layoutMode: 'grid',
                            gridColumns: nextColumns,
                            gridRows: Number(gridRows) || 1,
                            gridAutoFlow,
                            gridJustifyItems,
                            gridAlignItems,
                            gapX: Number(gapX) || 0,
                            gapY: Number(gapY) || 0,
                            padding: Number(padding) || 0,
                          });
                        }}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Rows
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={gridRows}
                        onChange={(event) => {
                          const nextRows = Math.max(1, Number(event.target.value) || 1);
                          setGridRows(String(nextRows));
                          commitLayout({
                            layoutMode: 'grid',
                            gridColumns: Number(gridColumns) || 1,
                            gridRows: nextRows,
                            gridAutoFlow,
                            gridJustifyItems,
                            gridAlignItems,
                            gapX: Number(gapX) || 0,
                            gapY: Number(gapY) || 0,
                            padding: Number(padding) || 0,
                          });
                        }}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Auto Flow
                      </label>
                      <select
                        value={gridAutoFlow}
                        onChange={(event) => {
                          const nextValue = event.target.value as GridAutoFlow;
                          setGridAutoFlow(nextValue);
                          commitLayout({
                            layoutMode: 'grid',
                            gridColumns: Number(gridColumns) || 1,
                            gridRows: Number(gridRows) || 1,
                            gridAutoFlow: nextValue,
                            gridJustifyItems,
                            gridAlignItems,
                            gapX: Number(gapX) || 0,
                            gapY: Number(gapY) || 0,
                            padding: Number(padding) || 0,
                          });
                        }}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      >
                        <option value="row">Row</option>
                        <option value="column">Column</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Gap X
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={gapX}
                        onChange={(event) => {
                          const nextGap = Math.max(0, Number(event.target.value) || 0);
                          setGapX(String(nextGap));
                          commitLayout({
                            layoutMode: 'grid',
                            gridColumns: Number(gridColumns) || 1,
                            gridRows: Number(gridRows) || 1,
                            gridAutoFlow,
                            gridJustifyItems,
                            gridAlignItems,
                            gapX: nextGap,
                            gapY: Number(gapY) || 0,
                            padding: Number(padding) || 0,
                          });
                        }}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Gap Y
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={gapY}
                        onChange={(event) => {
                          const nextGap = Math.max(0, Number(event.target.value) || 0);
                          setGapY(String(nextGap));
                          commitLayout({
                            layoutMode: 'grid',
                            gridColumns: Number(gridColumns) || 1,
                            gridRows: Number(gridRows) || 1,
                            gridAutoFlow,
                            gridJustifyItems,
                            gridAlignItems,
                            gapX: Number(gapX) || 0,
                            gapY: nextGap,
                            padding: Number(padding) || 0,
                          });
                        }}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Justify Items
                      </label>
                      <select
                        value={gridJustifyItems}
                        onChange={(event) => {
                          const nextValue = event.target.value as GridAlign;
                          setGridJustifyItems(nextValue);
                          commitLayout({
                            layoutMode: 'grid',
                            gridColumns: Number(gridColumns) || 1,
                            gridRows: Number(gridRows) || 1,
                            gridAutoFlow,
                            gridJustifyItems: nextValue,
                            gridAlignItems,
                            gapX: Number(gapX) || 0,
                            gapY: Number(gapY) || 0,
                            padding: Number(padding) || 0,
                          });
                        }}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      >
                        <option value="start">Start</option>
                        <option value="center">Center</option>
                        <option value="end">End</option>
                        <option value="stretch">Stretch</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Align Items
                      </label>
                      <select
                        value={gridAlignItems}
                        onChange={(event) => {
                          const nextValue = event.target.value as GridAlign;
                          setGridAlignItems(nextValue);
                          commitLayout({
                            layoutMode: 'grid',
                            gridColumns: Number(gridColumns) || 1,
                            gridRows: Number(gridRows) || 1,
                            gridAutoFlow,
                            gridJustifyItems,
                            gridAlignItems: nextValue,
                            gapX: Number(gapX) || 0,
                            gapY: Number(gapY) || 0,
                            padding: Number(padding) || 0,
                          });
                        }}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      >
                        <option value="start">Start</option>
                        <option value="center">Center</option>
                        <option value="end">End</option>
                        <option value="stretch">Stretch</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : null}
            </section>
          ) : null}

          <section className="space-y-3 border-t border-zinc-200 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Component
            </h3>
            {isMaster ? (
              <div className="inline-flex rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                Master Component
              </div>
            ) : null}
            {selectedElement.type !== 'instance' && selectedElement.type !== 'artboard' && !isMaster ? (
              <button
                type="button"
                onClick={() => createMasterComponent(selectedElement.id)}
                className="w-full rounded-md border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
              >
                Create Master Component
              </button>
            ) : null}
            {selectedElement.type === 'instance' && masterElement ? (
              <button
                type="button"
                onClick={() => setSelection([masterElement.id])}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Go to Master
              </button>
            ) : null}
          </section>

          {selectedElement.type === 'checkbox' ||
          selectedElement.type === 'radio' ||
          selectedElement.type === 'toggle' ? (
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
                  <option value="chevron-left">Chevron Left</option>
                  <option value="chevron-right">Chevron Right</option>
                  <option value="chevron-up">Chevron Up</option>
                  <option value="chevron-down">Chevron Down</option>
                  <option value="chevrons-left">Double Left</option>
                  <option value="chevrons-right">Double Right</option>
                  <option value="sort-asc">Sort Asc</option>
                  <option value="sort-desc">Sort Desc</option>
                  <option value="ellipsis">More</option>
                  <option value="plus">Plus</option>
                  <option value="minus">Minus</option>
                  <option value="x">Close</option>
                </select>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
