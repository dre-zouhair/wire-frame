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

function getInputPlaceholder(variant?: 'text' | 'email' | 'password' | 'number' | 'date') {
  switch (variant) {
    case 'email':
      return 'Email';
    case 'password':
      return '******';
    case 'number':
      return '123';
    case 'date':
      return 'YYYY-MM-DD';
    case 'text':
    default:
      return 'Text';
  }
}

export default function InputShape({
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
  const variant = element.inputVariant ?? 'text';
  const placeholder = element.placeholder ?? element.text ?? getInputPlaceholder(variant);
  const hasValue = (element.value ?? '') !== '';
  const displayText = hasValue ? element.value ?? '' : placeholder;
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
        cornerRadius={element.borderRadius ?? 3}
        dash={disabled ? [6, 4] : undefined}
        shadowEnabled={isSelected}
        shadowColor="#000000"
        shadowBlur={12}
        shadowOpacity={0.12}
      />
      <Text
        x={10}
        y={0}
        width={element.width - 20}
        height={element.height}
        text={displayText}
        fontSize={resolveFontSize(element.fontSize, 16)}
        fontStyle={resolveFontStyle(element.fontWeight)}
        fontFamily="Arial, sans-serif"
        fill={textFill}
        align={resolveKonvaAlign(element.textAlign ?? 'left')}
        verticalAlign="middle"
      />
    </Group>
  );
}
