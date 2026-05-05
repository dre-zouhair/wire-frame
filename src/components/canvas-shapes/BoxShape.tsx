import { Group, Rect } from 'react-konva';
import type { GroupShapeProps } from './types';
import { resolveFill, resolveStrokeWidth } from './shared';

export default function BoxShape({
  element,
  isSelected,
  draggable = true,
  onDragEnd,
  onSelect,
  children,
  visualBounds,
}: GroupShapeProps) {
  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      draggable={draggable}
      onDragStart={(e) => {
        e.cancelBubble = true;
      }}
      onDragMove={(e) => {
        e.cancelBubble = true;
      }}
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
    >
      <Rect
        x={visualBounds?.x ?? 0}
        y={visualBounds?.y ?? 0}
        width={visualBounds?.width ?? element.width}
        height={visualBounds?.height ?? element.height}
        fill={resolveFill(element.fill)}
        stroke={isSelected ? '#111111' : '#333333'}
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
