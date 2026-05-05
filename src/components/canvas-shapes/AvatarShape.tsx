import { Circle, Group, Text } from 'react-konva';
import type { ShapeProps } from './types';
import { resolveStrokeColor, resolveStrokeWidth } from './shared';

export default function AvatarShape({
  element,
  draggable = true,
  interactive = true,
  onDragEnd,
  onDragMove,
  onSelect,
}: ShapeProps) {
  const isInteractive = interactive !== false;
  const radius = Math.min(element.width, element.height) / 2;

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
      <Circle
        x={radius}
        y={radius}
        radius={radius}
        fill="#f3f4f6"
        stroke={resolveStrokeColor(element, false, '#333333')}
        strokeWidth={resolveStrokeWidth(element.strokeWidth, 1)}
      />
      <Text
        x={0}
        y={0}
        width={radius * 2}
        height={radius * 2}
        text="U"
        fontSize={Math.max(12, radius * 0.95)}
        fontStyle="bold"
        fill="#4b5563"
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  );
}
