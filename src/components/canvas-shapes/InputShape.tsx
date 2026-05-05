import { Group, Rect, Text } from 'react-konva';
import type { ShapeProps } from './types';
import {
  resolveFill,
  resolveFontSize,
  resolveFontStyle,
  resolveKonvaAlign,
  resolveReadableTextColor,
  resolveStrokeWidth,
} from './shared';

export default function InputShape({ element, isSelected, draggable = true, onDragEnd, onSelect }: ShapeProps) {
  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
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
    >
      <Rect
        width={element.width}
        height={element.height}
        fill={resolveFill(element.fill)}
        stroke={isSelected ? '#111111' : '#7a7a7a'}
        strokeWidth={resolveStrokeWidth(element.strokeWidth, 1)}
        cornerRadius={element.borderRadius ?? 3}
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
        text={element.text ?? 'Input'}
        fontSize={resolveFontSize(element.fontSize, 16)}
        fontStyle={resolveFontStyle(element.fontWeight)}
        fontFamily="Arial, sans-serif"
        fill={resolveReadableTextColor(element.fill)}
        align={resolveKonvaAlign(element.textAlign ?? 'left')}
        verticalAlign="middle"
      />
    </Group>
  );
}
