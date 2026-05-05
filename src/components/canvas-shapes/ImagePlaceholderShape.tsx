import { Group, Rect, Line } from 'react-konva';
import type { WireframeElement } from '@/store/useStore';

interface ImagePlaceholderShapeProps {
  element: WireframeElement;
  isSelected: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onClick: (id: string) => void;
}

export default function ImagePlaceholderShape({
  element,
  isSelected,
  onDragEnd,
  onClick,
}: ImagePlaceholderShapeProps) {
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
        shadowEnabled={isSelected}
        shadowColor="#000000"
        shadowBlur={8}
        shadowOpacity={0.15}
      />
      <Line
        points={[0, 0, element.width, element.height]}
        stroke="#999999"
        strokeWidth={1}
        dash={[4, 4]}
      />
      <Line
        points={[element.width, 0, 0, element.height]}
        stroke="#999999"
        strokeWidth={1}
        dash={[4, 4]}
      />
    </Group>
  );
}
