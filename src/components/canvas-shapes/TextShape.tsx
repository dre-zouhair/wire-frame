import { Text } from 'react-konva';
import type { WireframeElement } from '@/store/useStore';

interface TextShapeProps {
  element: WireframeElement;
  isSelected: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onClick: (id: string) => void;
}

export default function TextShape({ element, isSelected, onDragEnd, onClick }: TextShapeProps) {
  return (
    <Text
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      text={element.text || 'Text'}
      fontSize={16}
      fontFamily="sans-serif"
      fill="#333333"
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
