import type { DesignTokens, WireframeElement } from '@/store/useStore';

export function applyDesignTokens(
  element: WireframeElement,
  tokens: DesignTokens
): WireframeElement {
  const resolved: WireframeElement = { ...element };

  if (element.fillToken) {
    const tokenFill = tokens.colors[element.fillToken];
    if (tokenFill) {
      resolved.backgroundColor = tokenFill;
    }
  }

  if (element.spacingToken) {
    const tokenSpacing = tokens.spacing[element.spacingToken];
    if (typeof tokenSpacing === 'number') {
      resolved.padding = tokenSpacing;
      resolved.gapX = tokenSpacing;
      resolved.gapY = tokenSpacing;
    }
  }

  if (element.borderRadiusToken) {
    resolved.borderRadius = tokens.radius[element.borderRadiusToken];
  }

  if (element.fontSizeToken) {
    resolved.fontSize = tokens.typography[element.fontSizeToken];
  }

  if (element.textColorToken) {
    resolved.textColor = tokens.colors[element.textColorToken];
  }

  if (element.strokeColorToken) {
    resolved.strokeColor = tokens.colors[element.strokeColorToken];
  }

  return resolved;
}
