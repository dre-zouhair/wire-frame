import { Group, Rect, Text } from 'react-konva';
import type { ShapeProps } from './types';

export default function CheckboxShape({ element, isSelected, draggable = true, onDragEnd, onSelect }: ShapeProps) {
  const boxSize = 16;

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
        x={0}
        y={4}
        width={boxSize}
        height={boxSize}
        fill="#ffffff"
        stroke={isSelected ? '#111111' : '#555555'}
        strokeWidth={1}
      />
      {element.checked ? (
        <Rect x={4} y={8} width={8} height={8} fill="#111111" />
      ) : null}
      <Text
        x={24}
        y={0}
        width={Math.max(0, element.width - 24)}
        height={element.height}
        text={element.text ?? 'Checkbox'}
        fontSize={14}
        fontFamily="Arial, sans-serif"
        fill="#2f2f2f"
        align="left"
        verticalAlign="middle"
      />
    </Group>
  );
}
