import { Group, Line, Rect } from 'react-konva';
import type { ShapeProps } from './types';
import { resolveStrokeColor, resolveStrokeWidth } from './shared';

export default function TableShape({
  element,
  draggable = true,
  interactive = true,
  onDragEnd,
  onDragMove,
  onSelect,
}: ShapeProps) {
  const isInteractive = interactive !== false;
  const rows = Math.max(1, element.rows ?? 3);
  const cols = Math.max(1, element.cols ?? 3);
  const rowHeight = element.height / rows;
  const colWidth = element.width / cols;

  const verticalLines = Array.from({ length: cols - 1 }, (_, index) => (
    <Line
      key={`v-${index}`}
      points={[(index + 1) * colWidth, 0, (index + 1) * colWidth, element.height]}
      stroke="#9ca3af"
      strokeWidth={1}
    />
  ));

  const horizontalLines = Array.from({ length: rows - 1 }, (_, index) => (
    <Line
      key={`h-${index}`}
      points={[0, (index + 1) * rowHeight, element.width, (index + 1) * rowHeight]}
      stroke="#9ca3af"
      strokeWidth={1}
    />
  ));

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
    >
      <Rect
        width={element.width}
        height={element.height}
        fill="#ffffff"
        stroke={resolveStrokeColor(element, false, '#333333')}
        strokeWidth={resolveStrokeWidth(element.strokeWidth, 1)}
        cornerRadius={element.borderRadius ?? 0}
      />
      {verticalLines}
      {horizontalLines}
    </Group>
  );
}
