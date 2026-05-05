import { Text } from 'react-konva';
import type { ShapeProps } from './types';
import { resolveFontSize, resolveFontStyle, resolveKonvaAlign } from './shared';

export default function TextShape({ element, isSelected, draggable = true, onDragEnd, onSelect }: ShapeProps) {
  return (
    <Text
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      text={element.text ?? 'Text'}
      fontSize={resolveFontSize(element.fontSize, 16)}
      fontStyle={resolveFontStyle(element.fontWeight)}
      fontFamily="Arial, sans-serif"
      fill="#2f2f2f"
      align={resolveKonvaAlign(element.textAlign ?? 'left')}
      verticalAlign="middle"
      draggable={draggable}
      onDragStart={(e) => {
        e.cancelBubble = true;
      }}
      onDragMove={(e) => {
        e.cancelBubble = true;
      }}
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
