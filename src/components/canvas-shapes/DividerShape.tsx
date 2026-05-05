import { Line } from 'react-konva';
import type { ShapeProps } from './types';

export default function DividerShape({ element, isSelected, draggable = true, onDragEnd, onSelect }: ShapeProps) {
  const horizontal = element.width >= element.height;

  return (
    <Line
      id={element.id}
      x={element.x}
      y={element.y}
      points={horizontal ? [0, element.height / 2, element.width, element.height / 2] : [element.width / 2, 0, element.width / 2, element.height]}
      stroke={isSelected ? '#111111' : '#d4d4d4'}
      strokeWidth={1}
      draggable={draggable}
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
