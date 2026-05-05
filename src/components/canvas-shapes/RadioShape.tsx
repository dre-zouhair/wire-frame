import { Circle, Group, Text } from 'react-konva';
import type { ShapeProps } from './types';
import {
  resolveFontSize,
  resolveFontStyle,
  resolveKonvaAlign,
  resolveStrokeColor,
  resolveStrokeWidth,
  resolveTextColor,
} from './shared';

export default function RadioShape({
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
  const radius = 8;
  const centerY = element.height / 2;

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
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
      <Circle
        x={radius + 2}
        y={centerY}
        radius={radius}
        fill="#ffffff"
        stroke={resolveStrokeColor(element, isSelected, '#7a7a7a')}
        strokeWidth={resolveStrokeWidth(element.strokeWidth, 1)}
        shadowEnabled={isSelected}
        shadowColor="#000000"
        shadowBlur={10}
        shadowOpacity={0.12}
      />
      {element.checked ? (
        <Circle x={radius + 2} y={centerY} radius={radius - 4} fill="#111827" />
      ) : null}
      <Text
        x={24}
        y={0}
        width={Math.max(0, element.width - 24)}
        height={element.height}
        text={element.text ?? 'Radio'}
        fontSize={resolveFontSize(element.fontSize, 16)}
        fontStyle={resolveFontStyle(element.fontWeight)}
        fontFamily="Arial, sans-serif"
        fill={resolveTextColor(element.textColor, element.fill)}
        align={resolveKonvaAlign(element.textAlign ?? 'left')}
        verticalAlign="middle"
      />
    </Group>
  );
}
