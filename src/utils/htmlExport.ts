import { type DesignTokens, type WireframeElement } from '@/store/useStore';
import { getDirectLayoutChildren, isAutoLayoutContainer } from './layoutMath';
import { getElementChildren } from './geometry';
import { resolveInheritedElement } from './inheritance';
import { applyDesignTokens } from './design-tokens';

interface HtmlExportOptions {
  rootId?: string | null;
  tokens?: DesignTokens;
}

const VOID_TAGS = new Set(['img', 'input', 'hr', 'br', 'meta', 'link']);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getSemanticTag(element: WireframeElement): string {
  switch (element.type) {
    case 'artboard':
      return 'section';
    case 'container':
    case 'box':
      return 'div';
    case 'div':
    case 'section':
    case 'header':
    case 'main':
    case 'footer':
    case 'nav':
    case 'aside':
    case 'article':
    case 'ul':
    case 'li':
    case 'img':
    case 'divider':
    case 'input':
    case 'textarea':
      return element.type;
    case 'checkbox':
    case 'radio':
    case 'toggle':
      return 'input';
    case 'heading':
      return getHeadingTag(element);
    case 'text':
      return 'p';
    case 'button':
      return 'button';
    case 'dropdown':
      return 'select';
    case 'label':
      return element.type;
    case 'image-placeholder':
      return 'img';
    case 'icon':
      return 'span';
    case 'avatar':
      return 'div';
    case 'table':
      return 'table';
    case 'instance':
      return 'div';
    default:
      return 'div';
  }
}

function getHeadingTag(element: WireframeElement) {
  switch (element.headingVariant ?? 'h2') {
    case 'h1':
      return 'h1';
    case 'h2':
      return 'h2';
    case 'h3':
      return 'h3';
    case 'h4':
      return 'h4';
    case 'h5':
      return 'h5';
    case 'h6':
      return 'h6';
    default:
      return 'h2';
  }
}

function getInputType(element: WireframeElement) {
  return element.inputVariant ?? 'text';
}

function getImageAlt(element: WireframeElement) {
  return element.alt ?? element.text ?? element.name ?? 'Image';
}

function getStyleValue(key: string, value: number | string | undefined) {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  return `${key}:${value};`;
}

function getElementStyle(element: WireframeElement) {
  const parts: string[] = [];
  parts.push('box-sizing:border-box;');
  parts.push(getStyleValue('position', 'relative'));
  parts.push(getStyleValue('width', `${element.width}px`));
  parts.push(getStyleValue('height', `${element.height}px`));

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
    } else {
      parts.push('display:block;');
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
  } else if (element.type === 'img' || element.type === 'image-placeholder') {
    parts.push('display:block;');
    parts.push('object-position:center center;');
    if (element.objectFit) {
      parts.push(`object-fit:${element.objectFit};`);
    }
    if (element.aspectRatio) {
      parts.push(`aspect-ratio:${element.aspectRatio};`);
    }
  } else {
    parts.push(`left:${element.x}px;`);
    parts.push(`top:${element.y}px;`);
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

function renderAttributes(element: WireframeElement) {
  const attrs: string[] = [];
  if (element.name) {
    attrs.push(`data-name="${escapeHtml(element.name)}"`);
  }
  attrs.push(`data-type="${escapeHtml(element.type)}"`);
  if (element.id) {
    attrs.push(`id="${escapeHtml(element.id)}"`);
  }

  if (element.type === 'button') {
    attrs.push(`data-variant="${escapeHtml(element.buttonVariant ?? 'primary')}"`);
    attrs.push(`data-size="${escapeHtml(element.buttonSize ?? 'normal')}"`);
    attrs.push(`data-icon-placement="${escapeHtml(element.buttonIconPlacement ?? 'none')}"`);
    attrs.push(`data-icon-name="${escapeHtml(element.buttonIconName ?? 'plus')}"`);
    if (element.buttonDisabled) {
      attrs.push('disabled');
    }
  }

  if (element.type === 'input') {
    attrs.push(`type="${escapeHtml(getInputType(element))}"`);
    if (element.placeholder ?? element.text) {
      attrs.push(`placeholder="${escapeHtml(element.placeholder ?? element.text ?? '')}"`);
    }
    if (element.value) {
      attrs.push(`value="${escapeHtml(element.value)}"`);
    }
    if (element.disabled) {
      attrs.push('disabled');
    }
    if (element.required) {
      attrs.push('required');
    }
  }

  if (element.type === 'textarea') {
    if (element.placeholder ?? element.text) {
      attrs.push(`placeholder="${escapeHtml(element.placeholder ?? element.text ?? '')}"`);
    }
    if (element.disabled) {
      attrs.push('disabled');
    }
    if (element.required) {
      attrs.push('required');
    }
  }

  if (element.type === 'label' && element.labelFor) {
    attrs.push(`for="${escapeHtml(element.labelFor)}"`);
  }

  if (element.type === 'img' || element.type === 'image-placeholder') {
    attrs.push(`alt="${escapeHtml(getImageAlt(element))}"`);
    if (element.objectFit) {
      attrs.push(`data-object-fit="${escapeHtml(element.objectFit)}"`);
    }
    if (element.aspectRatio) {
      attrs.push(`data-aspect-ratio="${String(element.aspectRatio)}"`);
    }
  }

  if (element.type === 'icon') {
    attrs.push(`data-icon-name="${escapeHtml(element.iconName ?? 'search')}"`);
  }

  if (element.type === 'table') {
    attrs.push(`data-rows="${String(element.rows ?? 3)}"`);
    attrs.push(`data-cols="${String(element.cols ?? 3)}"`);
  }

  return attrs.join(' ');
}

function renderTextContent(element: WireframeElement) {
  if (element.type === 'heading') {
    return escapeHtml(element.text ?? 'Heading');
  }
  if (element.type === 'text') {
    return escapeHtml(element.text ?? 'Text');
  }
  if (element.type === 'button') {
    return escapeHtml(element.text ?? 'Button');
  }
  if (element.type === 'label') {
    return escapeHtml(element.text ?? 'Label');
  }
  if (element.type === 'checkbox') {
    return escapeHtml(element.text ?? 'Checkbox');
  }
  if (element.type === 'radio') {
    return escapeHtml(element.text ?? 'Radio');
  }
  if (element.type === 'toggle') {
    return escapeHtml(element.text ?? 'Toggle');
  }
  if (element.type === 'dropdown') {
    return escapeHtml(element.text ?? 'Dropdown');
  }
  if (element.type === 'input') {
    return '';
  }
  if (element.type === 'textarea') {
    return escapeHtml(element.value ?? element.placeholder ?? element.text ?? '');
  }
  return escapeHtml(element.text ?? element.name ?? '');
}

function renderElement(
  element: WireframeElement,
  elements: WireframeElement[],
  lookup: Map<string, WireframeElement>,
  tokens: DesignTokens,
  indent = 0
): string {
  const resolvedElement = applyDesignTokens(
    resolveInheritedElement(element, elements, lookup),
    tokens
  );
  const tag =
    resolvedElement.type === 'heading'
      ? getHeadingTag(resolvedElement)
      : getSemanticTag(resolvedElement);
  const children = getElementChildren(elements, resolvedElement.id);
  const layoutChildren =
    isAutoLayoutContainer(resolvedElement)
      ? getDirectLayoutChildren(resolvedElement, elements)
      : children;
  const childMarkup = layoutChildren
    .map((child) => renderElement(child, elements, lookup, tokens, indent + 1))
    .join('');
  const attributes = renderAttributes(resolvedElement);
  const style = getElementStyle(resolvedElement);
  const leading = '  '.repeat(indent);
  const attrBlock = [attributes, `style="${escapeHtml(style)}"`].filter(Boolean).join(' ');
  const content = renderTextContent(resolvedElement);

  if (resolvedElement.type === 'instance') {
    const master = resolvedElement.masterComponentId
      ? lookup.get(resolvedElement.masterComponentId) ?? null
      : null;
    const masterChildren = master ? getElementChildren(elements, master.id) : [];
    const renderedMasterChildren = masterChildren
      .map((child) => renderElement(child, elements, lookup, tokens, indent + 1))
      .join('');
    return `${leading}<div ${attrBlock}>${renderedMasterChildren}</div>\n`;
  }

  if (
    resolvedElement.type === 'checkbox' ||
    resolvedElement.type === 'radio' ||
    resolvedElement.type === 'toggle'
  ) {
    const controlType = resolvedElement.type === 'toggle' ? 'checkbox' : resolvedElement.type;
    return `${leading}<label ${attrBlock}><input type="${controlType}" /> ${renderTextContent(resolvedElement)}</label>\n`;
  }

  if (VOID_TAGS.has(tag)) {
    return `${leading}<${tag} ${attrBlock} />\n`;
  }

  if (tag === 'table') {
    const rows = Math.max(1, resolvedElement.rows ?? 3);
    const cols = Math.max(1, resolvedElement.cols ?? 3);
    const rowsMarkup = Array.from({ length: rows }, (_, rowIndex) => {
      const cells = Array.from({ length: cols }, (_, colIndex) => {
        return `<td data-row="${rowIndex}" data-col="${colIndex}"></td>`;
      }).join('');
      return `    <tr>${cells}</tr>`;
    }).join('\n');
    return `${leading}<table ${attrBlock}>\n${leading}  <tbody>\n${rowsMarkup}\n${leading}  </tbody>\n${leading}</table>\n`;
  }

  if (resolvedElement.type === 'input') {
    return `${leading}<input ${attrBlock} />\n`;
  }

  if (resolvedElement.type === 'button') {
    const iconPlacement = resolvedElement.buttonIconPlacement ?? 'none';
    const iconName = escapeHtml(resolvedElement.buttonIconName ?? 'plus');
    const iconMarkup =
      iconPlacement === 'none'
        ? ''
        : `<span data-icon-name="${iconName}" data-icon-placement="${escapeHtml(iconPlacement)}"></span>`;
    const inner =
      iconPlacement === 'left'
        ? `${iconMarkup}${content ? ` ${content}` : ''}`
        : iconPlacement === 'right'
          ? `${content ? `${content} ` : ''}${iconMarkup}`
          : content;
    return `${leading}<button ${attrBlock}>${inner}</button>\n`;
  }

  if (resolvedElement.type === 'textarea') {
    return `${leading}<textarea ${attrBlock}>${content}</textarea>\n`;
  }

  if (resolvedElement.type === 'dropdown') {
    return `${leading}<select ${attrBlock}>\n${leading}  <option>${content || 'Dropdown'}</option>\n${leading}</select>\n`;
  }

  if (resolvedElement.type === 'img' || resolvedElement.type === 'image-placeholder') {
    return `${leading}<img ${attrBlock} />\n`;
  }

  if (childMarkup) {
    return `${leading}<${tag} ${attrBlock}>${content ? content : ''}\n${childMarkup}${leading}</${tag}>\n`;
  }

  return `${leading}<${tag} ${attrBlock}>${content}</${tag}>\n`;
}

export function exportHtmlDocument(
  elements: WireframeElement[],
  options: HtmlExportOptions = {}
) {
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
  const rootElements = options.rootId
    ? elements.filter((element) => element.id === options.rootId)
    : elements.filter((element) => element.type === 'artboard');

  const body = rootElements
    .map((element) => renderElement(element, elements, lookup, tokens, 2))
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Wireframe Export</title>
  </head>
  <body>
${body}  </body>
</html>
`;
}

export function downloadHtml(filename: string, html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
