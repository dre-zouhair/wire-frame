import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactNode, RefObject } from 'react';
import { Group, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import { useStore, type ElementType, type WireframeElement } from '@/store/useStore';
import BoxShape from './canvas-shapes/BoxShape';
import ButtonShape from './canvas-shapes/ButtonShape';
import IconShape from './canvas-shapes/IconShape';
import AvatarShape from './canvas-shapes/AvatarShape';
import TableShape from './canvas-shapes/TableShape';
import CheckboxShape from './canvas-shapes/CheckboxShape';
import ContainerShape from './canvas-shapes/ContainerShape';
import DividerShape from './canvas-shapes/DividerShape';
import DropdownShape from './canvas-shapes/DropdownShape';
import HeadingShape from './canvas-shapes/HeadingShape';
import ImagePlaceholderShape from './canvas-shapes/ImagePlaceholderShape';
import InputShape from './canvas-shapes/InputShape';
import TextareaShape from './canvas-shapes/TextareaShape';
import RadioShape from './canvas-shapes/RadioShape';
import ToggleShape from './canvas-shapes/ToggleShape';
import LabelShape from './canvas-shapes/LabelShape';
import TextShape from './canvas-shapes/TextShape';
import ArtboardShape from './canvas-shapes/ArtboardShape';
import {
  buildElementLookup,
  findBestDropParent,
  getAbsolutePosition,
  getDescendants,
  getElementChildren,
  rectsIntersect,
} from '@/utils/geometry';
import {
  calculateAutoLayout,
  getDirectLayoutChildren,
  isAutoLayoutContainer,
} from '@/utils/layoutMath';
import { resolveInheritedElement } from '@/utils/inheritance';
import { applyDesignTokens } from '@/utils/design-tokens';
import { isSemanticContainerType } from '@/utils/semantic-html';

interface CanvasAreaProps {
  width: number;
  height: number;
  stageRef: RefObject<Konva.Stage | null>;
}

const leafShapes: Partial<Record<Exclude<ElementType, 'artboard' | 'container'>, ComponentType<any>>> =
  {
    box: BoxShape,
    div: ContainerShape,
    section: ContainerShape,
    header: ContainerShape,
    main: ContainerShape,
    footer: ContainerShape,
    nav: ContainerShape,
    aside: ContainerShape,
    article: ContainerShape,
    ul: ContainerShape,
    li: BoxShape,
    divider: DividerShape,
    heading: HeadingShape,
    text: TextShape,
    button: ButtonShape,
    input: InputShape,
    textarea: TextareaShape,
    checkbox: CheckboxShape,
    radio: RadioShape,
    toggle: ToggleShape,
    dropdown: DropdownShape,
    label: LabelShape,
    'image-placeholder': ImagePlaceholderShape,
    img: ImagePlaceholderShape,
    icon: IconShape,
    avatar: AvatarShape,
    table: TableShape,
  };

const transformableTypes = new Set<ElementType>([
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
  'divider',
  'heading',
  'text',
  'button',
  'input',
  'textarea',
  'checkbox',
  'radio',
  'toggle',
  'dropdown',
  'label',
  'image-placeholder',
  'img',
  'icon',
  'avatar',
  'table',
]);

const pasteTargetTypes = new Set<ElementType>([
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

interface Point {
  x: number;
  y: number;
}

interface SelectionRect extends Point {
  width: number;
  height: number;
}

interface GuideLine {
  orientation: 'vertical' | 'horizontal';
  position: number;
  label?: string;
  distance?: number;
}

type SnapCandidate = {
  delta: number;
  position: number;
  label?: string;
};

interface InlineEditorState {
  id: string;
  field: 'text' | 'value' | 'placeholder';
  value: string;
}

const SNAP_THRESHOLD = 8;
const TEXT_TYPES = new Set<ElementType>([
  'heading',
  'text',
  'button',
  'input',
  'textarea',
  'dropdown',
  'label',
]);

function isTextLikeElement(element: WireframeElement | null | undefined) {
  return Boolean(element && TEXT_TYPES.has(element.type));
}

function getBaselineOffset(element: WireframeElement) {
  const fontSize = element.fontSize ?? 16;
  return Math.max(10, Math.round(fontSize * 0.78));
}

function toWorldPoint(pointer: Point, stagePos: Point, scale: number): Point {
  return {
    x: (pointer.x - stagePos.x) / scale,
    y: (pointer.y - stagePos.y) / scale,
  };
}

function buildSelectionRect(start: Point, end: Point): SelectionRect {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

function buildVisibleRectMap(elements: WireframeElement[]) {
  const lookup = buildElementLookup(elements);
  const rawRects = new Map<string, { x: number; y: number; width: number; height: number }>();

  const visit = (element: WireframeElement, parentAbsolute = { x: 0, y: 0 }) => {
    const parent = element.parentId ? lookup.get(element.parentId) ?? null : null;
    const layoutPositions =
      parent && isAutoLayoutContainer(parent)
        ? calculateAutoLayout(parent, getDirectLayoutChildren(parent, elements))
        : null;
    const relative = layoutPositions?.get(element.id) ?? { x: element.x, y: element.y };

    const absolute = {
      x: parentAbsolute.x + relative.x,
      y: parentAbsolute.y + relative.y,
    };

    rawRects.set(element.id, {
      x: absolute.x,
      y: absolute.y,
      width: element.width,
      height: element.height,
    });

    for (const child of getElementChildren(elements, element.id)) {
      visit(child, absolute);
    }
  };

  for (const element of elements.filter((item) => item.type === 'artboard')) {
    visit(element);
  }

  const renderedRects = new Map(rawRects);
  const visualBoundsCache = new Map<string, { x: number; y: number; width: number; height: number }>();

  const computeVisualBounds = (element: WireframeElement) => {
    const cached = visualBoundsCache.get(element.id);
    if (cached) {
      return cached;
    }

    const ownBounds = rawRects.get(element.id);
    if (
      !ownBounds ||
      (element.type !== 'container' &&
        element.type !== 'box' &&
        !isSemanticContainerType(element.type))
    ) {
      const fallback = ownBounds ?? { x: 0, y: 0, width: element.width, height: element.height };
      visualBoundsCache.set(element.id, fallback);
      return fallback;
    }

    let minX = 0;
    let minY = 0;
    let maxX = element.width;
    let maxY = element.height;

    for (const child of getElementChildren(elements, element.id)) {
      const childBounds = rawRects.get(child.id);
      if (!childBounds) {
        continue;
      }
      const childRelative = {
        x: childBounds.x - ownBounds.x,
        y: childBounds.y - ownBounds.y,
      };

      minX = Math.min(minX, childRelative.x);
      minY = Math.min(minY, childRelative.y);
      maxX = Math.max(maxX, childRelative.x + childBounds.width);
      maxY = Math.max(maxY, childRelative.y + childBounds.height);
    }

    const bounds = {
      x: ownBounds.x + minX,
      y: ownBounds.y + minY,
      width: maxX - minX,
      height: maxY - minY,
    };
    visualBoundsCache.set(element.id, bounds);
    return bounds;
  };

  for (const element of elements.filter((item) => item.type === 'artboard')) {
    computeVisualBounds(element);
  }

  for (const element of elements.filter((item) => {
    return item.type === 'container' || item.type === 'box' || isSemanticContainerType(item.type);
  })) {
    const bounds = computeVisualBounds(element);
    renderedRects.set(element.id, bounds);
  }

  return renderedRects;
}

function getVisualBoundsForContainer(
  element: WireframeElement,
  elements: WireframeElement[],
  renderedRects: Map<string, { x: number; y: number; width: number; height: number }>
) {
  const ownBounds = renderedRects.get(element.id) ?? {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  };

  let minX = 0;
  let minY = 0;
  let maxX = element.width;
  let maxY = element.height;

  for (const child of getElementChildren(elements, element.id)) {
    const rect = renderedRects.get(child.id);
    if (!rect) {
      continue;
    }

    const childRelativeX = rect.x - ownBounds.x;
    const childRelativeY = rect.y - ownBounds.y;
    minX = Math.min(minX, childRelativeX);
    minY = Math.min(minY, childRelativeY);
    maxX = Math.max(maxX, childRelativeX + rect.width);
    maxY = Math.max(maxY, childRelativeY + rect.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export default function CanvasArea({ width, height, stageRef }: CanvasAreaProps) {
  const elements = useStore((state) => state.elements);
  const designTokens = useStore((state) => state.designTokens);
  const selectedIds = useStore((state) => state.selectedIds);
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const pageDragEnabled = useStore((state) => state.pageDragEnabled);
  const fitToPageRevision = useStore((state) => state.fitToPageRevision);
  const setSelection = useStore((state) => state.setSelection);
  const setActivePage = useStore((state) => state.setActivePage);
  const selectElement = useStore((state) => state.selectElement);
  const copy = useStore((state) => state.copy);
  const pasteAt = useStore((state) => state.pasteAt);
  const groupSelected = useStore((state) => state.groupSelected);
  const ungroupSelected = useStore((state) => state.ungroupSelected);
  const transformElement = useStore((state) => state.transformElement);
  const reparentElement = useStore((state) => state.reparentElement);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState<Point>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ pointer: Point; stagePos: Point } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<Point | null>(null);
  const [snapGuides, setSnapGuides] = useState<GuideLine[]>([]);
  const [inlineEditor, setInlineEditor] = useState<InlineEditorState | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    clientX: number;
    clientY: number;
    worldPoint: Point;
    targetParentId: string;
  } | null>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const activeArtboardRef = useRef<WireframeElement | null>(null);

  const elementById = useMemo(
    () => new Map(elements.map((element) => [element.id, element] as const)),
    [elements]
  );

  const rootArtboards = useMemo(
    () => elements.filter((element) => element.type === 'artboard'),
    [elements]
  );

  const activeArtboard =
    rootArtboards.find((element) => element.id === activeArtboardId) ?? rootArtboards[0] ?? null;

  useEffect(() => {
    activeArtboardRef.current = activeArtboard;
  }, [activeArtboard]);

  const renderedRects = useMemo(
    () => buildVisibleRectMap(elements),
    [elements]
  );

  useEffect(() => {
    if (width <= 0 || height <= 0) {
      return;
    }

    const currentActiveArtboard = activeArtboardRef.current;
    if (!currentActiveArtboard) {
      return;
    }

    setStagePos({
      x: width / 2 - (currentActiveArtboard.x + currentActiveArtboard.width / 2) * stageScale,
      y: height / 2 - (currentActiveArtboard.y + currentActiveArtboard.height / 2) * stageScale,
    });
  }, [activeArtboardId, height, width]);

  useEffect(() => {
    if (!activeArtboard || width <= 0 || height <= 0) {
      return;
    }

    const fitScale = Math.min(
      (width - 80) / Math.max(activeArtboard.width, 1),
      (height - 80) / Math.max(activeArtboard.height, 1),
      1
    );

    setStageScale(fitScale);
    setStagePos({
      x: width / 2 - (activeArtboard.x + activeArtboard.width / 2) * fitScale,
      y: height / 2 - (activeArtboard.y + activeArtboard.height / 2) * fitScale,
    });
  }, [fitToPageRevision, activeArtboard, width, height]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ' && !event.repeat) {
        const target = event.target as HTMLElement | null;
        const tagName = target?.tagName?.toLowerCase();
        const isInput =
          tagName === 'input' || tagName === 'textarea' || Boolean(target?.isContentEditable);
        if (!isInput) {
          event.preventDefault();
          setIsSpacePressed(true);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        setIsSpacePressed(false);
        setIsPanning(false);
        setPanStart(null);
        setSnapGuides([]);
      }
    };

    const handleBlur = () => {
      setIsSpacePressed(false);
      setIsPanning(false);
      setPanStart(null);
      setSnapGuides([]);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = () => {
      setContextMenu(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    stage.container().style.cursor = isSpacePressed
      ? isPanning
        ? 'grabbing'
        : 'grab'
      : isSelecting
        ? 'crosshair'
        : 'default';
  }, [isPanning, isSelecting, isSpacePressed, stageRef, stagePos, stageScale]);

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) {
      return;
    }

    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter((node): node is Konva.Node => Boolean(node))
      .filter((node) => {
        const element = elementById.get(node.id());
        if (!element || element.type === 'artboard' || !transformableTypes.has(element.type)) {
          return false;
        }
        return true;
      });

    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [elementById, selectedIds, stageRef, stagePos, stageScale]);

  useEffect(() => {
    if (!isPanning && !isSelecting) {
      return;
    }

    const handleMove = () => {
      const stage = stageRef.current;
      if (!stage) {
        return;
      }

      const pointer = stage.getPointerPosition();
      if (!pointer) {
        return;
      }

      if (isPanning && panStart) {
        setStagePos({
          x: panStart.stagePos.x + pointer.x - panStart.pointer.x,
          y: panStart.stagePos.y + pointer.y - panStart.pointer.y,
        });
        return;
      }

      if (isSelecting && selectionStart) {
        setSelectionCurrent(toWorldPoint(pointer, stagePos, stageScale));
      }
    };

    const handleUp = () => {
      if (isSelecting && selectionStart && selectionCurrent) {
        const selectionRect = buildSelectionRect(selectionStart, selectionCurrent);
        const selected = elements
          .filter((element) => {
            if (element.type === 'artboard') {
              return false;
            }

            const bounds = renderedRects.get(element.id);
            if (!bounds) {
              return false;
            }

            return rectsIntersect(bounds, selectionRect);
          })
          .map((element) => element.id);

        setSelection(selected);
      }

      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionCurrent(null);
      setIsPanning(false);
      setPanStart(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [
    elements,
    isPanning,
    isSelecting,
    panStart,
    selectionCurrent,
    selectionStart,
    renderedRects,
    setSelection,
    stagePos,
    stageRef,
    stageScale,
  ]);

  const handleSelect = (id: string, additive: boolean) => {
    const element = elementById.get(id);
    if (element?.type === 'artboard') {
      setActivePage(id);
      return;
    }

    selectElement(id, additive);
  };

  const commitInlineEdit = () => {
    if (!inlineEditor) {
      return;
    }

    const element = elementById.get(inlineEditor.id);
    if (!element) {
      setInlineEditor(null);
      return;
    }

    if (element.type === 'input' || element.type === 'textarea') {
      if (inlineEditor.field === 'value') {
        useStore.getState().updateElement(element.id, { value: inlineEditor.value });
      } else {
        useStore.getState().updateElement(element.id, {
          placeholder: inlineEditor.value,
          text: inlineEditor.value,
        });
      }
    } else {
      useStore.getState().updateElement(element.id, { text: inlineEditor.value });
    }

    setInlineEditor(null);
  };

  const startInlineEdit = (id: string) => {
    const element = elementById.get(id);
    if (!element) {
      return;
    }

    const field =
      element.type === 'input' || element.type === 'textarea'
        ? (element.value ? 'value' : 'placeholder')
        : 'text';
    const value =
      field === 'value'
        ? element.value ?? ''
        : field === 'placeholder'
          ? element.placeholder ?? element.text ?? ''
          : element.text ?? element.name ?? '';

    setInlineEditor({ id, field, value });
  };

  const handleDragMove = (id: string, x: number, y: number, target?: any) => {
    const element = elementById.get(id);
    if (!element || element.type === 'artboard') {
      return;
    }

    const parent = element.parentId ? elementById.get(element.parentId) ?? null : null;
    const parentAbsolute = parent ? getAbsolutePosition(parent, elementById) : { x: 0, y: 0 };
    let absX = parentAbsolute.x + x;
    let absY = parentAbsolute.y + y;
    const movingRect = {
      x: absX,
      y: absY,
      width: element.width,
      height: element.height,
    };
    const movingBaseline = absY + getBaselineOffset(element);
    const movingTextLike = isTextLikeElement(element);
    const candidates: GuideLine[] = [];
    const movingDescendants = new Set(getDescendants(elements, id).map((item) => item.id));
    let bestVertical: SnapCandidate | null = null;
    let bestHorizontal: SnapCandidate | null = null;

    const considerCandidate = (
      orientation: 'vertical' | 'horizontal',
      targetPosition: number,
      movingPosition: number,
      label?: string
    ) => {
      const delta = targetPosition - movingPosition;
      if (Math.abs(delta) > SNAP_THRESHOLD) {
        return;
      }

      const candidate = {
        delta,
        position: targetPosition,
        label: `${Math.abs(Math.round(delta))} px${label ? ` • ${label}` : ''}`,
      };
      if (orientation === 'vertical') {
        if (!bestVertical || Math.abs(delta) < Math.abs(bestVertical.delta)) {
          bestVertical = candidate;
        }
      } else if (!bestHorizontal || Math.abs(delta) < Math.abs(bestHorizontal.delta)) {
        bestHorizontal = candidate;
      }
    };

    for (const [candidateId, rect] of renderedRects.entries()) {
      if (candidateId === id || movingDescendants.has(candidateId)) {
        continue;
      }

      const candidate = elementById.get(candidateId);
      if (!candidate) {
        continue;
      }

      const padding = candidate.padding ?? 0;
      const edgesX = [rect.x, rect.x + rect.width / 2, rect.x + rect.width];
      const edgesY = [rect.y, rect.y + rect.height / 2, rect.y + rect.height];

      if (padding > 0) {
        edgesX.push(rect.x + padding, rect.x + rect.width - padding);
        edgesY.push(rect.y + padding, rect.y + rect.height - padding);
      }

      const movingEdgesX = [movingRect.x, movingRect.x + movingRect.width / 2, movingRect.x + movingRect.width];
      const movingEdgesY = [movingRect.y, movingRect.y + movingRect.height / 2, movingRect.y + movingRect.height];

      for (const targetX of edgesX) {
        for (const movingX of movingEdgesX) {
          considerCandidate('vertical', targetX, movingX);
        }
      }

      for (const targetY of edgesY) {
        for (const movingY of movingEdgesY) {
          considerCandidate('horizontal', targetY, movingY);
        }
      }

      if (movingTextLike && isTextLikeElement(candidate)) {
        const targetBaseline = rect.y + getBaselineOffset(candidate);
        considerCandidate('horizontal', targetBaseline, movingBaseline, 'baseline');
      }
    }

    if (bestVertical !== null) {
      const verticalGuide = bestVertical as SnapCandidate;
      absX += verticalGuide.delta;
      movingRect.x = absX;
      candidates.push({
        orientation: 'vertical',
        position: verticalGuide.position,
        label: verticalGuide.label,
        distance: Math.abs(verticalGuide.delta),
      });
    }

    if (bestHorizontal !== null) {
      const horizontalGuide = bestHorizontal as SnapCandidate;
      absY += horizontalGuide.delta;
      movingRect.y = absY;
      candidates.push({
        orientation: 'horizontal',
        position: horizontalGuide.position,
        label: horizontalGuide.label ?? (movingTextLike ? 'baseline' : undefined),
        distance: Math.abs(horizontalGuide.delta),
      });
    }

    const nextX = absX - parentAbsolute.x;
    const nextY = absY - parentAbsolute.y;
    if (target?.position) {
      target.position({ x: nextX, y: nextY });
    }

    setSnapGuides(candidates);
  };

  const handleBackgroundMouseDown = (event: Konva.KonvaEventObject<MouseEvent>) => {
    if (event.evt.button !== 0) {
      return;
    }

    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return;
    }

    if (isSpacePressed) {
      setIsPanning(true);
      setPanStart({ pointer, stagePos });
      return;
    }

    setSelection([]);
    setIsSelecting(true);
    const worldPoint = toWorldPoint(pointer, stagePos, stageScale);
    setSelectionStart(worldPoint);
    setSelectionCurrent(worldPoint);
  };

  const openContextMenu = (event: Konva.KonvaEventObject<PointerEvent>) => {
    event.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return;
    }

    const worldPoint = toWorldPoint(pointer, stagePos, stageScale);
    let node: Konva.Node | null = event.target;
    let targetParentId = activeArtboardRef.current?.id ?? activeArtboardId;

    while (node) {
      const element = elementById.get(node.id());
      if (element && pasteTargetTypes.has(element.type)) {
        targetParentId = element.id;
        break;
      }

      node = node.getParent();
    }

    setContextMenu({
      clientX: event.evt.clientX,
      clientY: event.evt.clientY,
      worldPoint,
      targetParentId,
    });
  };

  const handleDragEnd = (id: string, x: number, y: number) => {
    setSnapGuides([]);
    const element = elementById.get(id);
    if (!element) {
      return;
    }

    if (element.type === 'artboard') {
      useStore.getState().updateElement(id, { x, y });
      return;
    }

    const currentParent = element.parentId ? elementById.get(element.parentId) ?? null : null;
    const currentParentAbsolute = currentParent
      ? getAbsolutePosition(currentParent, elementById)
      : { x: 0, y: 0 };
    const absoluteBounds = {
      x: currentParentAbsolute.x + x,
      y: currentParentAbsolute.y + y,
      width: element.width,
      height: element.height,
    };

    const dropParent = findBestDropParent(elements, id, absoluteBounds);
    reparentElement(id, dropParent?.id ?? null, absoluteBounds.x, absoluteBounds.y);
  };

  const handleTransformEnd = () => {
    if (selectedIds.length !== 1) {
      return;
    }

    const node = stageRef.current?.findOne(`#${selectedIds[0]}`);
    if (!node) {
      return;
    }

    const element = elementById.get(node.id());
    if (!element) {
      return;
    }

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const nextWidth = Math.max(12, element.width * scaleX);
    const nextHeight = Math.max(12, element.height * scaleY);
    transformElement(element.id, node.x(), node.y(), nextWidth, nextHeight, scaleX, scaleY);
  };

  interface RenderOptions {
    interactive?: boolean;
    keyPrefix?: string;
    visitedMasters?: Set<string>;
    forcePosition?: Point;
  }

  const renderNode = (
    sourceElement: WireframeElement,
    parent: WireframeElement | null = null,
    options: RenderOptions = {}
  ): ReactNode => {
    const interactive = options.interactive !== false;
    const keyPrefix = options.keyPrefix ? `${options.keyPrefix}__` : '';
    const isSelected = selectedIds.includes(sourceElement.id);
    const resolvedElement = applyDesignTokens(
      resolveInheritedElement(sourceElement, elements, elementById),
      designTokens
    );
    const parentChildren = parent ? getElementChildren(elements, parent.id) : [];
    const parentLayoutPositions =
      parent && isAutoLayoutContainer(parent) ? calculateAutoLayout(parent, parentChildren) : null;
    const displayPosition = options.forcePosition ?? parentLayoutPositions?.get(sourceElement.id) ?? {
      x: sourceElement.x,
      y: sourceElement.y,
    };

    if (resolvedElement.type === 'instance') {
      const master =
        resolvedElement.masterComponentId
          ? elementById.get(resolvedElement.masterComponentId) ?? null
          : null;

      return (
        <Group
          key={`${keyPrefix}${resolvedElement.id}`}
          id={`${keyPrefix}${resolvedElement.id}`}
          x={displayPosition.x}
          y={displayPosition.y}
          listening
          draggable={false}
          onClick={(e) => {
            e.cancelBubble = true;
            handleSelect(resolvedElement.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            handleSelect(resolvedElement.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
          }}
        >
          <Rect
            x={0}
            y={0}
            width={resolvedElement.width}
            height={resolvedElement.height}
            fill="rgba(255,255,255,0.001)"
            stroke={isSelected ? '#111111' : '#a855f7'}
            strokeWidth={1}
            dash={[6, 4]}
          />
          {master && !options.visitedMasters?.has(master.id)
            ? renderNode(master, null, {
                interactive: false,
                keyPrefix: `${keyPrefix}${resolvedElement.id}`,
                visitedMasters: new Set([...(options.visitedMasters ?? []), master.id]),
                forcePosition: { x: 0, y: 0 },
              })
            : null}
        </Group>
      );
    }

    const children = getElementChildren(elements, sourceElement.id);
    const displayElement = {
      ...resolvedElement,
      id: `${keyPrefix}${sourceElement.id}`,
      x: displayPosition.x,
      y: displayPosition.y,
    };
    const draggable = interactive && sourceElement.type !== 'instance';

    if (sourceElement.type === 'artboard') {
      const childOptions: RenderOptions = {
        ...options,
        forcePosition: undefined,
      };
      return (
        <ArtboardShape
          key={displayElement.id}
          element={displayElement}
          isSelected={isSelected}
          draggable={draggable && pageDragEnabled}
          interactive={interactive}
          onDragEnd={handleDragEnd}
          onDragMove={handleDragMove}
          onSelect={handleSelect}
        >
          {children.map((child) => renderNode(child, sourceElement, childOptions))}
        </ArtboardShape>
      );
    }

    if (
      sourceElement.type === 'container' ||
      (isSemanticContainerType(sourceElement.type) && sourceElement.type !== 'li')
    ) {
      const childOptions: RenderOptions = {
        ...options,
        forcePosition: undefined,
      };
      return (
        <ContainerShape
          key={displayElement.id}
          element={displayElement}
          isSelected={isSelected}
          draggable={draggable}
          interactive={interactive}
          onDragEnd={handleDragEnd}
          onDragMove={handleDragMove}
          onSelect={handleSelect}
          visualBounds={getVisualBoundsForContainer(sourceElement, elements, renderedRects)}
        >
          {children.map((child) => renderNode(child, sourceElement, childOptions))}
        </ContainerShape>
      );
    }

    if (sourceElement.type === 'box' || sourceElement.type === 'li') {
      const childOptions: RenderOptions = {
        ...options,
        forcePosition: undefined,
      };
      return (
        <BoxShape
          key={displayElement.id}
          element={displayElement}
          isSelected={isSelected}
          draggable={draggable}
          interactive={interactive}
          onDragEnd={handleDragEnd}
          onDragMove={handleDragMove}
          onSelect={handleSelect}
          visualBounds={getVisualBoundsForContainer(sourceElement, elements, renderedRects)}
        >
          {children.map((child) => renderNode(child, sourceElement, childOptions))}
        </BoxShape>
      );
    }

    const ShapeComponent = leafShapes[sourceElement.type];
    if (!ShapeComponent) {
      return null;
    }

    return (
      <ShapeComponent
        key={displayElement.id}
        element={displayElement}
        isSelected={isSelected}
        draggable={draggable}
        interactive={interactive}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
        onSelect={handleSelect}
        onEditStart={startInlineEdit}
      />
    );
  };

  const selectionRect =
    isSelecting && selectionStart && selectionCurrent
      ? buildSelectionRect(selectionStart, selectionCurrent)
      : null;

  const selectedElement = selectedIds[0] ? elementById.get(selectedIds[0]) ?? null : null;
  const editingElement = inlineEditor ? elementById.get(inlineEditor.id) ?? null : null;
  const editingAbsolute = editingElement ? getAbsolutePosition(editingElement, elementById) : null;
  const canGroup = selectedIds.filter((id) => {
    const element = elementById.get(id);
    return Boolean(element && element.type !== 'artboard');
  }).length >= 2 &&
    (!selectedElement || selectedElement.parentId == null || elementById.get(selectedElement.parentId)?.type !== 'ul');
  const canUngroup =
    (selectedElement?.type === 'container' ||
      selectedElement?.type === 'div' ||
      selectedElement?.type === 'ul' ||
      selectedElement?.type === 'li') &&
    selectedIds.length === 1;

  const closeContextMenu = () => setContextMenu(null);

  const handleExportPng = async () => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const previousSelection = selectedIds;
    setSelection([]);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    try {
      const cropX = activeArtboard?.x ?? 0;
      const cropY = activeArtboard?.y ?? 0;
      const cropWidth = activeArtboard?.width ?? stage.width();
      const cropHeight = activeArtboard?.height ?? stage.height();
      const dataUrl = stage.toDataURL({
        pixelRatio: 3,
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'wireframe-export.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setSelection(previousSelection);
    }
  };

  return (
    <div className="relative h-full w-full">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={(event) => {
          if (event.evt.button !== 0) {
            return;
          }

          if (event.target === event.target.getStage()) {
            handleBackgroundMouseDown(event);
          }
        }}
        onContextMenu={openContextMenu}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={(event) => {
          event.evt.preventDefault();

          const stage = stageRef.current;
          const pointer = stage?.getPointerPosition();
          if (!stage || !pointer) {
            return;
          }

          const oldScale = stageScale;
          const pointerWorld = {
            x: (pointer.x - stagePos.x) / oldScale,
            y: (pointer.y - stagePos.y) / oldScale,
          };

          const scaleBy = 1.1;
          const direction = event.evt.deltaY > 0 ? 1 : -1;
          const nextScale = direction > 0 ? oldScale / scaleBy : oldScale * scaleBy;
          const clampedScale = Math.max(0.2, Math.min(4, nextScale));

          setStageScale(clampedScale);
          setStagePos({
            x: pointer.x - pointerWorld.x * clampedScale,
            y: pointer.y - pointerWorld.y * clampedScale,
          });
        }}
      >
        <Layer>
          {rootArtboards.map((artboard) => renderNode(artboard, null))}
          {selectionRect ? (
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              fill="rgba(59,130,246,0.15)"
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          ) : null}
          {snapGuides.map((guide, index) => (
            <Group key={`${guide.orientation}-${guide.position}-${index}`} listening={false}>
              <Line
                points={
                  guide.orientation === 'vertical'
                    ? [guide.position, -10000, guide.position, 10000]
                    : [-10000, guide.position, 10000, guide.position]
                }
                stroke="#2563eb"
                strokeWidth={1}
                dash={[6, 4]}
                listening={false}
              />
              {guide.label ? (
                <Rect
                  x={guide.orientation === 'vertical' ? guide.position + 4 : 8}
                  y={guide.orientation === 'vertical' ? 8 : guide.position + 4}
                  width={64}
                  height={18}
                  fill="#2563eb"
                  cornerRadius={4}
                  listening={false}
                />
              ) : null}
              {guide.label ? (
                <Text
                  x={guide.orientation === 'vertical' ? guide.position + 8 : 12}
                  y={guide.orientation === 'vertical' ? 10 : guide.position + 6}
                  width={56}
                  height={14}
                  text={`${Math.round(guide.distance ?? 0)} px`}
                  fontSize={10}
                  fontFamily="Arial, sans-serif"
                  fill="#ffffff"
                  listening={false}
                />
              ) : null}
            </Group>
          ))}
          <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            flipEnabled={false}
            enabledAnchors={
              selectedIds.length === 1
                ? [
                    'top-left',
                    'top-center',
                    'top-right',
                    'middle-right',
                    'bottom-right',
                    'bottom-center',
                    'bottom-left',
                    'middle-left',
                  ]
                : []
            }
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 12 || newBox.height < 12) {
                return oldBox;
              }

              return newBox;
            }}
            onTransformEnd={handleTransformEnd}
          />
        </Layer>
      </Stage>

      {inlineEditor && editingElement ? (
        <div
          className="absolute z-40"
          style={{
            left: stagePos.x + (editingAbsolute?.x ?? 0) * stageScale,
            top: stagePos.y + (editingAbsolute?.y ?? 0) * stageScale,
            width: editingElement.width * stageScale,
            height: editingElement.height * stageScale,
          }}
        >
          {editingElement.type === 'textarea' ? (
            <textarea
              autoFocus
              value={inlineEditor.value}
              onChange={(event) =>
                setInlineEditor((current) =>
                  current ? { ...current, value: event.target.value } : current
                )
              }
              onBlur={commitInlineEdit}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setInlineEditor(null);
                }
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  commitInlineEdit();
                }
              }}
              className="h-full w-full resize-none rounded border border-blue-400 bg-white px-2 py-1 text-sm outline-none shadow-lg"
            />
          ) : (
            <input
              autoFocus
              value={inlineEditor.value}
              onChange={(event) =>
                setInlineEditor((current) =>
                  current ? { ...current, value: event.target.value } : current
                )
              }
              onBlur={commitInlineEdit}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setInlineEditor(null);
                }
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitInlineEdit();
                }
              }}
              className="h-full w-full rounded border border-blue-400 bg-white px-2 py-1 text-sm outline-none shadow-lg"
            />
          )}
        </div>
      ) : null}

      {contextMenu ? (
        <div
          className="fixed z-50 min-w-40 rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
          style={{
            left: Math.min(contextMenu.clientX, window.innerWidth - 180),
            top: Math.min(contextMenu.clientY, window.innerHeight - 140),
          }}
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onContextMenu={(event) => {
            event.preventDefault();
          }}
        >
          <button
            type="button"
            onClick={() => {
              copy();
              closeContextMenu();
            }}
            className="w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={() => {
              pasteAt(contextMenu.worldPoint, contextMenu.targetParentId);
              setSelection([]);
              closeContextMenu();
            }}
            className="w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Paste
          </button>
          <button
            type="button"
            onClick={() => {
              pasteAt(contextMenu.worldPoint, contextMenu.targetParentId);
              setSelection([]);
              closeContextMenu();
            }}
            className="w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Paste on Top
          </button>
          <button
            type="button"
            onClick={() => {
              void handleExportPng();
              closeContextMenu();
            }}
            className="w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Export as Image
          </button>
          <button
            type="button"
            disabled={!canGroup}
            onClick={() => {
              groupSelected(selectedIds);
              closeContextMenu();
            }}
            className="w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Group
          </button>
          <button
            type="button"
            disabled={!canUngroup}
            onClick={() => {
              if (
                selectedElement?.type === 'container' ||
                selectedElement?.type === 'div' ||
                selectedElement?.type === 'ul' ||
                selectedElement?.type === 'li'
              ) {
                ungroupSelected(selectedElement.id);
              }
              closeContextMenu();
            }}
            className="w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ungroup
          </button>
        </div>
      ) : null}
    </div>
  );
}
