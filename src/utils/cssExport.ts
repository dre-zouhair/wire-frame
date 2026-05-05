import { type DesignTokens, type WireframeElement } from '@/store/useStore';
import { getDirectLayoutChildren, isAutoLayoutContainer } from './layoutMath';
import { getElementChildren } from './geometry';
import { resolveInheritedElement } from './inheritance';
import { applyDesignTokens } from './design-tokens';

interface CssExportOptions {
  rootId?: string | null;
  tokens?: DesignTokens;
}

function cssValue(key: string, value: string | number | undefined) {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  return `${key}:${value};`;
}

function getElementCss(element: WireframeElement) {
  const parts: string[] = [];
  parts.push('box-sizing:border-box;');
  parts.push(cssValue('position', element.type === 'artboard' ? 'relative' : 'absolute'));
  parts.push(cssValue('left', `${element.x}px`));
  parts.push(cssValue('top', `${element.y}px`));
  parts.push(cssValue('width', `${element.width}px`));
  parts.push(cssValue('height', `${element.height}px`));

  if (element.type === 'artboard' || element.type === 'container' || element.type === 'box') {
    const layoutMode = element.layoutMode ?? 'absolute';
    if (layoutMode === 'flex') {
      parts.push('display:flex;');
      parts.push(`flex-direction:${element.flexDirection ?? 'column'};`);
      parts.push(`flex-wrap:${element.flexWrap ?? 'nowrap'};`);
      parts.push(`justify-content:${element.justifyContent ?? 'start'};`);
      parts.push(`align-items:${element.alignItems ?? 'start'};`);
      parts.push(`align-content:${element.alignContent ?? 'start'};`);
      parts.push(`gap:${element.gapY ?? 0}px ${element.gapX ?? 0}px;`);
      parts.push(`padding:${element.padding ?? 0}px;`);
    } else if (layoutMode === 'grid') {
      const columns = Math.max(1, element.gridColumns ?? 1);
      parts.push('display:grid;');
      parts.push(`grid-template-columns:repeat(${columns}, minmax(0, 1fr));`);
      if (element.gridRows) {
        parts.push(`grid-template-rows:repeat(${element.gridRows}, minmax(0, 1fr));`);
      }
      parts.push(`grid-auto-flow:${element.gridAutoFlow ?? 'row'};`);
      parts.push(`justify-items:${element.gridJustifyItems ?? 'start'};`);
      parts.push(`align-items:${element.gridAlignItems ?? 'start'};`);
      parts.push(`column-gap:${element.gapX ?? 0}px;`);
      parts.push(`row-gap:${element.gapY ?? 0}px;`);
      parts.push(`padding:${element.padding ?? 0}px;`);
    }
    if (element.backgroundColor) {
      parts.push(`background:${element.backgroundColor};`);
    } else if (element.fill && element.fill !== 'transparent') {
      parts.push(`background:${element.fill === 'solid' ? '#4b5563' : '#f3f4f6'};`);
    }
    if (element.borderRadius) {
      parts.push(`border-radius:${element.borderRadius}px;`);
    }
    if (element.strokeWidth !== undefined) {
      parts.push(`border:${element.strokeWidth}px solid #9ca3af;`);
    }
  }

  if (element.type === 'img' || element.type === 'image-placeholder') {
    parts.push('object-position:center center;');
    parts.push(`object-fit:${element.objectFit ?? 'contain'};`);
    if (element.aspectRatio) {
      parts.push(`aspect-ratio:${element.aspectRatio};`);
    }
  }

  if (element.textColor) {
    parts.push(`color:${element.textColor};`);
  }
  if (element.fontSize) {
    parts.push(`font-size:${element.fontSize}px;`);
  }
  if (element.fontWeight) {
    parts.push(`font-weight:${element.fontWeight};`);
  }
  if (element.textAlign) {
    parts.push(`text-align:${element.textAlign};`);
  }

  return parts.join('');
}

function renderRule(element: WireframeElement) {
  return `#${element.id} { ${getElementCss(element)} }\n`;
}

function renderTree(
  element: WireframeElement,
  elements: WireframeElement[],
  lookup: Map<string, WireframeElement>,
  tokens: DesignTokens,
  memo = new Set<string>()
): string {
  if (memo.has(element.id)) {
    return '';
  }
  memo.add(element.id);

  const resolved = applyDesignTokens(resolveInheritedElement(element, elements, lookup), tokens);
  const children = getElementChildren(elements, element.id);
  const layoutChildren = isAutoLayoutContainer(resolved)
    ? getDirectLayoutChildren(resolved, elements)
    : children;

  let output = renderRule(resolved);
  for (const child of layoutChildren) {
    output += renderTree(child, elements, lookup, tokens, memo);
  }

  return output;
}

export function exportCssDocument(elements: WireframeElement[], options: CssExportOptions = {}) {
  const lookup = new Map(elements.map((element) => [element.id, element] as const));
  const tokens =
    options.tokens ??
    ({
      colors: {
        surface: '#ffffff',
        surfaceAlt: '#f3f4f6',
        border: '#9ca3af',
        text: '#2f2f2f',
        muted: '#6b7280',
        primary: '#4b5563',
        danger: '#dc2626',
        warning: '#d97706',
      },
      spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
      radius: { sm: 4, md: 8, lg: 12, xl: 16 },
      typography: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, display: 36 },
    } as DesignTokens);
  const roots = options.rootId
    ? elements.filter((element) => element.id === options.rootId)
    : elements.filter((element) => element.type === 'artboard');

  return roots
    .map((root) => renderTree(root, elements, lookup, tokens))
    .join('\n');
}

export function downloadCss(filename: string, css: string) {
  const blob = new Blob([css], { type: 'text/css;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
