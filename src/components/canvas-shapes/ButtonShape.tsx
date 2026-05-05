import { Group, Path, Rect, Text } from 'react-konva';
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
import { ICON_PATHS } from './IconShape';

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

export default function ButtonShape({
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
  const fontSize = resolveFontSize(element.fontSize, 16);
  const fontWeight = element.fontWeight ?? 'bold';
  const text = element.text ?? 'Button';
  const sizeMode = element.buttonSize ?? 'normal';
  const variant = element.buttonVariant ?? 'primary';
  const fillStyle = element.fill ?? 'solid';
  const disabled = Boolean(element.buttonDisabled);
  const iconPlacement = element.buttonIconPlacement ?? 'none';
  const iconPath = iconPlacement !== 'none' ? ICON_PATHS[element.buttonIconName ?? 'plus'] : null;
  const measuredWidth = measureTextWidth(text, fontSize, fontWeight);
  const sizePadding = sizeMode === 'small' ? 16 : sizeMode === 'large' ? 28 : 22;
  const sizeHeight = sizeMode === 'small' ? 32 : sizeMode === 'large' ? 48 : 40;
  const minWidth = sizeMode === 'small' ? 64 : sizeMode === 'large' ? 120 : 88;
  const iconSpace = iconPath ? 24 : 0;
  const contentWidth = Math.max(minWidth, Math.ceil(measuredWidth) + sizePadding + iconSpace);
  const width = contentWidth;
  const height = Math.max(sizeHeight, element.height);

  const variantStyles: Record<
    NonNullable<typeof element.buttonVariant>,
    { solid: string; light: string; stroke: string; text: string }
  > = {
    primary: { solid: '#4b5563', light: '#f3f4f6', stroke: '#374151', text: '#ffffff' },
    secondary: { solid: '#e5e7eb', light: '#f9fafb', stroke: '#d1d5db', text: '#111827' },
    danger: { solid: '#dc2626', light: '#fef2f2', stroke: '#b91c1c', text: '#ffffff' },
    warning: { solid: '#d97706', light: '#fef3c7', stroke: '#b45309', text: '#ffffff' },
  };

  const style = variantStyles[variant];
  const fill =
    element.backgroundColor ??
    (fillStyle === 'transparent'
      ? 'rgba(255,255,255,0.001)'
      : fillStyle === 'light'
        ? style.light
        : style.solid);
  const textColor = disabled
    ? '#6b7280'
    : resolveTextColor(element.textColor, fillStyle === 'light' ? 'light' : 'solid');
  const iconX = iconPlacement === 'left' ? 12 : width - 28;
  const textX = iconPlacement === 'left' ? 32 : 0;
  const textWidth = iconPath ? width - 32 : width;

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
        width={width}
        height={height}
        fill={fill}
        stroke={resolveStrokeColor(element, isSelected, style.stroke)}
        strokeWidth={resolveStrokeWidth(element.strokeWidth, 1)}
        cornerRadius={element.borderRadius ?? 4}
        dash={disabled ? [6, 4] : undefined}
        shadowEnabled={isSelected}
        shadowColor="#000000"
        shadowBlur={12}
        shadowOpacity={0.12}
      />
      {iconPath ? (
        <Path
          data={iconPath}
          x={iconX}
          y={Math.max(0, height / 2 - 8)}
          scaleX={0.7}
          scaleY={0.7}
          stroke={textColor}
          strokeWidth={1.8}
          lineCap="round"
          lineJoin="round"
          fillEnabled={false}
          listening={false}
        />
      ) : null}
      <Text
        x={textX}
        width={textWidth}
        height={height}
        text={text}
        fontSize={fontSize}
        fontStyle={resolveFontStyle(fontWeight)}
        fontFamily="Arial, sans-serif"
        fill={textColor}
        align={resolveKonvaAlign(element.textAlign ?? 'center')}
        verticalAlign="middle"
      />
    </Group>
  );
}
