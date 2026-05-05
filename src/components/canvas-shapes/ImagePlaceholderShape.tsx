import { Group, Line, Rect } from 'react-konva';
import type { ShapeProps } from './types';
import { resolveFill, resolveStrokeColor, resolveStrokeWidth } from './shared';

export default function ImagePlaceholderShape({
  element,
  isSelected,
  draggable = true,
  interactive = true,
  onDragEnd,
  onSelect,
}: ShapeProps) {
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
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(element.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect(element.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
      }}
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
    >
      <Rect
        width={element.width}
        height={element.height}
        fill={resolveFill(element.fill)}
        stroke={resolveStrokeColor(element, isSelected, '#333333')}
        strokeWidth={resolveStrokeWidth(element.strokeWidth, 1)}
        cornerRadius={element.borderRadius ?? 0}
        shadowEnabled={isSelected}
        shadowColor="#000000"
        shadowBlur={12}
        shadowOpacity={0.12}
      />
      <Line
        points={[0, 0, element.width, element.height]}
        stroke={resolveStrokeColor(element, isSelected, '#a3a3a3')}
        strokeWidth={1}
      />
      <Line
        points={[element.width, 0, 0, element.height]}
        stroke={resolveStrokeColor(element, isSelected, '#a3a3a3')}
        strokeWidth={1}
      />
    </Group>
  );
}
