import { Group, Rect, Text } from 'react-konva';
import type { WireframeElement } from '@/store/useStore';

interface ButtonShapeProps {
  element: WireframeElement;
  isSelected: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onClick: (id: string) => void;
}

export default function ButtonShape({ element, isSelected, onDragEnd, onClick }: ButtonShapeProps) {
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
        fill="white"
        stroke="#333333"
        strokeWidth={2}
        cornerRadius={4}
        shadowEnabled={isSelected}
        shadowColor="#000000"
        shadowBlur={8}
        shadowOpacity={0.15}
      />
      <Text
        width={element.width}
        height={element.height}
        text={element.text || 'Button'}
        fontSize={14}
        fontFamily="sans-serif"
        fill="#333333"
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
}
