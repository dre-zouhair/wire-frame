import { Line } from 'react-konva';
import type { ShapeProps } from './types';
import { resolveStrokeColor, resolveStrokeWidth } from './shared';

export default function DividerShape({
  element,
  isSelected,
  draggable = true,
  interactive = true,
  onDragEnd,
  onDragMove,
  onSelect,
}: ShapeProps) {
  const isInteractive = interactive !== false;
  const horizontal = element.width >= element.height;

  return (
    <Line
      id={element.id}
      x={element.x}
      y={element.y}
      points={horizontal ? [0, element.height / 2, element.width, element.height / 2] : [element.width / 2, 0, element.width / 2, element.height]}
      stroke={resolveStrokeColor(element, isSelected, '#d4d4d4')}
      strokeWidth={resolveStrokeWidth(element.strokeWidth, 1)}
      draggable={draggable && isInteractive}
      listening={isInteractive}
      onDragStart={(e) => {
        e.cancelBubble = true;
      }}
      onDragMove={(e) => {
        e.cancelBubble = true;
        onDragMove?.(element.id, e.target.x(), e.target.y(), e.target);
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
      hitStrokeWidth={12}
    />
  );
}
