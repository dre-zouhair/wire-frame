import type { FillStyle, FontSize, FontWeight, TextAlign, WireframeElement } from '@/store/useStore';

export function resolveFill(fill?: FillStyle) {
  switch (fill) {
    case 'solid':
      return '#4b5563';
    case 'light':
      return '#f3f4f6';
    case 'transparent':
    default:
      return undefined;
  }
}

export function resolveStrokeWidth(strokeWidth?: number, fallback = 1) {
  return Math.max(0, strokeWidth ?? fallback);
}

export function resolveFontSize(fontSize?: FontSize, fallback = 16) {
  return fontSize ?? fallback;
}

export function resolveFontStyle(fontWeight?: FontWeight) {
  return fontWeight === 'bold' ? 'bold' : 'normal';
}

export function resolveKonvaAlign(textAlign?: TextAlign) {
  return textAlign ?? 'left';
}

export function resolveReadableTextColor(fill?: FillStyle) {
  return fill === 'solid' ? '#ffffff' : '#2f2f2f';
}

export function resolveStrokeColor(
  element: Pick<WireframeElement, 'isMasterComponent'>,
  isSelected: boolean,
  fallback: string
) {
  if (element.isMasterComponent) {
    return '#a855f7';
  }

  return isSelected ? '#111111' : fallback;
}
