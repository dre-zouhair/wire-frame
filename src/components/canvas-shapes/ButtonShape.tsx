import { Group, Rect, Text } from 'react-konva';
import type { ShapeProps } from './types';

export default function ButtonShape({ element, isSelected, draggable = true, onDragEnd, onSelect }: ShapeProps) {
  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
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
    >
      <Rect
        width={element.width}
        height={element.height}
        fill="#ffffff"
        stroke={isSelected ? '#111111' : '#333333'}
        strokeWidth={2}
        cornerRadius={4}
        shadowEnabled={isSelected}
        shadowColor="#000000"
        shadowBlur={12}
        shadowOpacity={0.12}
      />
      <Text
        width={element.width}
        height={element.height}
        text={element.text ?? 'Button'}
        fontSize={14}
        fontFamily="Arial, sans-serif"
        fill="#2f2f2f"
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
}
