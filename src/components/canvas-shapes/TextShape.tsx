import { Text } from 'react-konva';
import type { ShapeProps } from './types';
import { resolveFontSize, resolveFontStyle, resolveKonvaAlign } from './shared';

function measureTextWidth(text: string, fontSize: number, fontWeight: 'normal' | 'bold') {
  if (typeof document === 'undefined') {
    return Math.max(12, text.length * fontSize * 0.55);
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return Math.max(12, text.length * fontSize * 0.55);
  }

  context.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;
  return context.measureText(text || ' ').width;
}

export default function TextShape({
  element,
  isSelected,
  draggable = true,
  interactive = true,
  onDragEnd,
  onSelect,
}: ShapeProps) {
  const isInteractive = interactive !== false;
  const fontSize = resolveFontSize(element.fontSize, 16);
  const fontWeight = element.fontWeight ?? 'normal';
  const text = element.text ?? 'Text';
  const measuredWidth = measureTextWidth(text, fontSize, fontWeight);
  const fittedWidth = Math.max(12, Math.ceil(measuredWidth) + 8);
  const fittedHeight = Math.max(24, Math.ceil(fontSize * 1.4));
  return (
    <Text
      id={element.id}
      x={element.x}
      y={element.y}
      width={Math.max(12, Math.min(element.width, fittedWidth))}
      height={Math.max(24, Math.max(element.height, fittedHeight))}
      text={text}
      fontSize={fontSize}
      fontStyle={resolveFontStyle(fontWeight)}
      fontFamily="Arial, sans-serif"
      fill="#2f2f2f"
      align={resolveKonvaAlign(element.textAlign ?? 'left')}
      verticalAlign="middle"
      draggable={draggable && isInteractive}
      listening={isInteractive}
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
