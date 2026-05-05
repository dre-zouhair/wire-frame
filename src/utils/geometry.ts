import type { WireframeElement } from '@/store/useStore';

export interface Point {
  x: number;
  y: number;
}

export interface RectBounds extends Point {
  width: number;
  height: number;
}

export function buildElementLookup(elements: WireframeElement[]) {
  return new Map(elements.map((element) => [element.id, element] as const));
}

export function getElementChildren(elements: WireframeElement[], parentId: string) {
  return elements.filter((element) => element.parentId === parentId);
}

export function getDescendants(elements: WireframeElement[], parentId: string) {
  const lookup = buildElementLookup(elements);
  const descendants: WireframeElement[] = [];
  const queue = getElementChildren(elements, parentId).map((element) => element.id);

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) continue;

    const current = lookup.get(currentId);
    if (!current) continue;

    descendants.push(current);
    for (const child of getElementChildren(elements, currentId)) {
      queue.push(child.id);
    }
  }

  return descendants;
}

export function isDescendantOf(
  nodeId: string,
  ancestorId: string,
  lookup: Map<string, WireframeElement>
) {
  let current = lookup.get(nodeId);

  while (current?.parentId) {
    if (current.parentId === ancestorId) {
      return true;
    }

    current = lookup.get(current.parentId);
  }

  return false;
}

export function getAbsolutePosition(
  element: WireframeElement,
  lookup: Map<string, WireframeElement>
): Point {
  let x = element.x;
  let y = element.y;
  let parentId = element.parentId;

  while (parentId) {
    const parent = lookup.get(parentId);
    if (!parent) {
      break;
    }

    x += parent.x;
    y += parent.y;
    parentId = parent.parentId;
  }

  return { x, y };
}

export function getAbsoluteRect(
  element: WireframeElement,
  lookup: Map<string, WireframeElement>
): RectBounds {
  const position = getAbsolutePosition(element, lookup);
  return {
    x: position.x,
    y: position.y,
    width: element.width,
    height: element.height,
  };
}

export function rectsIntersect(a: RectBounds, b: RectBounds) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

export function rectContainsPoint(rect: RectBounds, point: Point) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function getRectangleArea(rect: RectBounds) {
  return rect.width * rect.height;
}

export function calculateBoundingBox(
  ids: string[],
  lookup: Map<string, WireframeElement>
): RectBounds | null {
  let bounds: RectBounds | null = null;

  for (const id of ids) {
    const element = lookup.get(id);
    if (!element || element.type === 'artboard') {
      continue;
    }

    const rect = getAbsoluteRect(element, lookup);
    if (!bounds) {
      bounds = { ...rect };
      continue;
    }

    const minX = Math.min(bounds.x, rect.x);
    const minY = Math.min(bounds.y, rect.y);
    const maxX = Math.max(bounds.x + bounds.width, rect.x + rect.width);
    const maxY = Math.max(bounds.y + bounds.height, rect.y + rect.height);

    bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  return bounds;
}

export function findBestDropParent(
  elements: WireframeElement[],
  movingId: string,
  bounds: RectBounds
) {
  const lookup = buildElementLookup(elements);
  const movingDescendants = new Set(getDescendants(elements, movingId).map((element) => element.id));
  let best: { element: WireframeElement; area: number } | null = null;
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };

  for (const element of elements) {
    if (element.id === movingId || movingDescendants.has(element.id)) {
      continue;
    }

    if (element.type !== 'artboard' && element.type !== 'container' && element.type !== 'box') {
      continue;
    }

    const candidateBounds = getAbsoluteRect(element, lookup);
    if (!rectContainsPoint(candidateBounds, center)) {
      continue;
    }

    const area = getRectangleArea(candidateBounds);
    if (!best || area < best.area) {
      best = { element, area };
    }
  }

  return best?.element ?? null;
}

export function scaleSubtree(
  elements: WireframeElement[],
  rootId: string,
  scaleX: number,
  scaleY: number
) {
  const lookup = buildElementLookup(elements);
  const root = lookup.get(rootId);
  if (!root) {
    return elements;
  }

  const rootAbsolute = getAbsolutePosition(root, lookup);
  const scaledAbsolute = new Map<string, Point>([[rootId, rootAbsolute]]);
  const childMap = new Map<string, WireframeElement[]>();

  for (const element of elements) {
    if (!element.parentId) continue;
    const next = childMap.get(element.parentId) ?? [];
    next.push(element);
    childMap.set(element.parentId, next);
  }

  const visit = (parentId: string) => {
    const children = childMap.get(parentId) ?? [];
    for (const child of children) {
      const originalAbsolute = getAbsolutePosition(child, lookup);
      const newAbsolute = {
        x: rootAbsolute.x + (originalAbsolute.x - rootAbsolute.x) * scaleX,
        y: rootAbsolute.y + (originalAbsolute.y - rootAbsolute.y) * scaleY,
      };

      scaledAbsolute.set(child.id, newAbsolute);
      visit(child.id);
    }
  };

  visit(rootId);

  return elements.map((element) => {
    if (element.id === rootId) {
      return element;
    }

    const newAbsolute = scaledAbsolute.get(element.id);
    if (!newAbsolute) {
      return element;
    }

    const parent = element.parentId ? lookup.get(element.parentId) ?? null : null;
    const parentAbsolute = parent ? scaledAbsolute.get(parent.id) ?? getAbsolutePosition(parent, lookup) : { x: 0, y: 0 };

    return {
      ...element,
      x: newAbsolute.x - parentAbsolute.x,
      y: newAbsolute.y - parentAbsolute.y,
      width: element.width * scaleX,
      height: element.height * scaleY,
    };
  });
}

export function toRelativePosition(
  absolute: Point,
  parentId: string | null,
  lookup: Map<string, WireframeElement>
) {
  if (!parentId) {
    return absolute;
  }

  const parent = lookup.get(parentId);
  if (!parent) {
    return absolute;
  }

  const parentAbsolute = getAbsolutePosition(parent, lookup);
  return {
    x: absolute.x - parentAbsolute.x,
    y: absolute.y - parentAbsolute.y,
  };
}
