import type { WireframeElement } from '@/store/useStore';
import { buildElementLookup } from './geometry';

const typographyFields: (keyof WireframeElement)[] = [
  'fontSize',
  'fontWeight',
  'textAlign',
  'headingVariant',
];

const spacingFields: (keyof WireframeElement)[] = ['padding', 'gapX', 'gapY'];

const fillFields: (keyof WireframeElement)[] = ['fill'];

const borderFields: (keyof WireframeElement)[] = ['borderRadius', 'strokeWidth'];

const alignmentFields: (keyof WireframeElement)[] = [
  'textAlign',
  'justifyContent',
  'alignItems',
  'alignContent',
  'gridJustifyItems',
  'gridAlignItems',
];

function applyGroupInheritance(
  target: WireframeElement,
  source: WireframeElement,
  fields: (keyof WireframeElement)[]
) {
  for (const field of fields) {
    const value = source[field];
    if (value !== undefined) {
      target[field] = value as never;
    }
  }
}

export function resolveInheritedElement(
  element: WireframeElement,
  elements: WireframeElement[],
  lookup = buildElementLookup(elements),
  memo = new Map<string, WireframeElement>()
): WireframeElement {
  const cached = memo.get(element.id);
  if (cached) {
    return cached;
  }

  const resolved: WireframeElement = { ...element };
  const parent = element.parentId ? lookup.get(element.parentId) ?? null : null;
  if (!parent) {
    memo.set(element.id, resolved);
    return resolved;
  }

  const parentResolved = resolveInheritedElement(parent, elements, lookup, memo);

  if (element.inheritTypography !== false) {
    applyGroupInheritance(resolved, parentResolved, typographyFields);
  }

  if (element.inheritSpacing !== false) {
    applyGroupInheritance(resolved, parentResolved, spacingFields);
  }

  if (element.inheritFill !== false) {
    applyGroupInheritance(resolved, parentResolved, fillFields);
  }

  if (element.inheritBorder !== false) {
    applyGroupInheritance(resolved, parentResolved, borderFields);
  }

  if (element.inheritAlignment !== false) {
    applyGroupInheritance(resolved, parentResolved, alignmentFields);
  }

  memo.set(element.id, resolved);
  return resolved;
}

