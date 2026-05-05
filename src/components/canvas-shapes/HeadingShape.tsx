import { Text } from 'react-konva';
import type { ShapeProps } from './types';
import { resolveFontSize, resolveFontStyle, resolveKonvaAlign, resolveTextColor } from './shared';

const headingSizes = {
  h1: 48,
  h2: 36,
  h3: 30,
  h4: 24,
  h5: 20,
  h6: 16,
} as const;

export default function HeadingShape({
  element,
  isSelected,
  draggable = true,
  interactive = true,
  onDragEnd,
  onDragMove,
  onSelect,
  onEditStart,
}: ShapeProps) {
  const isInteractive = interactive !== false;
  const variant = element.headingVariant ?? 'h2';
  return (
    <Text
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      text={element.text ?? 'Heading'}
      fontSize={resolveFontSize(element.fontSize, headingSizes[variant])}
      fontStyle={resolveFontStyle(element.fontWeight ?? 'bold')}
      fontFamily="Arial, sans-serif"
      fill={resolveTextColor(element.textColor, element.fill)}
      align={resolveKonvaAlign(element.textAlign ?? 'left')}
      verticalAlign="middle"
      draggable={draggable && isInteractive}
      listening={isInteractive}
      onDragStart={(e) => {
        e.cancelBubble = true;
      }}
      onDragMove={(e) => {
        e.cancelBubble = true;
        onDragMove?.(element.id, e.target.x(), e.target.y(), e.target);
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(element.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect(element.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
      }}
      onDblClick={(e) => {
        e.cancelBubble = true;
        onEditStart?.(element.id);
      }}
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
      shadowEnabled={isSelected}
      shadowColor="#000000"
      shadowBlur={10}
      shadowOpacity={0.12}
    />
  );
}
