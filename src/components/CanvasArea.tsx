import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactNode, RefObject } from 'react';
import { Layer, Rect, Stage, Transformer } from 'react-konva';
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
import TextShape from './canvas-shapes/TextShape';
import ArtboardShape from './canvas-shapes/ArtboardShape';
import {
  buildElementLookup,
  findBestDropParent,
  getAbsolutePosition,
  getDescendants,
  getElementChildren,
  getLayoutChildPosition,
  isAutoLayoutContainer,
  rectsIntersect,
} from '@/utils/geometry';

interface CanvasAreaProps {
  width: number;
  height: number;
  stageRef: RefObject<Konva.Stage | null>;
}

const leafShapes: Partial<Record<Exclude<ElementType, 'artboard' | 'container'>, ComponentType<any>>> =
  {
    box: BoxShape,
    divider: DividerShape,
    heading: HeadingShape,
    text: TextShape,
    button: ButtonShape,
    input: InputShape,
    checkbox: CheckboxShape,
    dropdown: DropdownShape,
    'image-placeholder': ImagePlaceholderShape,
    icon: IconShape,
    avatar: AvatarShape,
    table: TableShape,
  };

const transformableTypes = new Set<ElementType>([
  'container',
  'box',
  'divider',
  'heading',
  'text',
  'button',
  'input',
  'checkbox',
  'dropdown',
  'image-placeholder',
  'icon',
  'avatar',
  'table',
]);

interface Point {
  x: number;
  y: number;
}

interface SelectionRect extends Point {
  width: number;
  height: number;
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
  const rects = new Map<string, { x: number; y: number; width: number; height: number }>();

  const visit = (element: WireframeElement, parentAbsolute = { x: 0, y: 0 }) => {
    const parent = element.parentId ? lookup.get(element.parentId) ?? null : null;
    const siblings = parent ? getElementChildren(elements, parent.id) : [];
    const index = siblings.findIndex((child) => child.id === element.id);
    const relative =
      parent && isAutoLayoutContainer(parent) && index >= 0
        ? getLayoutChildPosition(parent, siblings, element, index)
        : { x: element.x, y: element.y };

    const absolute = {
      x: parentAbsolute.x + relative.x,
      y: parentAbsolute.y + relative.y,
    };

    rects.set(element.id, {
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

  for (const element of elements.filter(
    (item) => item.type === 'container' || item.type === 'box'
  )) {
    const bounds = getVisualBoundsForContainer(element, elements, rects);
    const absolute = rects.get(element.id);
    if (!absolute) {
      continue;
    }

    rects.set(element.id, {
      x: absolute.x + bounds.x,
      y: absolute.y + bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
  }

  return rects;
}

function getVisualBoundsForContainer(
  element: WireframeElement,
  elements: WireframeElement[],
  renderedRects: Map<string, { x: number; y: number; width: number; height: number }>
) {
  const lookup = buildElementLookup(elements);
  const elementAbsolute = getAbsolutePosition(element, lookup);

  let minX = 0;
  let minY = 0;
  let maxX = element.width;
  let maxY = element.height;

  for (const descendant of getDescendants(elements, element.id)) {
    const rect = renderedRects.get(descendant.id);
    if (!rect) {
      continue;
    }

    minX = Math.min(minX, rect.x - elementAbsolute.x);
    minY = Math.min(minY, rect.y - elementAbsolute.y);
    maxX = Math.max(maxX, rect.x - elementAbsolute.x + rect.width);
    maxY = Math.max(maxY, rect.y - elementAbsolute.y + rect.height);
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
  const selectedIds = useStore((state) => state.selectedIds);
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const setSelection = useStore((state) => state.setSelection);
  const setActivePage = useStore((state) => state.setActivePage);
  const selectElement = useStore((state) => state.selectElement);
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
      }
    };

    const handleBlur = () => {
      setIsSpacePressed(false);
      setIsPanning(false);
      setPanStart(null);
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

        const parent = element.parentId ? elementById.get(element.parentId) ?? null : null;
        return !parent || (parent.layoutMode ?? 'absolute') === 'absolute';
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

  const handleDragEnd = (id: string, x: number, y: number) => {
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

  const renderNode = (element: WireframeElement, parent: WireframeElement | null = null): ReactNode => {
    const isSelected = selectedIds.includes(element.id);
    const children = getElementChildren(elements, element.id);
    const siblings = parent ? getElementChildren(elements, parent.id) : [];
    const index = siblings.findIndex((child) => child.id === element.id);
    const displayElement =
      parent && isAutoLayoutContainer(parent) && index >= 0
        ? {
            ...element,
            ...getLayoutChildPosition(parent, siblings, element, index),
          }
        : element;
    const draggable = !parent || (parent.layoutMode ?? 'absolute') === 'absolute';

    if (element.type === 'artboard') {
      return (
        <ArtboardShape
          key={element.id}
          element={displayElement}
          isSelected={isSelected}
          draggable={draggable}
          onDragEnd={handleDragEnd}
          onSelect={handleSelect}
        >
          {children.map((child) => renderNode(child, element))}
        </ArtboardShape>
      );
    }

    if (element.type === 'container') {
      return (
        <ContainerShape
          key={element.id}
          element={displayElement}
          isSelected={isSelected}
          draggable={draggable}
          onDragEnd={handleDragEnd}
          onSelect={handleSelect}
          visualBounds={getVisualBoundsForContainer(element, elements, renderedRects)}
        >
          {children.map((child) => renderNode(child, element))}
        </ContainerShape>
      );
    }

    if (element.type === 'box') {
      return (
        <BoxShape
          key={element.id}
          element={displayElement}
          isSelected={isSelected}
          draggable={draggable}
          onDragEnd={handleDragEnd}
          onSelect={handleSelect}
          visualBounds={getVisualBoundsForContainer(element, elements, renderedRects)}
        >
          {children.map((child) => renderNode(child, element))}
        </BoxShape>
      );
    }

    const ShapeComponent = leafShapes[element.type];
    if (!ShapeComponent) {
      return null;
    }

    return (
      <ShapeComponent
        key={element.id}
        element={displayElement}
        isSelected={isSelected}
        draggable={draggable}
        onDragEnd={handleDragEnd}
        onSelect={handleSelect}
      />
    );
  };

  const selectionRect =
    isSelecting && selectionStart && selectionCurrent
      ? buildSelectionRect(selectionStart, selectionCurrent)
      : null;

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onMouseDown={(event) => {
        if (event.target === event.target.getStage()) {
          handleBackgroundMouseDown(event);
        }
      }}
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
  );
}
