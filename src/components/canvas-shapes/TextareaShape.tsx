import { Group, Rect, Text } from 'react-konva';
import type { ShapeProps } from './types';
import {
  resolveFill,
  resolveFontSize,
  resolveFontStyle,
  resolveKonvaAlign,
  resolveStrokeColor,
  resolveStrokeWidth,
  resolveTextColor,
} from './shared';

export default function TextareaShape({
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
  const displayText = element.value ?? element.placeholder ?? element.text ?? 'Textarea';
  const hasValue = (element.value ?? '') !== '';
  const textFill = hasValue ? resolveTextColor(element.textColor, element.fill) : '#9ca3af';
  const disabled = Boolean(element.disabled);

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      opacity={disabled ? 0.65 : 1}
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
    >
      <Rect
        width={element.width}
        height={element.height}
        fill={resolveFill(element.fill, element.backgroundColor)}
        stroke={resolveStrokeColor(element, isSelected, '#7a7a7a')}
        strokeWidth={resolveStrokeWidth(element.strokeWidth, 1)}
        cornerRadius={element.borderRadius ?? 4}
        dash={disabled ? [6, 4] : undefined}
        shadowEnabled={isSelected}
        shadowColor="#000000"
        shadowBlur={12}
        shadowOpacity={0.12}
      />
      <Text
        x={10}
        y={8}
        width={Math.max(0, element.width - 20)}
        height={Math.max(0, element.height - 16)}
        text={displayText}
        fontSize={resolveFontSize(element.fontSize, 16)}
        fontStyle={resolveFontStyle(element.fontWeight)}
        fontFamily="Arial, sans-serif"
        fill={textFill}
        align={resolveKonvaAlign(element.textAlign ?? 'left')}
        verticalAlign="top"
        wrap="word"
      />
    </Group>
  );
}
