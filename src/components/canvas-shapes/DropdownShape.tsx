import { Group, Rect, RegularPolygon, Text } from 'react-konva';
import type { ShapeProps } from './types';

export default function DropdownShape({ element, isSelected, draggable = true, onDragEnd, onSelect }: ShapeProps) {
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
        stroke={isSelected ? '#111111' : '#8a8a8a'}
        strokeWidth={1}
        cornerRadius={3}
        shadowEnabled={isSelected}
        shadowColor="#000000"
        shadowBlur={12}
        shadowOpacity={0.12}
      />
      <Text
        x={10}
        y={0}
        width={element.width - 28}
        height={element.height}
        text={element.text ?? 'Dropdown'}
        fontSize={14}
        fontFamily="Arial, sans-serif"
        fill="#2f2f2f"
        align="left"
        verticalAlign="middle"
      />
      <RegularPolygon
        x={element.width - 14}
        y={element.height / 2 - 1}
        sides={3}
        radius={5}
        fill="#666666"
        rotation={180}
      />
    </Group>
  );
}
