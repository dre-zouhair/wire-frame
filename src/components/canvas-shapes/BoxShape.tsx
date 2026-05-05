import { Rect } from 'react-konva';
import type { WireframeElement } from '@/store/useStore';

interface BoxShapeProps {
  element: WireframeElement;
  isSelected: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onClick: (id: string) => void;
}

export default function BoxShape({ element, isSelected, onDragEnd, onClick }: BoxShapeProps) {
  return (
    <Rect
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      fill="white"
      stroke="#333333"
      strokeWidth={2}
      draggable
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
      onClick={() => onClick(element.id)}
      onTap={() => onClick(element.id)}
      shadowEnabled={isSelected}
      shadowColor="#000000"
      shadowBlur={8}
      shadowOpacity={0.15}
    />
  );
}
