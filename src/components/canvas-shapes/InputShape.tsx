import { Group, Rect, Text } from 'react-konva';
import type { WireframeElement } from '@/store/useStore';

interface InputShapeProps {
  element: WireframeElement;
  isSelected: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onClick: (id: string) => void;
}

export default function InputShape({ element, isSelected, onDragEnd, onClick }: InputShapeProps) {
  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      draggable
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
      onClick={() => onClick(element.id)}
      onTap={() => onClick(element.id)}
    >
      <Rect
        width={element.width}
        height={element.height}
        fill="#f3f4f6"
        stroke="#555555"
        strokeWidth={1}
        cornerRadius={2}
        shadowEnabled={isSelected}
        shadowColor="#000000"
        shadowBlur={8}
        shadowOpacity={0.15}
      />
      <Text
        x={8}
        y={0}
        width={element.width - 16}
        height={element.height}
        text={element.text || ''}
        fontSize={14}
        fontFamily="sans-serif"
        fill="#333333"
        align="left"
        verticalAlign="middle"
      />
    </Group>
  );
}
