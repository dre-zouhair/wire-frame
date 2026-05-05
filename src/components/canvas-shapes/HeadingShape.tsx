import { Text } from 'react-konva';
import type { ShapeProps } from './types';

export default function HeadingShape({ element, isSelected, draggable = true, onDragEnd, onSelect }: ShapeProps) {
  return (
    <Text
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      text={element.text ?? 'Heading'}
      fontSize={28}
      fontStyle="bold"
      fontFamily="Arial, sans-serif"
      fill="#202020"
      verticalAlign="middle"
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
      shadowEnabled={isSelected}
      shadowColor="#000000"
      shadowBlur={10}
      shadowOpacity={0.12}
    />
  );
}
