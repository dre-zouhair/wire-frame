import { Group, Rect } from 'react-konva';
import type { GroupShapeProps } from './types';
import { resolveFill, resolveStrokeColor, resolveStrokeWidth } from './shared';

export default function ContainerShape({
  element,
  isSelected,
  draggable = true,
  interactive = true,
  onDragEnd,
  onSelect,
  children,
  visualBounds,
}: GroupShapeProps) {
  const isInteractive = interactive !== false;
  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      draggable={draggable && isInteractive}
      listening={isInteractive}
      onDragStart={(e) => {
        e.cancelBubble = true;
      }}
      onDragMove={(e) => {
        e.cancelBubble = true;
      }}
      onDragEnd={(e) => {
        if (e.target.id() !== element.id) {
          e.cancelBubble = true;
          return;
        }

        onDragEnd(element.id, e.target.x(), e.target.y());
      }}
    >
      <Rect
        x={visualBounds?.x ?? 0}
        y={visualBounds?.y ?? 0}
        width={visualBounds?.width ?? element.width}
        height={visualBounds?.height ?? element.height}
        fill={resolveFill(element.fill)}
        stroke={resolveStrokeColor(element, isSelected, '#9ca3af')}
        strokeWidth={resolveStrokeWidth(element.strokeWidth, 1)}
        dash={[6, 4]}
        cornerRadius={element.borderRadius ?? 0}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect(element.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect(element.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
        }}
      />
      {children}
    </Group>
  );
}
