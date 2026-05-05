import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import {
  calculateBoundingBox,
  buildElementLookup,
  findBestDropParent,
  getAbsolutePosition,
  getDescendants,
  getElementChildren,
  isDescendantOf,
  scaleSubtree,
  toRelativePosition,
} from '@/utils/geometry';

export type ElementType =
  | 'artboard'
  | 'container'
  | 'box'
  | 'divider'
  | 'heading'
  | 'text'
  | 'button'
  | 'input'
  | 'checkbox'
  | 'dropdown'
  | 'image-placeholder'
  | 'icon'
  | 'avatar'
  | 'table';

export type LayoutMode = 'absolute' | 'vertical' | 'horizontal';
export type Alignment = 'start' | 'center' | 'end';
export type FillStyle = 'solid' | 'light' | 'transparent';
export type FontSize = 12 | 16 | 24 | 36 | 48;
export type FontWeight = 'normal' | 'bold';
export type TextAlign = 'left' | 'center' | 'right';
export type IconName = 'menu' | 'search' | 'user' | 'home' | 'settings';

export interface WireframeElement {
  id: string;
  type: ElementType;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId: string | null;
  text?: string;
  checked?: boolean;
  layoutMode?: LayoutMode;
  gap?: number;
  padding?: number;
  align?: Alignment;
  fontSize?: FontSize;
  fontWeight?: FontWeight;
  textAlign?: TextAlign;
  borderRadius?: number;
  strokeWidth?: number;
  fill?: FillStyle;
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
const PARENTABLE_TYPES = new Set<ElementType>(['artboard', 'container', 'box']);

interface AppState {
  elements: WireframeElement[];
  selectedIds: string[];
  activeArtboardId: string;
  clipboard: WireframeElement[];
  addElement: (type: Exclude<ElementType, 'artboard'>) => void;
  createPage: () => void;
  setActivePage: (pageId: string) => void;
  deletePage: (pageId: string) => void;
  setSelection: (ids: string[]) => void;
  selectElement: (id: string | null, additive?: boolean) => void;
  copy: () => void;
  paste: () => void;
  duplicate: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
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
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 11);
}

const defaultElementSize: Record<
  Exclude<ElementType, 'artboard'>,
  Pick<WireframeElement, 'width' | 'height'> &
    Partial<
      Pick<
        WireframeElement,
        | 'text'
        | 'checked'
        | 'fontSize'
        | 'fontWeight'
        | 'textAlign'
        | 'borderRadius'
        | 'strokeWidth'
        | 'fill'
        | 'iconName'
        | 'rows'
        | 'cols'
      >
    >
> = {
  container: { width: 240, height: 160, borderRadius: 0, strokeWidth: 1, fill: 'transparent' },
  box: { width: 240, height: 160, borderRadius: 0, strokeWidth: 1, fill: 'transparent' },
  divider: { width: 240, height: 1, strokeWidth: 1 },
  heading: {
    width: 320,
    height: 48,
    text: 'Heading',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  text: {
    width: 240,
    height: 28,
    text: 'Text',
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
  },
  button: {
    width: 140,
    height: 40,
    text: 'Button',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRadius: 6,
    strokeWidth: 1,
    fill: 'solid',
  },
  input: {
    width: 240,
    height: 40,
    text: 'Input',
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
    borderRadius: 4,
    strokeWidth: 1,
    fill: 'transparent',
  },
  checkbox: {
    width: 180,
    height: 24,
    text: 'Checkbox',
    checked: false,
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
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
  },
  'image-placeholder': { width: 240, height: 160 },
  icon: { width: 32, height: 32, iconName: 'search' },
  avatar: { width: 48, height: 48 },
  table: { width: 320, height: 180, rows: 3, cols: 3 },
};

function getDefaultElementName(type: ElementType, index = 1) {
  switch (type) {
    case 'artboard':
      return `Page ${index}`;
    case 'container':
      return 'Container';
    case 'box':
      return 'Box';
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
    case 'checkbox':
      return 'Checkbox';
    case 'dropdown':
      return 'Dropdown';
    case 'image-placeholder':
      return 'Image';
    case 'icon':
      return 'Icon';
    case 'avatar':
      return 'Avatar';
    case 'table':
      return 'Table';
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
    (element.type === 'artboard' || element.type === 'container' || element.type === 'box')
  );
}

function normalizeContainers(elements: WireframeElement[], _changedIds: string[]) {
  return elements;
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
  activeArtboardId: string
) {
  if (!clipboard.length) {
    return null;
  }

  const lookup = buildElementLookup(elements);
  const targetParent = getSelectionParent(elements, selectedIds, activeArtboardId);
  const targetParentAbsolute = targetParent ? getAbsolutePosition(targetParent, lookup) : { x: 0, y: 0 };
  const clipboardLookup = buildElementLookup(clipboard);
  const clipboardRoots = getClipboardRoots(clipboard);

  if (!clipboardRoots.length) {
    return null;
  }

  const nextElements = [...elements];
  const pastedRootIds: string[] = [];

  clipboardRoots.forEach((root, index) => {
    const subtreeIds = new Set<string>([root.id]);
    for (const descendant of getDescendants(clipboard, root.id)) {
      subtreeIds.add(descendant.id);
    }

    const subtree = clipboard.filter((element) => subtreeIds.has(element.id));
    const idMap = new Map<string, string>();
    for (const element of subtree) {
      idMap.set(element.id, generateId());
    }

    const offset = 20 * (index + 1);
    const absoluteByOldId = new Map<string, { x: number; y: number }>();
    for (const element of subtree) {
      const absolute = getAbsolutePosition(element, clipboardLookup);
      absoluteByOldId.set(element.id, {
        x: absolute.x + offset,
        y: absolute.y + offset,
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
      parentId: targetParent ? targetParent.id : null,
      x: targetParent ? rootAbsolute.x - targetParentAbsolute.x : rootAbsolute.x,
      y: targetParent ? rootAbsolute.y - targetParentAbsolute.y : rootAbsolute.y,
    });
    pastedRootIds.push(rootNewId);

    for (const element of subtree) {
      if (element.id === root.id) {
        continue;
      }

      const newId = idMap.get(element.id);
      const newParentId = element.parentId ? idMap.get(element.parentId) ?? targetParent?.id ?? null : targetParent?.id ?? null;
      const absolute = absoluteByOldId.get(element.id);
      const parentAbsolute = element.parentId ? absoluteByOldId.get(element.parentId) ?? rootAbsolute : targetParentAbsolute;

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
          },
        ],
        selectedIds: [],
        activeArtboardId: ROOT_ARTBOARD_ID,
        clipboard: [],

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
            const parent = selectedParent && PARENTABLE_TYPES.has(selectedParent.type)
              ? selectedParent
              : activeArtboard;

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
              text: defaults.text,
              checked: defaults.checked,
              layoutMode: defaults.layoutMode ?? 'absolute',
              gap: defaults.gap ?? 0,
              padding: defaults.padding ?? 0,
              align: defaults.align ?? 'start',
              fontSize: defaults.fontSize,
              fontWeight: defaults.fontWeight,
              textAlign: defaults.textAlign,
              borderRadius: defaults.borderRadius,
              strokeWidth: defaults.strokeWidth,
              fill: defaults.fill,
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

        createPage: () =>
          set((state) => {
            const position = getNextPagePosition(state.elements);
            const pageCount = state.elements.filter((element) => element.type === 'artboard').length + 1;
            const newPage: WireframeElement = {
              id: generateId(),
              type: 'artboard',
              name: getDefaultElementName('artboard', pageCount),
              x: position.x,
              y: position.y,
              width: 1440,
              height: 900,
              parentId: null,
            };

            return {
              elements: [...state.elements, newPage],
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

            if (element.type === 'container' || element.type === 'box') {
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

            return {
              elements: normalizeContainers(nextElements, [
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
              if (element?.parentId) {
                affectedParentIds.add(element.parentId);
              }

              idsToDelete.add(id);
              for (const descendant of getDescendants(state.elements, id)) {
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
            const parentAbsolute = parent ? getAbsolutePosition(parent, lookup) : { x: 0, y: 0 };

            const groupId = generateId();
            const newContainer: WireframeElement = {
              id: groupId,
              type: 'container',
              name: getDefaultElementName('container'),
              parentId,
              x: bounds.x - parentAbsolute.x,
              y: bounds.y - parentAbsolute.y,
              width: bounds.width,
              height: bounds.height,
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
            if (!container || container.type !== 'container') {
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
        partialize: (state) => ({ elements: state.elements }),
      }
    ),
    {
      name: 'wireframe-storage',
      partialize: (state) => ({
        elements: state.elements,
        activeArtboardId: state.activeArtboardId,
      }),
    }
  )
);
