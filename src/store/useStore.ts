import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import {
  calculateBoundingBox,
  buildElementLookup,
  getAbsolutePosition,
  getDescendants,
  getElementChildren,
  isDescendantOf,
  scaleSubtree,
  toRelativePosition,
  type Point,
} from '@/utils/geometry';
import {
  canContainChild,
  getDefaultSemanticName,
  isSemanticContainerType,
} from '@/utils/semantic-html';

export type ElementType =
  | 'artboard'
  | 'container'
  | 'box'
  | 'div'
  | 'section'
  | 'header'
  | 'main'
  | 'footer'
  | 'nav'
  | 'aside'
  | 'article'
  | 'ul'
  | 'li'
  | 'img'
  | 'divider'
  | 'heading'
  | 'text'
  | 'button'
  | 'input'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'dropdown'
  | 'label'
  | 'image-placeholder'
  | 'icon'
  | 'avatar'
  | 'table'
  | 'instance';

export type LayoutMode = 'absolute' | 'flex' | 'grid';
export type FlexDirection = 'row' | 'column';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
export type JustifyContent =
  | 'start'
  | 'center'
  | 'end'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';
export type AlignItems = 'start' | 'center' | 'end' | 'stretch';
export type AlignContent = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'stretch';
export type GridAutoFlow = 'row' | 'column';
export type GridAlign = 'start' | 'center' | 'end' | 'stretch';
export type FillStyle = 'solid' | 'light' | 'transparent';
export type FontSize = 12 | 16 | 20 | 24 | 30 | 36 | 48;
export type FontWeight = 'normal' | 'bold';
export type TextAlign = 'left' | 'center' | 'right';
export type SizeUnit = 'px' | 'vw' | 'vh';
export type InputVariant = 'text' | 'email' | 'password' | 'number' | 'date';
export type HeadingVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning';
export type ButtonSize = 'small' | 'normal' | 'large';
export type ButtonIconPlacement = 'none' | 'left' | 'right';
export type ImageObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
export type PageTemplate = 'blank' | 'landing' | 'dashboard' | 'form' | 'article' | 'mobile';
export type PreviewPreset = 'desktop' | 'tablet' | 'mobile';

export interface DesignTokens {
  colors: {
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    muted: string;
    primary: string;
    danger: string;
    warning: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    display: number;
  };
}
export type IconName =
  | 'menu'
  | 'search'
  | 'user'
  | 'home'
  | 'settings'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'sort-asc'
  | 'sort-desc'
  | 'chevrons-left'
  | 'chevrons-right'
  | 'ellipsis'
  | 'plus'
  | 'minus'
  | 'x';

export interface WireframeElement {
  id: string;
  type: ElementType;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId: string | null;
  widthUnit?: SizeUnit;
  heightUnit?: SizeUnit;
  text?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  alt?: string;
  objectFit?: ImageObjectFit;
  aspectRatio?: number;
  checked?: boolean;
  layoutMode?: LayoutMode;
  gapX?: number;
  gapY?: number;
  padding?: number;
  flexDirection?: FlexDirection;
  flexWrap?: FlexWrap;
  justifyContent?: JustifyContent;
  alignItems?: AlignItems;
  alignContent?: AlignContent;
  gridColumns?: number;
  gridRows?: number;
  gridAutoFlow?: GridAutoFlow;
  gridJustifyItems?: GridAlign;
  gridAlignItems?: GridAlign;
  isMasterComponent?: boolean;
  masterComponentId?: string;
  fontSize?: number;
  fontWeight?: FontWeight;
  textAlign?: TextAlign;
  headingVariant?: HeadingVariant;
  inputVariant?: InputVariant;
  inheritTypography?: boolean;
  inheritSpacing?: boolean;
  inheritFill?: boolean;
  inheritBorder?: boolean;
  inheritAlignment?: boolean;
  labelFor?: string;
  buttonVariant?: ButtonVariant;
  buttonSize?: ButtonSize;
  buttonDisabled?: boolean;
  buttonIconPlacement?: ButtonIconPlacement;
  buttonIconName?: IconName;
  borderRadius?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  fill?: FillStyle;
  textColor?: string;
  strokeColor?: string;
  fillToken?: keyof DesignTokens['colors'];
  spacingToken?: keyof DesignTokens['spacing'];
  borderRadiusToken?: keyof DesignTokens['radius'];
  fontSizeToken?: keyof DesignTokens['typography'];
  textColorToken?: keyof DesignTokens['colors'];
  strokeColorToken?: keyof DesignTokens['colors'];
  iconName?: IconName;
  rows?: number;
  cols?: number;
}

export const ARTBOARD_PRESETS = [
  { name: 'Desktop (1440x900)', width: 1440, height: 900 },
  { name: 'Laptop (1024x768)', width: 1024, height: 768 },
  { name: 'Mobile (390x844)', width: 390, height: 844 },
] as const;

const ROOT_ARTBOARD_ID = 'root-page';
const PARENTABLE_TYPES = new Set<ElementType>([
  'artboard',
  'container',
  'box',
  'div',
  'section',
  'header',
  'main',
  'footer',
  'nav',
  'aside',
  'article',
  'ul',
  'li',
]);

interface AppState {
  elements: WireframeElement[];
  designTokens: DesignTokens;
  selectedIds: string[];
  activeArtboardId: string;
  clipboard: WireframeElement[];
  pageDragEnabled: boolean;
  fitToPageRevision: number;
  addElement: (type: Exclude<ElementType, 'artboard' | 'instance'>) => void;
  createMasterComponent: (selectedId: string) => void;
  createInstance: (masterId: string) => void;
  createPage: (template?: PageTemplate) => void;
  setActivePage: (pageId: string) => void;
  deletePage: (pageId: string) => void;
  setPageDragEnabled: (enabled: boolean) => void;
  setPreviewPreset: (preset: PreviewPreset) => void;
  zoomToFit: () => void;
  setSelection: (ids: string[]) => void;
  selectElement: (id: string | null, additive?: boolean) => void;
  copy: () => void;
  paste: () => void;
  pasteAt: (position: Point, targetParentId?: string | null) => void;
  duplicate: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  moveSelectedSibling: (direction: 'up' | 'down') => void;
  updateElement: (id: string, newProps: Partial<WireframeElement>) => void;
  transformElement: (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    scaleX: number,
    scaleY: number
  ) => void;
  reparentElement: (id: string, parentId: string | null, x: number, y: number) => void;
  deleteSelected: () => void;
  changeArtboardSize: (width: number, height: number) => void;
  groupSelected: (selectedIds: string[]) => void;
  ungroupSelected: (containerId: string) => void;
  updateToken: <K extends keyof DesignTokens, P extends keyof DesignTokens[K]>(
    group: K,
    key: P,
    value: DesignTokens[K][P]
  ) => void;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 11);
}

const defaultElementSize: Record<
  Exclude<ElementType, 'artboard' | 'instance'>,
  Pick<WireframeElement, 'width' | 'height'> &
    Partial<
      Pick<
        WireframeElement,
        | 'layoutMode'
        | 'gapX'
        | 'gapY'
        | 'padding'
        | 'flexDirection'
        | 'flexWrap'
        | 'justifyContent'
        | 'alignItems'
        | 'alignContent'
        | 'gridColumns'
        | 'gridRows'
        | 'gridAutoFlow'
        | 'gridJustifyItems'
        | 'gridAlignItems'
        | 'widthUnit'
        | 'heightUnit'
        | 'text'
        | 'checked'
        | 'fontSize'
        | 'fontWeight'
        | 'textAlign'
        | 'headingVariant'
        | 'inputVariant'
        | 'inheritTypography'
        | 'inheritSpacing'
        | 'inheritFill'
        | 'inheritBorder'
        | 'inheritAlignment'
        | 'labelFor'
        | 'placeholder'
        | 'value'
        | 'disabled'
        | 'required'
        | 'alt'
        | 'objectFit'
        | 'aspectRatio'
        | 'buttonVariant'
        | 'buttonSize'
        | 'buttonDisabled'
        | 'buttonIconPlacement'
        | 'buttonIconName'
        | 'borderRadius'
        | 'strokeWidth'
        | 'fill'
        | 'fillToken'
        | 'spacingToken'
        | 'borderRadiusToken'
        | 'fontSizeToken'
        | 'textColorToken'
        | 'strokeColorToken'
        | 'iconName'
        | 'rows'
        | 'cols'
      >
    >
> = {
  container: {
    width: 240,
    height: 160,
    borderRadius: 0,
    strokeWidth: 1,
    fill: 'transparent',
    layoutMode: 'flex',
    gapX: 0,
    gapY: 0,
    padding: 0,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'start',
    alignItems: 'start',
    alignContent: 'start',
    gridColumns: 2,
    gridRows: 2,
    gridAutoFlow: 'row',
    gridJustifyItems: 'start',
    gridAlignItems: 'start',
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  div: {
    width: 240,
    height: 160,
    borderRadius: 0,
    strokeWidth: 1,
    fill: 'transparent',
    layoutMode: 'flex',
    gapX: 0,
    gapY: 0,
    padding: 0,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'start',
    alignItems: 'start',
    alignContent: 'start',
    gridColumns: 2,
    gridRows: 2,
    gridAutoFlow: 'row',
    gridJustifyItems: 'start',
    gridAlignItems: 'start',
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  section: {
    width: 240,
    height: 160,
    borderRadius: 0,
    strokeWidth: 1,
    fill: 'transparent',
    layoutMode: 'flex',
    gapX: 0,
    gapY: 0,
    padding: 0,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'start',
    alignItems: 'start',
    alignContent: 'start',
    gridColumns: 2,
    gridRows: 2,
    gridAutoFlow: 'row',
    gridJustifyItems: 'start',
    gridAlignItems: 'start',
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  header: {
    width: 240,
    height: 96,
    borderRadius: 0,
    strokeWidth: 1,
    fill: 'transparent',
    layoutMode: 'flex',
    gapX: 0,
    gapY: 0,
    padding: 0,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'start',
    alignItems: 'start',
    alignContent: 'start',
    gridColumns: 2,
    gridRows: 2,
    gridAutoFlow: 'row',
    gridJustifyItems: 'start',
    gridAlignItems: 'start',
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  main: {
    width: 240,
    height: 160,
    borderRadius: 0,
    strokeWidth: 1,
    fill: 'transparent',
    layoutMode: 'flex',
    gapX: 0,
    gapY: 0,
    padding: 0,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'start',
    alignItems: 'start',
    alignContent: 'start',
    gridColumns: 2,
    gridRows: 2,
    gridAutoFlow: 'row',
    gridJustifyItems: 'start',
    gridAlignItems: 'start',
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  footer: {
    width: 240,
    height: 96,
    borderRadius: 0,
    strokeWidth: 1,
    fill: 'transparent',
    layoutMode: 'flex',
    gapX: 0,
    gapY: 0,
    padding: 0,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'start',
    alignItems: 'start',
    alignContent: 'start',
    gridColumns: 2,
    gridRows: 2,
    gridAutoFlow: 'row',
    gridJustifyItems: 'start',
    gridAlignItems: 'start',
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  nav: {
    width: 240,
    height: 96,
    borderRadius: 0,
    strokeWidth: 1,
    fill: 'transparent',
    layoutMode: 'flex',
    gapX: 0,
    gapY: 0,
    padding: 0,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'start',
    alignItems: 'start',
    alignContent: 'start',
    gridColumns: 2,
    gridRows: 2,
    gridAutoFlow: 'row',
    gridJustifyItems: 'start',
    gridAlignItems: 'start',
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  aside: {
    width: 240,
    height: 160,
    borderRadius: 0,
    strokeWidth: 1,
    fill: 'transparent',
    layoutMode: 'flex',
    gapX: 0,
    gapY: 0,
    padding: 0,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'start',
    alignItems: 'start',
    alignContent: 'start',
    gridColumns: 2,
    gridRows: 2,
    gridAutoFlow: 'row',
    gridJustifyItems: 'start',
    gridAlignItems: 'start',
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  article: {
    width: 240,
    height: 160,
    borderRadius: 0,
    strokeWidth: 1,
    fill: 'transparent',
    layoutMode: 'flex',
    gapX: 0,
    gapY: 0,
    padding: 0,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'start',
    alignItems: 'start',
    alignContent: 'start',
    gridColumns: 2,
    gridRows: 2,
    gridAutoFlow: 'row',
    gridJustifyItems: 'start',
    gridAlignItems: 'start',
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  ul: {
    width: 240,
    height: 160,
    borderRadius: 0,
    strokeWidth: 1,
    fill: 'transparent',
    layoutMode: 'flex',
    gapX: 0,
    gapY: 0,
    padding: 0,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'start',
    alignItems: 'start',
    alignContent: 'start',
    gridColumns: 2,
    gridRows: 2,
    gridAutoFlow: 'row',
    gridJustifyItems: 'start',
    gridAlignItems: 'start',
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  li: {
    width: 220,
    height: 40,
    borderRadius: 0,
    strokeWidth: 1,
    fill: 'transparent',
    layoutMode: 'flex',
    gapX: 0,
    gapY: 0,
    padding: 0,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'start',
    alignItems: 'start',
    alignContent: 'start',
    gridColumns: 2,
    gridRows: 2,
    gridAutoFlow: 'row',
    gridJustifyItems: 'start',
    gridAlignItems: 'start',
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  img: {
    width: 240,
    height: 160,
    alt: 'Image',
    objectFit: 'contain',
    aspectRatio: 1.5,
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  'image-placeholder': {
    width: 240,
    height: 160,
    alt: 'Image',
    objectFit: 'contain',
    aspectRatio: 1.5,
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  box: {
    width: 240,
    height: 160,
    borderRadius: 0,
    strokeWidth: 1,
    fill: 'transparent',
    layoutMode: 'flex',
    gapX: 0,
    gapY: 0,
    padding: 0,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'start',
    alignItems: 'start',
    alignContent: 'start',
    gridColumns: 2,
    gridRows: 2,
    gridAutoFlow: 'row',
    gridJustifyItems: 'start',
    gridAlignItems: 'start',
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  divider: { width: 240, height: 1, strokeWidth: 1, widthUnit: 'px', heightUnit: 'px' },
  heading: {
    width: 320,
    height: 48,
    text: 'Heading',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'left',
    headingVariant: 'h2',
    widthUnit: 'px',
    heightUnit: 'px',
    inheritTypography: true,
    inheritSpacing: false,
    inheritFill: false,
    inheritBorder: false,
    inheritAlignment: true,
  },
  text: {
    width: 120,
    height: 28,
    text: 'Text',
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
    widthUnit: 'px',
    heightUnit: 'px',
  },
  button: {
    width: 96,
    height: 40,
    text: 'Button',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    buttonVariant: 'primary',
    buttonSize: 'normal',
    buttonDisabled: false,
    buttonIconPlacement: 'none',
    buttonIconName: 'plus',
    borderRadius: 6,
    strokeWidth: 1,
    fill: 'solid',
    widthUnit: 'px',
    heightUnit: 'px',
  },
  input: {
    width: 240,
    height: 40,
    text: 'Input',
    placeholder: 'Text',
    value: '',
    disabled: false,
    required: false,
    inputVariant: 'text',
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
    borderRadius: 4,
    strokeWidth: 1,
    fill: 'transparent',
    widthUnit: 'px',
    heightUnit: 'px',
  },
  textarea: {
    width: 240,
    height: 96,
    text: 'Textarea',
    placeholder: 'Text',
    value: '',
    disabled: false,
    required: false,
    inputVariant: 'text',
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
    borderRadius: 4,
    strokeWidth: 1,
    fill: 'transparent',
    widthUnit: 'px',
    heightUnit: 'px',
  },
  checkbox: {
    width: 180,
    height: 24,
    text: 'Checkbox',
    checked: false,
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
    widthUnit: 'px',
    heightUnit: 'px',
  },
  radio: {
    width: 180,
    height: 24,
    text: 'Radio',
    checked: false,
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
    widthUnit: 'px',
    heightUnit: 'px',
  },
  toggle: {
    width: 180,
    height: 28,
    text: 'Toggle',
    checked: false,
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
    widthUnit: 'px',
    heightUnit: 'px',
  },
  dropdown: {
    width: 240,
    height: 40,
    text: 'Dropdown',
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
    borderRadius: 4,
    strokeWidth: 1,
    fill: 'transparent',
    widthUnit: 'px',
    heightUnit: 'px',
  },
  label: {
    width: 120,
    height: 24,
    text: 'Label',
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
    labelFor: '',
    widthUnit: 'px',
    heightUnit: 'px',
  },
  icon: { width: 32, height: 32, iconName: 'search', widthUnit: 'px', heightUnit: 'px' },
  avatar: { width: 48, height: 48, widthUnit: 'px', heightUnit: 'px' },
  table: { width: 320, height: 180, rows: 3, cols: 3, widthUnit: 'px', heightUnit: 'px' },
};

const defaultDesignTokens: DesignTokens = {
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
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  typography: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    display: 36,
  },
};

function getDefaultElementName(type: ElementType, index = 1) {
  switch (type) {
    case 'artboard':
      return `Page ${index}`;
    case 'container':
      return 'Container';
    case 'box':
      return 'Box';
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
      return getDefaultSemanticName(type);
    case 'divider':
      return 'Divider';
    case 'heading':
      return 'Heading';
    case 'text':
      return 'Text';
    case 'button':
      return 'Button';
    case 'input':
      return 'Input';
    case 'textarea':
      return 'Textarea';
    case 'checkbox':
      return 'Checkbox';
    case 'radio':
      return 'Radio';
    case 'toggle':
      return 'Toggle';
    case 'dropdown':
      return 'Dropdown';
    case 'label':
      return 'Label';
    case 'image-placeholder':
      return 'Image';
    case 'icon':
      return 'Icon';
    case 'avatar':
      return 'Avatar';
    case 'table':
      return 'Table';
    case 'instance':
      return 'Instance';
    default:
      return type;
  }
}

function cloneElement(element: WireframeElement): WireframeElement {
  return { ...element };
}

function getRootArtboard(elements: WireframeElement[]) {
  return elements.find((element) => element.type === 'artboard') ?? null;
}

function getActiveArtboard(elements: WireframeElement[], activeArtboardId: string) {
  return (
    elements.find((element) => element.id === activeArtboardId && element.type === 'artboard') ??
    getRootArtboard(elements)
  );
}

function getNextPagePosition(elements: WireframeElement[]) {
  const pages = elements.filter((element) => element.type === 'artboard');
  if (!pages.length) {
    return { x: 0, y: 0 };
  }

  const maxRight = Math.max(...pages.map((page) => page.x + page.width));
  const maxTop = Math.min(...pages.map((page) => page.y));
  return { x: maxRight + 80, y: maxTop };
}

function buildPageTemplate(
  template: PageTemplate,
  page: WireframeElement
): WireframeElement[] {
  if (template === 'blank') {
    return [];
  }

  const children: WireframeElement[] = [];

  const createBlock = (
    type: Exclude<ElementType, 'artboard' | 'instance'>,
    props: Partial<WireframeElement> = {}
  ) => ({
    id: generateId(),
    type,
    name: props.name ?? getDefaultElementName(type),
    parentId: props.parentId ?? page.id,
    x: props.x ?? 0,
    y: props.y ?? 0,
    width: props.width ?? 240,
    height: props.height ?? 80,
    widthUnit: props.widthUnit ?? 'px',
    heightUnit: props.heightUnit ?? 'px',
    layoutMode: props.layoutMode ?? 'flex',
    gapX: props.gapX ?? 0,
    gapY: props.gapY ?? 0,
    padding: props.padding ?? 0,
    flexDirection: props.flexDirection ?? 'column',
    flexWrap: props.flexWrap ?? 'nowrap',
    justifyContent: props.justifyContent ?? 'start',
    alignItems: props.alignItems ?? 'start',
    alignContent: props.alignContent ?? 'start',
    fill: props.fill ?? 'transparent',
    borderRadius: props.borderRadius ?? 0,
    strokeWidth: props.strokeWidth ?? 1,
    fontSize: props.fontSize,
    fontWeight: props.fontWeight,
    textAlign: props.textAlign,
    text: props.text,
    placeholder: props.placeholder,
    value: props.value,
    inputVariant: props.inputVariant,
    buttonVariant: props.buttonVariant,
    buttonSize: props.buttonSize,
    buttonDisabled: props.buttonDisabled,
    buttonIconPlacement: props.buttonIconPlacement,
    buttonIconName: props.buttonIconName,
    labelFor: props.labelFor,
    inheritTypography: props.inheritTypography,
    inheritSpacing: props.inheritSpacing,
    inheritFill: props.inheritFill,
    inheritBorder: props.inheritBorder,
    inheritAlignment: props.inheritAlignment,
  });

  if (template === 'landing') {
    const headerId = generateId();
    const mainId = generateId();
    const footerId = generateId();
    children.push(
      {
        id: headerId,
        type: 'header',
        name: 'Header',
        parentId: page.id,
        x: 0,
        y: 0,
        width: page.width,
        height: 120,
        widthUnit: 'px',
        heightUnit: 'px',
        layoutMode: 'flex',
        gapX: 16,
        gapY: 12,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        fill: 'light',
      },
      {
        id: mainId,
        type: 'main',
        name: 'Hero',
        parentId: page.id,
        x: 0,
        y: 120,
        width: page.width,
        height: page.height - 240,
        widthUnit: 'px',
        heightUnit: 'px',
        layoutMode: 'flex',
        gapX: 0,
        gapY: 16,
        padding: 48,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'start',
      },
      {
        id: footerId,
        type: 'footer',
        name: 'Footer',
        parentId: page.id,
        x: 0,
        y: page.height - 120,
        width: page.width,
        height: 120,
        widthUnit: 'px',
        heightUnit: 'px',
        layoutMode: 'flex',
        gapX: 12,
        gapY: 12,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        fill: 'light',
      },
      createBlock('heading', {
        parentId: headerId,
        x: 24,
        y: 28,
        width: 280,
        height: 48,
        text: 'Brand',
        fontSize: 24,
        fontWeight: 'bold',
      }) as WireframeElement,
      createBlock('button', {
        parentId: headerId,
        x: page.width - 150,
        y: 28,
        width: 120,
        height: 40,
        text: 'Get Started',
        buttonVariant: 'primary',
        buttonSize: 'normal',
        fill: 'solid',
      }) as WireframeElement,
      createBlock('heading', {
        parentId: mainId,
        x: 48,
        y: 48,
        width: 560,
        height: 72,
        text: 'Build your next landing page',
        fontSize: 48,
        fontWeight: 'bold',
      }) as WireframeElement,
      createBlock('text', {
        parentId: mainId,
        x: 48,
        y: 132,
        width: 520,
        height: 60,
        text: 'Start with a simple hero section, call to action, and footer.',
        fontSize: 20,
      }) as WireframeElement,
      createBlock('button', {
        parentId: mainId,
        x: 48,
        y: 208,
        width: 160,
        height: 48,
        text: 'Primary CTA',
        buttonVariant: 'primary',
        buttonSize: 'large',
        fill: 'solid',
      }) as WireframeElement,
      createBlock('text', {
        parentId: footerId,
        x: 24,
        y: 36,
        width: 260,
        height: 24,
        text: '© 2026 Your Company',
        fontSize: 14,
      }) as WireframeElement
    );
    return children;
  }

  if (template === 'dashboard') {
    const sidebarId = generateId();
    const mainId = generateId();
    const topbarId = generateId();
    children.push(
      {
        id: sidebarId,
        type: 'aside',
        name: 'Sidebar',
        parentId: page.id,
        x: 0,
        y: 0,
        width: 280,
        height: page.height,
        widthUnit: 'px',
        heightUnit: 'px',
        layoutMode: 'flex',
        gapX: 0,
        gapY: 12,
        padding: 24,
        flexDirection: 'column',
        fill: 'light',
      },
      {
        id: mainId,
        type: 'main',
        name: 'Content',
        parentId: page.id,
        x: 280,
        y: 0,
        width: page.width - 280,
        height: page.height,
        widthUnit: 'px',
        heightUnit: 'px',
        layoutMode: 'flex',
        gapX: 16,
        gapY: 16,
        padding: 24,
        flexDirection: 'column',
      },
      {
        id: topbarId,
        type: 'header',
        name: 'Toolbar',
        parentId: mainId,
        x: 24,
        y: 24,
        width: page.width - 328,
        height: 72,
        widthUnit: 'px',
        heightUnit: 'px',
        layoutMode: 'flex',
        gapX: 12,
        gapY: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        fill: 'light',
      },
      createBlock('heading', {
        parentId: sidebarId,
        x: 24,
        y: 24,
        width: 180,
        height: 36,
        text: 'Dashboard',
        fontSize: 30,
        fontWeight: 'bold',
      }) as WireframeElement,
      createBlock('text', {
        parentId: sidebarId,
        x: 24,
        y: 72,
        width: 200,
        height: 28,
        text: 'Navigation',
      }) as WireframeElement,
      createBlock('box', {
        parentId: mainId,
        x: 24,
        y: 112,
        width: page.width - 328,
        height: 160,
        fill: 'light',
        borderRadius: 8,
      }) as WireframeElement
    );
    return children;
  }

  if (template === 'form') {
    const formId = generateId();
    children.push(
      {
        id: formId,
        type: 'section',
        name: 'Form',
        parentId: page.id,
        x: Math.max(48, (page.width - 640) / 2),
        y: 96,
        width: Math.min(640, page.width - 96),
        height: 420,
        widthUnit: 'px',
        heightUnit: 'px',
        layoutMode: 'flex',
        gapX: 0,
        gapY: 16,
        padding: 32,
        flexDirection: 'column',
        fill: 'light',
        borderRadius: 12,
      },
      createBlock('heading', {
        parentId: formId,
        x: 32,
        y: 32,
        width: 280,
        height: 40,
        text: 'Contact Us',
        fontSize: 36,
        fontWeight: 'bold',
      }) as WireframeElement,
      createBlock('label', {
        parentId: formId,
        x: 32,
        y: 96,
        width: 120,
        height: 24,
        text: 'Email',
        labelFor: 'email-field',
      }) as WireframeElement,
      createBlock('input', {
        parentId: formId,
        x: 32,
        y: 124,
        width: 320,
        height: 40,
        placeholder: 'you@example.com',
        inputVariant: 'email',
      }) as WireframeElement,
      createBlock('button', {
        parentId: formId,
        x: 32,
        y: 184,
        width: 140,
        height: 44,
        text: 'Submit',
        buttonVariant: 'primary',
        fill: 'solid',
      }) as WireframeElement
    );
    return children;
  }

  if (template === 'article') {
    const headerId = generateId();
    const articleId = generateId();
    const asideId = generateId();
    children.push(
      {
        id: headerId,
        type: 'header',
        name: 'Header',
        parentId: page.id,
        x: 0,
        y: 0,
        width: page.width,
        height: 120,
        widthUnit: 'px',
        heightUnit: 'px',
        layoutMode: 'flex',
        padding: 24,
        flexDirection: 'column',
        fill: 'light',
      },
      {
        id: articleId,
        type: 'article',
        name: 'Article',
        parentId: page.id,
        x: 0,
        y: 120,
        width: page.width - 320,
        height: page.height - 240,
        widthUnit: 'px',
        heightUnit: 'px',
        layoutMode: 'flex',
        gapX: 0,
        gapY: 16,
        padding: 32,
        flexDirection: 'column',
      },
      {
        id: asideId,
        type: 'aside',
        name: 'Related',
        parentId: page.id,
        x: page.width - 320,
        y: 120,
        width: 320,
        height: page.height - 240,
        widthUnit: 'px',
        heightUnit: 'px',
        layoutMode: 'flex',
        gapX: 0,
        gapY: 12,
        padding: 24,
        flexDirection: 'column',
        fill: 'light',
      },
      createBlock('heading', {
        parentId: headerId,
        x: 24,
        y: 24,
        width: 420,
        height: 44,
        text: 'Article Title',
        fontSize: 36,
        fontWeight: 'bold',
      }) as WireframeElement,
      createBlock('text', {
        parentId: articleId,
        x: 32,
        y: 32,
        width: 540,
        height: 120,
        text: 'Article body content goes here. Use this template for long-form layouts.',
      }) as WireframeElement
    );
    return children;
  }

  if (template === 'mobile') {
    const headerId = generateId();
    const mainId = generateId();
    const footerId = generateId();
    children.push(
      {
        id: headerId,
        type: 'header',
        name: 'Header',
        parentId: page.id,
        x: 0,
        y: 0,
        width: page.width,
        height: 88,
        widthUnit: 'px',
        heightUnit: 'px',
        layoutMode: 'flex',
        gapX: 12,
        gapY: 12,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        fill: 'light',
      },
      {
        id: mainId,
        type: 'main',
        name: 'Main',
        parentId: page.id,
        x: 0,
        y: 88,
        width: page.width,
        height: page.height - 176,
        widthUnit: 'px',
        heightUnit: 'px',
        layoutMode: 'flex',
        gapX: 0,
        gapY: 16,
        padding: 20,
        flexDirection: 'column',
      },
      {
        id: footerId,
        type: 'footer',
        name: 'Footer',
        parentId: page.id,
        x: 0,
        y: page.height - 88,
        width: page.width,
        height: 88,
        widthUnit: 'px',
        heightUnit: 'px',
        layoutMode: 'flex',
        gapX: 12,
        gapY: 12,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        fill: 'light',
      },
      createBlock('heading', {
        parentId: headerId,
        x: 20,
        y: 20,
        width: 180,
        height: 32,
        text: 'Mobile',
        fontSize: 24,
        fontWeight: 'bold',
      }) as WireframeElement,
      createBlock('button', {
        parentId: footerId,
        x: 20,
        y: 20,
        width: 120,
        height: 36,
        text: 'Action',
        buttonVariant: 'primary',
        fill: 'solid',
      }) as WireframeElement
    );
    return children;
  }

  return children;
}

function uniqueExistingIds(ids: string[], elements: WireframeElement[]) {
  const lookup = buildElementLookup(elements);
  const seen = new Set<string>();

  return ids.filter((id) => {
    if (seen.has(id)) {
      return false;
    }

    const element = lookup.get(id);
    if (!element) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

function filterSelectionToTopLevel(selectedIds: string[], elements: WireframeElement[]): string[] {
  const lookup = buildElementLookup(elements);
  const unique = uniqueExistingIds(selectedIds, elements);

  return unique.filter((id) => {
    const candidate = lookup.get(id);
    if (!candidate || candidate.type === 'artboard') {
      return false;
    }

    return !unique.some((otherId) => otherId !== id && isDescendantOf(id, otherId, lookup));
  });
}

function getSelectionParent(elements: WireframeElement[], selectedIds: string[], activeArtboardId: string) {
  const lookup = buildElementLookup(elements);

  for (const id of selectedIds) {
    const selected = lookup.get(id);
    if (selected && PARENTABLE_TYPES.has(selected.type)) {
      return selected;
    }
  }

  return getActiveArtboard(elements, activeArtboardId);
}

function isAutoLayoutContainer(element: WireframeElement | null | undefined) {
  if (!element) {
    return false;
  }

  return (
    (element.layoutMode ?? 'absolute') !== 'absolute' &&
    (element.type === 'artboard' ||
      element.type === 'container' ||
      element.type === 'box' ||
      isSemanticContainerType(element.type))
  );
}

function normalizeContainers(elements: WireframeElement[], _changedIds: string[]) {
  return elements;
}

function moveSelectedSiblingInState(
  elements: WireframeElement[],
  selectedIds: string[],
  direction: 'up' | 'down'
) {
  const lookup = buildElementLookup(elements);
  const selectedId = [...selectedIds].reverse().find((id) => lookup.has(id));
  if (!selectedId) {
    return elements;
  }

  const element = lookup.get(selectedId) ?? null;
  if (!element || !element.parentId) {
    return elements;
  }

  const siblings = elements.filter((item) => item.parentId === element.parentId);
  const siblingIds = siblings.map((item) => item.id);
  const currentSiblingIndex = siblingIds.indexOf(selectedId);
  if (currentSiblingIndex < 0) {
    return elements;
  }

  const offset = direction === 'up' ? -1 : 1;
  const nextSiblingIndex = currentSiblingIndex + offset;
  if (nextSiblingIndex < 0 || nextSiblingIndex >= siblingIds.length) {
    return elements;
  }

  const siblingBefore = siblingIds[Math.min(currentSiblingIndex, nextSiblingIndex)];
  const siblingAfter = siblingIds[Math.max(currentSiblingIndex, nextSiblingIndex)];
  const firstIndex = elements.findIndex((item) => item.id === siblingBefore);
  const secondIndex = elements.findIndex((item) => item.id === siblingAfter);

  if (firstIndex < 0 || secondIndex < 0) {
    return elements;
  }

  const reordered = [...elements];
  const [moving] = reordered.splice(secondIndex, 1);
  reordered.splice(firstIndex, 0, moving);
  return reordered;
}

function reorderChildrenByPosition(elements: WireframeElement[], parentId: string) {
  const parentChildren = elements.filter((item) => item.parentId === parentId);
  if (parentChildren.length < 2) {
    return elements;
  }

  const lookup = buildElementLookup(elements);
  const parent = lookup.get(parentId) ?? null;
  const layoutMode = parent?.layoutMode ?? 'absolute';
  const childIds = new Set(parentChildren.map((item) => item.id));
  const sortedChildren = [...parentChildren].sort((a, b) => {
    if (layoutMode === 'flex' && (parent?.flexDirection ?? 'row') === 'row') {
      return a.x - b.x || a.y - b.y || a.id.localeCompare(b.id);
    }

    return a.y - b.y || a.x - b.x || a.id.localeCompare(b.id);
  });

  const nextElements: WireframeElement[] = [];
  let inserted = false;

  for (const element of elements) {
    if (!childIds.has(element.id)) {
      nextElements.push(element);
      continue;
    }

    if (!inserted) {
      nextElements.push(...sortedChildren);
      inserted = true;
    }
  }

  return nextElements;
}

function collectClipboard(elements: WireframeElement[], selectedIds: string[]) {
  const lookup = buildElementLookup(elements);
  const roots = filterSelectionToTopLevel(selectedIds, elements);
  const ids = new Set<string>();

  for (const id of roots) {
    const root = lookup.get(id);
    if (!root || root.type === 'artboard') {
      continue;
    }

    ids.add(id);
    for (const descendant of getDescendants(elements, id)) {
      ids.add(descendant.id);
    }
  }

  const clipboard = elements.filter((element) => ids.has(element.id)).map(cloneElement);
  return { roots, clipboard };
}

function getClipboardRoots(clipboard: WireframeElement[]) {
  const clipboardIds = new Set(clipboard.map((element) => element.id));
  return clipboard.filter(
    (element) => element.parentId == null || !clipboardIds.has(element.parentId)
  );
}

function buildPasteResult(
  elements: WireframeElement[],
  clipboard: WireframeElement[],
  selectedIds: string[],
  activeArtboardId: string,
  options: { anchorPoint?: Point; targetParentId?: string | null } = {}
) {
  if (!clipboard.length) {
    return null;
  }

  const lookup = buildElementLookup(elements);
  const clipboardLookup = buildElementLookup(clipboard);
  const clipboardRoots = getClipboardRoots(clipboard);

  if (!clipboardRoots.length) {
    return null;
  }

  const rootType = clipboardRoots[0].type;
  const requestedParent = options.targetParentId ? lookup.get(options.targetParentId) ?? null : null;
  const targetParent =
    requestedParent &&
    PARENTABLE_TYPES.has(requestedParent.type) &&
    canContainChild(requestedParent.type, rootType)
      ? requestedParent
      : getSelectionParent(elements, selectedIds, activeArtboardId);
  const resolvedTargetParent =
    targetParent && canContainChild(targetParent.type, rootType)
      ? targetParent
      : (() => {
          const activeArtboard = getActiveArtboard(elements, activeArtboardId);
          return activeArtboard && canContainChild(activeArtboard.type, rootType) ? activeArtboard : null;
        })();
  if (!resolvedTargetParent) {
    return null;
  }
  const targetParentAbsolute = resolvedTargetParent
    ? getAbsolutePosition(resolvedTargetParent, lookup)
    : { x: 0, y: 0 };

  const nextElements = [...elements];
  const pastedRootIds: string[] = [];
  const clipboardBounds = calculateBoundingBox(
    clipboard.map((element) => element.id),
    clipboardLookup
  );
  const anchorPoint =
    options.anchorPoint ??
    (resolvedTargetParent
      ? {
          x: targetParentAbsolute.x + resolvedTargetParent.width / 2,
          y: targetParentAbsolute.y + resolvedTargetParent.height / 2,
        }
      : clipboardBounds
        ? {
            x: clipboardBounds.x,
            y: clipboardBounds.y,
          }
        : { x: 0, y: 0 });
  const deltaX = anchorPoint.x - (clipboardBounds?.x ?? 0);
  const deltaY = anchorPoint.y - (clipboardBounds?.y ?? 0);

  clipboardRoots.forEach((root) => {
    const subtreeIds = new Set<string>([root.id]);
    for (const descendant of getDescendants(clipboard, root.id)) {
      subtreeIds.add(descendant.id);
    }

    const subtree = clipboard.filter((element) => subtreeIds.has(element.id));
    const idMap = new Map<string, string>();
    for (const element of subtree) {
      idMap.set(element.id, generateId());
    }

    const absoluteByOldId = new Map<string, { x: number; y: number }>();
    for (const element of subtree) {
      const absolute = getAbsolutePosition(element, clipboardLookup);
      absoluteByOldId.set(element.id, {
        x: absolute.x + deltaX,
        y: absolute.y + deltaY,
      });
    }

    const rootNewId = idMap.get(root.id);
    if (!rootNewId) {
      return;
    }

    const rootAbsolute = absoluteByOldId.get(root.id);
    if (!rootAbsolute) {
      return;
    }

    nextElements.push({
      ...root,
      id: rootNewId,
      parentId: resolvedTargetParent ? resolvedTargetParent.id : null,
      x: resolvedTargetParent ? rootAbsolute.x - targetParentAbsolute.x : rootAbsolute.x,
      y: resolvedTargetParent ? rootAbsolute.y - targetParentAbsolute.y : rootAbsolute.y,
    });
    pastedRootIds.push(rootNewId);

    for (const element of subtree) {
      if (element.id === root.id) {
        continue;
      }

      const newId = idMap.get(element.id);
      const newParentId = element.parentId
        ? idMap.get(element.parentId) ?? resolvedTargetParent?.id ?? null
        : resolvedTargetParent?.id ?? null;
      const absolute = absoluteByOldId.get(element.id);
      const parentAbsolute = element.parentId
        ? absoluteByOldId.get(element.parentId) ?? rootAbsolute
        : targetParentAbsolute;

      if (!newId || !absolute) {
        continue;
      }

      nextElements.push({
        ...element,
        id: newId,
        parentId: newParentId,
        x: absolute.x - parentAbsolute.x,
        y: absolute.y - parentAbsolute.y,
      });
    }
  });

  return {
    elements: nextElements,
    selectedIds: pastedRootIds,
  };
}

export const useStore = create<AppState>()(
  persist(
    temporal(
      (set, get) => ({
        elements: [
          {
            id: ROOT_ARTBOARD_ID,
            type: 'artboard',
            name: getDefaultElementName('artboard', 1),
            x: 0,
            y: 0,
            width: 1440,
            height: 900,
            parentId: null,
            layoutMode: 'flex',
            gapX: 0,
            gapY: 0,
            padding: 0,
            flexDirection: 'column',
            flexWrap: 'nowrap',
            justifyContent: 'start',
            alignItems: 'start',
            alignContent: 'start',
            widthUnit: 'px',
            heightUnit: 'px',
            inheritTypography: true,
            inheritSpacing: false,
            inheritFill: false,
            inheritBorder: false,
            inheritAlignment: true,
          },
        ],
        designTokens: defaultDesignTokens,
        selectedIds: [],
        activeArtboardId: ROOT_ARTBOARD_ID,
        clipboard: [],
        pageDragEnabled: false,
        fitToPageRevision: 0,

        addElement: (type) =>
          set((state) => {
            const activeArtboard = getActiveArtboard(state.elements, state.activeArtboardId);
            if (!activeArtboard) {
              return state;
            }

            const selectedParent = getSelectionParent(
              state.elements,
              state.selectedIds,
              state.activeArtboardId
            );
            const parent =
              selectedParent &&
              PARENTABLE_TYPES.has(selectedParent.type) &&
              canContainChild(selectedParent.type, type)
                ? selectedParent
                : activeArtboard && canContainChild(activeArtboard.type, type)
                  ? activeArtboard
                  : null;

            if (!parent) {
              return state;
            }

            const defaults = defaultElementSize[type];
            const childId = generateId();
            const x = Math.max(0, parent.width / 2 - defaults.width / 2);
            const y = Math.max(0, parent.height / 2 - defaults.height / 2);

            const newElement: WireframeElement = {
              id: childId,
              type,
              name: getDefaultElementName(type),
              parentId: parent.id,
              x,
              y,
              width: defaults.width,
              height: defaults.height,
              widthUnit: defaults.widthUnit ?? 'px',
              heightUnit: defaults.heightUnit ?? 'px',
              text: defaults.text,
              placeholder: defaults.placeholder,
              value: defaults.value,
              disabled: defaults.disabled,
              required: defaults.required,
              alt: defaults.alt,
              objectFit: defaults.objectFit,
              aspectRatio: defaults.aspectRatio,
              checked: defaults.checked,
              layoutMode: defaults.layoutMode ?? 'absolute',
              gapX: defaults.gapX ?? 0,
              gapY: defaults.gapY ?? 0,
              padding: defaults.padding ?? 0,
              flexDirection: defaults.flexDirection ?? 'row',
              flexWrap: defaults.flexWrap ?? 'nowrap',
              justifyContent: defaults.justifyContent ?? 'start',
              alignItems: defaults.alignItems ?? 'start',
              alignContent: defaults.alignContent ?? 'start',
              gridColumns: defaults.gridColumns,
              gridRows: defaults.gridRows,
              gridAutoFlow: defaults.gridAutoFlow ?? 'row',
              gridJustifyItems: defaults.gridJustifyItems ?? 'start',
              gridAlignItems: defaults.gridAlignItems ?? 'start',
              fontSize: defaults.fontSize,
              fontWeight: defaults.fontWeight,
              textAlign: defaults.textAlign,
              headingVariant: defaults.headingVariant,
              inputVariant: defaults.inputVariant,
              inheritTypography: defaults.inheritTypography ?? true,
              inheritSpacing: defaults.inheritSpacing ?? false,
              inheritFill: defaults.inheritFill ?? false,
              inheritBorder: defaults.inheritBorder ?? false,
              inheritAlignment: defaults.inheritAlignment ?? true,
              labelFor: defaults.labelFor,
              buttonVariant: defaults.buttonVariant,
              buttonSize: defaults.buttonSize,
              buttonDisabled: defaults.buttonDisabled,
              buttonIconPlacement: defaults.buttonIconPlacement,
              buttonIconName: defaults.buttonIconName,
              borderRadius: defaults.borderRadius,
              strokeWidth: defaults.strokeWidth,
              fill: defaults.fill,
              fillToken: defaults.fillToken,
              spacingToken: defaults.spacingToken,
              borderRadiusToken: defaults.borderRadiusToken,
              fontSizeToken: defaults.fontSizeToken,
              textColorToken: defaults.textColorToken,
              strokeColorToken: defaults.strokeColorToken,
              iconName: defaults.iconName,
              rows: defaults.rows,
              cols: defaults.cols,
            };

            const nextElements = [...state.elements, newElement];

            return {
              elements: normalizeContainers(nextElements, [parent.id]),
              selectedIds: [newElement.id],
            };
          }),

        createMasterComponent: (selectedId) =>
          set((state) => {
            const lookup = buildElementLookup(state.elements);
            const element = lookup.get(selectedId);
            if (
              !element ||
              element.type === 'artboard' ||
              element.type === 'instance' ||
              element.isMasterComponent
            ) {
              return state;
            }

            const subtreeIds = new Set<string>([selectedId]);
            for (const descendant of getDescendants(state.elements, selectedId)) {
              subtreeIds.add(descendant.id);
            }

            const subtree = state.elements.filter((item) => subtreeIds.has(item.id));
            if (!subtree.length) {
              return state;
            }

            const idMap = new Map<string, string>();
            for (const item of subtree) {
              idMap.set(item.id, generateId());
            }

            const masterRootId = idMap.get(selectedId);
            if (!masterRootId) {
              return state;
            }

            const masterElements = subtree.map((item) => {
              const newId = idMap.get(item.id);
              if (!newId) {
                return item;
              }

              const newParentId = item.id === selectedId ? null : item.parentId ? idMap.get(item.parentId) ?? null : null;

              return {
                ...item,
                id: newId,
                parentId: newParentId,
                x: item.id === selectedId ? 0 : item.x,
                y: item.id === selectedId ? 0 : item.y,
                isMasterComponent: item.id === selectedId ? true : item.isMasterComponent,
              };
            });

            return {
              elements: [...state.elements, ...masterElements],
              selectedIds: [masterRootId],
            };
          }),

        createInstance: (masterId) =>
          set((state) => {
            const lookup = buildElementLookup(state.elements);
            const master = lookup.get(masterId);
            if (!master || !master.isMasterComponent || master.type === 'artboard') {
              return state;
            }

            const activeArtboard = getActiveArtboard(state.elements, state.activeArtboardId);
            if (!activeArtboard) {
              return state;
            }

            const selectedParent = getSelectionParent(
              state.elements,
              state.selectedIds,
              state.activeArtboardId
            );
            const parent =
              selectedParent &&
              PARENTABLE_TYPES.has(selectedParent.type) &&
              selectedParent.id !== master.id &&
              !isDescendantOf(selectedParent.id, master.id, lookup)
                ? selectedParent
                : activeArtboard;

            const x = Math.max(0, parent.width / 2 - master.width / 2);
            const y = Math.max(0, parent.height / 2 - master.height / 2);

            const instance: WireframeElement = {
              id: generateId(),
              type: 'instance',
              name: `${master.name ?? getDefaultElementName(master.type)} Instance`,
              parentId: parent.id,
              x,
              y,
              width: master.width,
              height: master.height,
              masterComponentId: master.id,
            };

            return {
              elements: [...state.elements, instance],
              selectedIds: [instance.id],
            };
          }),

        createPage: (template = 'blank') =>
          set((state) => {
            const position = getNextPagePosition(state.elements);
            const pageCount = state.elements.filter((element) => element.type === 'artboard').length + 1;
            const size =
              template === 'mobile'
                ? ARTBOARD_PRESETS.find((preset) => preset.name.startsWith('Mobile')) ?? ARTBOARD_PRESETS[2]
                : ARTBOARD_PRESETS[0];
            const newPage: WireframeElement = {
              id: generateId(),
              type: 'artboard',
              name: getDefaultElementName('artboard', pageCount),
              x: position.x,
              y: position.y,
              width: size.width,
              height: size.height,
              parentId: null,
              layoutMode: 'flex',
              gapX: 0,
              gapY: 0,
              padding: 0,
              flexDirection: 'column',
              flexWrap: 'nowrap',
              justifyContent: 'start',
              alignItems: 'start',
              alignContent: 'start',
              widthUnit: 'px',
              heightUnit: 'px',
              inheritTypography: true,
              inheritSpacing: false,
              inheritFill: false,
              inheritBorder: false,
              inheritAlignment: true,
            };

            const templateChildren = buildPageTemplate(template, newPage);

            return {
              elements: [...state.elements, newPage, ...templateChildren],
              activeArtboardId: newPage.id,
              selectedIds: [newPage.id],
            };
          }),

        setActivePage: (pageId) =>
          set((state) => {
            const page = state.elements.find(
              (element) => element.id === pageId && element.type === 'artboard'
            );
            if (!page) {
              return state;
            }

            return {
              activeArtboardId: page.id,
              selectedIds: [page.id],
            };
          }),

        deletePage: (pageId) =>
          set((state) => {
            const pages = state.elements.filter((element) => element.type === 'artboard');
            if (pages.length <= 1) {
              return state;
            }

            const page = state.elements.find(
              (element) => element.id === pageId && element.type === 'artboard'
            );
            if (!page) {
              return state;
            }

            const idsToDelete = new Set<string>([page.id]);
            for (const descendant of getDescendants(state.elements, page.id)) {
              const element = state.elements.find((item) => item.id === descendant.id) ?? null;
              if (element?.isMasterComponent) {
                continue;
              }

              idsToDelete.add(descendant.id);
            }

            const remainingPages = pages.filter((item) => item.id !== page.id);
            const nextActivePage = remainingPages[0] ?? null;

            return {
              elements: state.elements.filter((element) => !idsToDelete.has(element.id)),
              activeArtboardId: nextActivePage?.id ?? ROOT_ARTBOARD_ID,
              selectedIds: nextActivePage ? [nextActivePage.id] : [],
            };
          }),

        setPageDragEnabled: (enabled) =>
          set(() => ({
            pageDragEnabled: enabled,
          })),

        setPreviewPreset: (preset) =>
          set((state) => {
            const size =
              preset === 'tablet'
                ? ARTBOARD_PRESETS[1]
                : preset === 'mobile'
                  ? ARTBOARD_PRESETS[2]
                  : ARTBOARD_PRESETS[0];
            const activePage = getActiveArtboard(state.elements, state.activeArtboardId);
            if (!activePage) {
              return state;
            }

            const elements = state.elements.map((element) =>
              element.id === activePage.id
                ? {
                    ...element,
                    width: size.width,
                    height: size.height,
                  }
                : element
            );

            return {
              elements,
              fitToPageRevision: state.fitToPageRevision + 1,
            };
          }),

        zoomToFit: () =>
          set((state) => ({
            fitToPageRevision: state.fitToPageRevision + 1,
          })),

        updateToken: (group, key, value) =>
          set((state) => ({
            designTokens: {
              ...state.designTokens,
              [group]: {
                ...state.designTokens[group],
                [key]: value,
              },
            },
          })),

        setSelection: (ids) =>
          set((state) => ({
            selectedIds: uniqueExistingIds(ids, state.elements),
          })),

        selectElement: (id, additive = false) =>
          set((state) => {
            if (!id) {
              return { selectedIds: [] };
            }

            const exists = state.selectedIds.includes(id);
            if (!additive) {
              return { selectedIds: [id] };
            }

            const nextSelectedIds = exists
              ? state.selectedIds.filter((selectedId) => selectedId !== id)
              : [...state.selectedIds, id];

            return {
              selectedIds: uniqueExistingIds(nextSelectedIds, state.elements),
            };
          }),

        copy: () =>
          set((state) => {
            const { clipboard } = collectClipboard(state.elements, state.selectedIds);
            if (!clipboard.length) {
              return state;
            }

            return { clipboard };
          }),

        paste: () =>
          set((state) => {
            const pasted = buildPasteResult(
              state.elements,
              state.clipboard,
              state.selectedIds,
              state.activeArtboardId
            );

            if (!pasted) {
              return state;
            }

            return {
              elements: pasted.elements,
              selectedIds: pasted.selectedIds,
            };
          }),

        pasteAt: (position, targetParentId) =>
          set((state) => {
            const pasted = buildPasteResult(
              state.elements,
              state.clipboard,
              state.selectedIds,
              state.activeArtboardId,
              { anchorPoint: position, targetParentId }
            );

            if (!pasted) {
              return state;
            }

            return {
              elements: pasted.elements,
              selectedIds: pasted.selectedIds,
            };
          }),

        duplicate: () =>
          set((state) => {
            const { clipboard } = collectClipboard(state.elements, state.selectedIds);
            const pasted = buildPasteResult(
              state.elements,
              clipboard,
              state.selectedIds,
              state.activeArtboardId
            );

            if (!pasted) {
              return state;
            }

            return {
              elements: pasted.elements,
              selectedIds: pasted.selectedIds,
              clipboard,
            };
          }),

        copySelected: () => get().copy(),
        pasteClipboard: () => get().paste(),

        moveSelectedSibling: (direction) =>
          set((state) => ({
            elements: moveSelectedSiblingInState(state.elements, state.selectedIds, direction),
          })),

        updateElement: (id, newProps) =>
          set((state) => {
            const nextElements = state.elements.map((element) =>
              element.id === id ? { ...element, ...newProps } : element
            );

            return {
              elements: normalizeContainers(nextElements, [id]),
            };
          }),

        transformElement: (id, x, y, width, height, scaleX, scaleY) =>
          set((state) => {
            const element = state.elements.find((item) => item.id === id);
            if (!element) {
              return state;
            }

            if (isAutoLayoutContainer(element)) {
              const nextElements = state.elements.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      x,
                      y,
                      width,
                      height,
                    }
                  : item
              );

              return {
                elements: normalizeContainers(nextElements, [id]),
              };
            }

            if (
              element.type === 'container' ||
              element.type === 'box' ||
              isSemanticContainerType(element.type)
            ) {
              const resized = state.elements.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      x,
                      y,
                      width,
                      height,
                    }
                  : item
              );

              const scaled = scaleSubtree(resized, id, scaleX, scaleY).map((item) =>
                item.id === id
                  ? {
                      ...item,
                      x,
                      y,
                      width,
                      height,
                    }
                  : item
              );

              return {
                elements: normalizeContainers(scaled, [id]),
              };
            }

            return {
              elements: normalizeContainers(state.elements.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      x,
                      y,
                      width,
                      height,
                    }
                  : item
              ), [id]),
            };
          }),

        reparentElement: (id, parentId, x, y) =>
          set((state) => {
            const lookup = buildElementLookup(state.elements);
            const element = lookup.get(id);
            if (!element) {
              return state;
            }

            const previousParentId = element.parentId;
            const targetParent = parentId ? lookup.get(parentId) ?? null : null;
            if (targetParent && (targetParent.id === id || isDescendantOf(targetParent.id, id, lookup))) {
              return state;
            }
            if (targetParent && !canContainChild(targetParent.type, element.type)) {
              return state;
            }

            const nextParentId = targetParent ? targetParent.id : null;
            const nextPosition = toRelativePosition({ x, y }, nextParentId, lookup);
            const nextElements = state.elements.map((item) =>
              item.id === id
                ? {
                    ...item,
                    parentId: nextParentId,
                    x: nextPosition.x,
                    y: nextPosition.y,
                  }
                : item
            );

            let reordered = nextElements;
            if (previousParentId) {
              reordered = reorderChildrenByPosition(reordered, previousParentId);
            }
            if (nextParentId) {
              reordered = reorderChildrenByPosition(reordered, nextParentId);
            }

            return {
              elements: normalizeContainers(reordered, [
                id,
                previousParentId ?? '',
                nextParentId ?? '',
              ]),
            };
          }),

        deleteSelected: () =>
          set((state) => {
            const selectedIds = uniqueExistingIds(state.selectedIds, state.elements);
            if (selectedIds.length === 1) {
              const selectedElement = state.elements.find((element) => element.id === selectedIds[0]) ?? null;
              if (selectedElement?.type === 'artboard') {
                const pages = state.elements.filter((element) => element.type === 'artboard');
                if (pages.length <= 1) {
                  return state;
                }

                const idsToDelete = new Set<string>([selectedElement.id]);
                for (const descendant of getDescendants(state.elements, selectedElement.id)) {
                  idsToDelete.add(descendant.id);
                }

                const remainingPages = pages.filter((item) => item.id !== selectedElement.id);
                const nextActivePage = remainingPages[0] ?? null;

                return {
                  elements: state.elements.filter((element) => !idsToDelete.has(element.id)),
                  activeArtboardId: nextActivePage?.id ?? ROOT_ARTBOARD_ID,
                  selectedIds: nextActivePage ? [nextActivePage.id] : [],
                };
              }
            }

            const rootArtboard = getRootArtboard(state.elements);
            const removableIds = filterSelectionToTopLevel(selectedIds, state.elements);
            if (!removableIds.length) {
              return state;
            }

            const idsToDelete = new Set<string>();
            const affectedParentIds = new Set<string>();
            for (const id of removableIds) {
              if (id === rootArtboard?.id) {
                continue;
              }

              const element = state.elements.find((item) => item.id === id) ?? null;
              if (element?.isMasterComponent) {
                continue;
              }

              if (element?.parentId) {
                affectedParentIds.add(element.parentId);
              }

              idsToDelete.add(id);
              for (const descendant of getDescendants(state.elements, id)) {
                const descendantElement = state.elements.find((item) => item.id === descendant.id) ?? null;
                if (descendantElement?.isMasterComponent) {
                  continue;
                }

                idsToDelete.add(descendant.id);
              }
            }

            if (!idsToDelete.size) {
              return state;
            }
            const nextElements = state.elements.filter((element) => !idsToDelete.has(element.id));

            return {
              elements: normalizeContainers(nextElements, [...affectedParentIds]),
              selectedIds: [],
            };
          }),

        changeArtboardSize: (width, height) =>
          set((state) => {
            const nextElements = state.elements.map((element) =>
              element.type === 'artboard' && element.id === state.activeArtboardId
                ? { ...element, width, height }
                : element
            );

            return {
              elements: normalizeContainers(nextElements, [state.activeArtboardId]),
            };
          }),

        groupSelected: (selectedIds) =>
          set((state) => {
            const topLevelSelection = filterSelectionToTopLevel(selectedIds, state.elements);
            if (topLevelSelection.length < 2) {
              return state;
            }

            const lookup = buildElementLookup(state.elements);
            const selectedElements = topLevelSelection
              .map((id) => lookup.get(id))
              .filter((element): element is WireframeElement => Boolean(element));

            if (selectedElements.length < 2) {
              return state;
            }

            const bounds = calculateBoundingBox(topLevelSelection, lookup);
            if (!bounds) {
              return state;
            }

            const parentId = selectedElements[0]?.parentId ?? ROOT_ARTBOARD_ID;
            const parent = parentId ? lookup.get(parentId) ?? null : null;
            if (parent?.type === 'ul') {
              return state;
            }
            const parentAbsolute = parent ? getAbsolutePosition(parent, lookup) : { x: 0, y: 0 };

            const groupId = generateId();
            const wrapperType = 'div';
            const newContainer: WireframeElement = {
              id: groupId,
              type: wrapperType,
              name: getDefaultElementName(wrapperType),
              parentId,
              x: bounds.x - parentAbsolute.x,
              y: bounds.y - parentAbsolute.y,
              width: bounds.width,
              height: bounds.height,
              layoutMode: 'flex',
              gapX: 0,
              gapY: 0,
              padding: 0,
              flexDirection: 'column',
              flexWrap: 'nowrap',
              justifyContent: 'start',
              alignItems: 'start',
              alignContent: 'start',
              widthUnit: 'px',
              heightUnit: 'px',
            };

            const nextElements = state.elements.map((element) => {
              if (!topLevelSelection.includes(element.id)) {
                return element;
              }

              const absolute = getAbsolutePosition(element, lookup);
              return {
                ...element,
                parentId: groupId,
                x: absolute.x - bounds.x,
                y: absolute.y - bounds.y,
              };
            });

            const insertAt = Math.max(
              0,
              Math.min(
                ...topLevelSelection.map((id) =>
                  state.elements.findIndex((element) => element.id === id)
                )
              )
            );

            const withContainer = [...nextElements];
            withContainer.splice(insertAt, 0, newContainer);

            return {
              elements: normalizeContainers(withContainer, [parentId]),
              selectedIds: [groupId],
            };
          }),

        ungroupSelected: (containerId) =>
          set((state) => {
            const lookup = buildElementLookup(state.elements);
            const container = lookup.get(containerId);
            if (
              !container ||
              (container.type !== 'container' &&
                container.type !== 'div' &&
                container.type !== 'ul' &&
                container.type !== 'li')
            ) {
              return state;
            }

            const children = getElementChildren(state.elements, containerId);
            const parentId = container.parentId;
            const parent = parentId ? lookup.get(parentId) ?? null : null;
            const parentAbsolute = parent ? getAbsolutePosition(parent, lookup) : { x: 0, y: 0 };

            const promotedIds = new Set(children.map((child) => child.id));
            const updatedElements = state.elements
              .filter((element) => element.id !== containerId)
              .map((element) => {
                if (!promotedIds.has(element.id)) {
                  return element;
                }

                const absolute = getAbsolutePosition(element, lookup);
                return {
                  ...element,
                  parentId,
                  x: absolute.x - parentAbsolute.x,
                  y: absolute.y - parentAbsolute.y,
                };
              });

            return {
              elements: normalizeContainers(updatedElements, [parentId ?? '']),
              selectedIds: children.map((child) => child.id),
            };
          }),
      }),
      {
        partialize: (state) => ({
          elements: state.elements,
          activeArtboardId: state.activeArtboardId,
          pageDragEnabled: state.pageDragEnabled,
        }),
      }
    ),
      {
        name: 'wireframe-storage',
        partialize: (state) => ({
          elements: state.elements,
          activeArtboardId: state.activeArtboardId,
          pageDragEnabled: state.pageDragEnabled,
        }),
      }
    )
  );
