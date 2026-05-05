import type {
  AlignContent,
  AlignItems,
  GridAlign,
  GridAutoFlow,
  JustifyContent,
  WireframeElement,
} from '@/store/useStore';

export interface LayoutPosition {
  x: number;
  y: number;
}

type LayoutKind = 'absolute' | 'flex' | 'grid';

function resolveLayoutKind(container: WireframeElement): LayoutKind {
  return container.layoutMode ?? 'absolute';
}

function resolveFlexDirection(container: WireframeElement): 'row' | 'column' {
  return container.flexDirection ?? 'row';
}

function resolveFlexWrap(container: WireframeElement): 'nowrap' | 'wrap' | 'wrap-reverse' {
  return container.flexWrap ?? 'nowrap';
}

function resolveJustifyContent(container: WireframeElement): JustifyContent {
  return container.justifyContent ?? 'start';
}

function resolveAlignItems(container: WireframeElement): AlignItems {
  return container.alignItems ?? 'start';
}

function resolveAlignContent(container: WireframeElement): AlignContent {
  return container.alignContent ?? 'start';
}

function resolveGridAutoFlow(container: WireframeElement): GridAutoFlow {
  return container.gridAutoFlow ?? 'row';
}

function resolveGridAlignItems(container: WireframeElement): GridAlign {
  return container.gridAlignItems ?? 'start';
}

function resolveGridJustifyItems(container: WireframeElement): GridAlign {
  return container.gridJustifyItems ?? 'start';
}

function getMainGap(container: WireframeElement) {
  return container.gapX ?? 0;
}

function getCrossGap(container: WireframeElement) {
  return container.gapY ?? 0;
}

function getMainSize(element: WireframeElement, direction: 'row' | 'column') {
  return direction === 'row' ? element.width : element.height;
}

function getCrossSize(element: WireframeElement, direction: 'row' | 'column') {
  return direction === 'row' ? element.height : element.width;
}

function computeFlexLayout(container: WireframeElement, children: WireframeElement[]) {
  const positions = new Map<string, LayoutPosition>();
  const direction = resolveFlexDirection(container);
  const wrap = resolveFlexWrap(container);
  const justifyContent = resolveJustifyContent(container);
  const alignItems = resolveAlignItems(container);
  const alignContent = resolveAlignContent(container);
  const padding = container.padding ?? 0;
  const mainGap = getMainGap(container);
  const crossGap = getCrossGap(container);
  const availableMain = Math.max(
    0,
    (direction === 'row' ? container.width : container.height) - padding * 2
  );
  const availableCross = Math.max(
    0,
    (direction === 'row' ? container.height : container.width) - padding * 2
  );

  const lines: Array<{
    items: WireframeElement[];
    mainSize: number;
    crossSize: number;
  }> = [];

  let currentLine: WireframeElement[] = [];
  let currentMainSize = 0;
  let currentCrossSize = 0;

  const flushLine = () => {
    if (!currentLine.length) {
      return;
    }

    lines.push({
      items: currentLine,
      mainSize: currentMainSize,
      crossSize: currentCrossSize,
    });
    currentLine = [];
    currentMainSize = 0;
    currentCrossSize = 0;
  };

  for (const child of children) {
    const mainSize = getMainSize(child, direction);
    const crossSize = getCrossSize(child, direction);
    const nextMainSize = currentLine.length > 0 ? currentMainSize + mainGap + mainSize : mainSize;

    if (wrap !== 'nowrap' && currentLine.length > 0 && nextMainSize > availableMain) {
      flushLine();
    }

    if (currentLine.length > 0) {
      currentMainSize += mainGap;
    }

    currentLine.push(child);
    currentMainSize += mainSize;
    currentCrossSize = Math.max(currentCrossSize, crossSize);
  }

  flushLine();

  const totalCrossSize =
    lines.reduce((sum, line) => sum + line.crossSize, 0) + crossGap * Math.max(0, lines.length - 1);
  const extraCrossSpace = Math.max(0, availableCross - totalCrossSize);
  const orderedLines = wrap === 'wrap-reverse' ? [...lines].reverse() : lines;

  let lineCrossCursor = padding;
  let lineCrossSpacing = crossGap;
  let lineCrossOffset = 0;

  if (alignContent === 'center') {
    lineCrossOffset = extraCrossSpace / 2;
  } else if (alignContent === 'end') {
    lineCrossOffset = extraCrossSpace;
  } else if (alignContent === 'space-between' && lines.length > 1) {
    lineCrossSpacing = crossGap + extraCrossSpace / (lines.length - 1);
  } else if (alignContent === 'space-around' && lines.length > 0) {
    lineCrossSpacing = crossGap + extraCrossSpace / lines.length;
    lineCrossOffset = lineCrossSpacing / 2;
  }

  lineCrossCursor += lineCrossOffset;

  if (wrap === 'wrap-reverse') {
    lineCrossCursor = padding + availableCross;
  }

  for (const line of orderedLines) {
    const itemCount = line.items.length;
    const lineMainSpan = line.mainSize + mainGap * Math.max(0, itemCount - 1);
    const extraMainSpace = Math.max(0, availableMain - lineMainSpan);

    let startOffset = 0;
    let betweenSpace = mainGap;

    if (justifyContent === 'center') {
      startOffset = extraMainSpace / 2;
    } else if (justifyContent === 'end') {
      startOffset = extraMainSpace;
    } else if (justifyContent === 'space-between' && itemCount > 1) {
      betweenSpace = mainGap + extraMainSpace / (itemCount - 1);
    } else if (justifyContent === 'space-around' && itemCount > 0) {
      betweenSpace = mainGap + extraMainSpace / itemCount;
      startOffset = betweenSpace / 2;
    } else if (justifyContent === 'space-evenly' && itemCount > 0) {
      betweenSpace = mainGap + extraMainSpace / (itemCount + 1);
      startOffset = betweenSpace;
    }

    let mainCursor = padding + startOffset;
    for (const child of line.items) {
      const mainSize = getMainSize(child, direction);
      const crossSize = getCrossSize(child, direction);
      const crossOffset =
        alignItems === 'center'
          ? Math.max(0, (line.crossSize - crossSize) / 2)
          : alignItems === 'end'
            ? Math.max(0, line.crossSize - crossSize)
            : 0;

      if (direction === 'row') {
        positions.set(child.id, {
          x: mainCursor,
          y: lineCrossCursor + crossOffset,
        });
      } else {
        positions.set(child.id, {
          x: lineCrossCursor + crossOffset,
          y: mainCursor,
        });
      }

      mainCursor += mainSize + betweenSpace;
    }

    if (wrap === 'wrap-reverse') {
      lineCrossCursor -= line.crossSize + lineCrossSpacing;
    } else {
      lineCrossCursor += line.crossSize + lineCrossSpacing;
    }
  }

  return positions;
}

function computeGridLayout(container: WireframeElement, children: WireframeElement[]) {
  const positions = new Map<string, LayoutPosition>();
  const padding = container.padding ?? 0;
  const columnGap = container.gapX ?? 0;
  const rowGap = container.gapY ?? 0;
  const autoFlow = resolveGridAutoFlow(container);
  const justifyItems = resolveGridJustifyItems(container);
  const alignItems = resolveGridAlignItems(container);

  const columns = Math.max(
    1,
    container.gridColumns ??
      (container.gridRows ? Math.ceil(children.length / container.gridRows) : Math.ceil(Math.sqrt(Math.max(1, children.length))))
  );
  const rows = Math.max(1, container.gridRows ?? Math.ceil(Math.max(1, children.length) / columns));

  const availableWidth = Math.max(0, container.width - padding * 2 - columnGap * Math.max(0, columns - 1));
  const availableHeight = Math.max(0, container.height - padding * 2 - rowGap * Math.max(0, rows - 1));
  const cellWidth = availableWidth / columns;
  const cellHeight = availableHeight / rows;

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    const row = autoFlow === 'column' ? index % rows : Math.floor(index / columns);
    const col = autoFlow === 'column' ? Math.floor(index / rows) : index % columns;
    const cellX = padding + col * (cellWidth + columnGap);
    const cellY = padding + row * (cellHeight + rowGap);

    positions.set(child.id, {
      x:
        cellX +
        (justifyItems === 'center'
          ? Math.max(0, (cellWidth - child.width) / 2)
          : justifyItems === 'end'
            ? Math.max(0, cellWidth - child.width)
            : 0),
      y:
        cellY +
        (alignItems === 'center'
          ? Math.max(0, (cellHeight - child.height) / 2)
          : alignItems === 'end'
            ? Math.max(0, cellHeight - child.height)
            : 0),
    });
  }

  return positions;
}

export function isAutoLayoutContainer(element: WireframeElement | null | undefined) {
  if (!element) {
    return false;
  }

  return (
    resolveLayoutKind(element) !== 'absolute' &&
    (element.type === 'artboard' || element.type === 'container' || element.type === 'box')
  );
}

export function calculateAutoLayout(
  container: WireframeElement,
  children: WireframeElement[]
): Map<string, LayoutPosition> {
  const layoutKind = resolveLayoutKind(container);

  if (layoutKind === 'grid') {
    return computeGridLayout(container, children);
  }

  if (layoutKind === 'flex') {
    return computeFlexLayout(container, children);
  }

  const positions = new Map<string, LayoutPosition>();
  for (const child of children) {
    positions.set(child.id, { x: child.x, y: child.y });
  }

  return positions;
}

export function getDirectLayoutChildren(
  container: WireframeElement,
  elements: WireframeElement[]
): WireframeElement[] {
  return elements.filter((element) => element.parentId === container.id);
}

export function getRenderedChildPosition(
  parent: WireframeElement,
  child: WireframeElement,
  siblings: WireframeElement[]
): LayoutPosition {
  const layoutKind = resolveLayoutKind(parent);
  if (layoutKind === 'absolute') {
    return { x: child.x, y: child.y };
  }

  const directChildren = siblings.filter((item) => item.parentId === parent.id);
  const positions = calculateAutoLayout(parent, directChildren);
  return positions.get(child.id) ?? { x: child.x, y: child.y };
}
