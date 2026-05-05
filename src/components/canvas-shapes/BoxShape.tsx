import { Group, Rect } from 'react-konva';
import type { GroupShapeProps } from './types';
import { resolveFill, resolveStrokeColor, resolveStrokeWidth } from './shared';

export default function BoxShape({
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
        stroke={resolveStrokeColor(element, isSelected, '#333333')}
        strokeWidth={resolveStrokeWidth(element.strokeWidth, 1)}
        cornerRadius={element.borderRadius ?? 0}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect(element.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect(element.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
        }}
        shadowEnabled={isSelected}
        shadowColor="#000000"
        shadowBlur={12}
        shadowOpacity={0.12}
      />
      {children}
    </Group>
  );
}
