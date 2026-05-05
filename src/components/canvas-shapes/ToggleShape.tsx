import { Circle, Group, Rect, Text } from 'react-konva';
import type { ShapeProps } from './types';
import {
  resolveFontSize,
  resolveFontStyle,
  resolveKonvaAlign,
  resolveReadableTextColor,
  resolveStrokeColor,
  resolveStrokeWidth,
} from './shared';

export default function ToggleShape({
  element,
  isSelected,
  draggable = true,
  interactive = true,
  onDragEnd,
  onSelect,
}: ShapeProps) {
  const isInteractive = interactive !== false;
  const trackWidth = 42;
  const trackHeight = 24;
  const trackY = Math.max(0, (element.height - trackHeight) / 2);
  const trackX = 0;
  const knobRadius = 8;
  const knobX = element.checked ? trackX + trackWidth - knobRadius - 5 : trackX + knobRadius + 5;
  const knobY = trackY + trackHeight / 2;

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
        x={trackX}
        y={trackY}
        width={trackWidth}
        height={trackHeight}
        cornerRadius={trackHeight / 2}
        fill={element.checked ? '#4b5563' : '#e5e7eb'}
        stroke={resolveStrokeColor(element, isSelected, '#7a7a7a')}
        strokeWidth={resolveStrokeWidth(element.strokeWidth, 1)}
        shadowEnabled={isSelected}
        shadowColor="#000000"
        shadowBlur={10}
        shadowOpacity={0.12}
      />
      <Circle x={knobX} y={knobY} radius={knobRadius} fill="#ffffff" stroke="#9ca3af" strokeWidth={1} />
      <Text
        x={56}
        y={0}
        width={Math.max(0, element.width - 56)}
        height={element.height}
        text={element.text ?? 'Toggle'}
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
