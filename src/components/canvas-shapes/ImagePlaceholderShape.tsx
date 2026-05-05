import { Group, Line, Rect, Text } from 'react-konva';
import type { ShapeProps } from './types';
import { resolveFill, resolveStrokeColor, resolveStrokeWidth } from './shared';

function getContentFrame(width: number, height: number, objectFit?: string, aspectRatio?: number) {
  const ratio = aspectRatio && aspectRatio > 0 ? aspectRatio : width / Math.max(height, 1) || 1;
  const padding = 12;
  const innerWidth = Math.max(0, width - padding * 2);
  const innerHeight = Math.max(0, height - padding * 2);

  if (objectFit === 'fill' || objectFit === 'cover') {
    return { x: 0, y: 0, width, height };
  }

  if (objectFit === 'none') {
    const noneWidth = Math.max(24, Math.min(innerWidth * 0.7, innerHeight * ratio * 0.7));
    const noneHeight = Math.max(24, noneWidth / ratio);
    return {
      x: (width - noneWidth) / 2,
      y: (height - noneHeight) / 2,
      width: noneWidth,
      height: noneHeight,
    };
  }

  let contentWidth = innerWidth;
  let contentHeight = contentWidth / ratio;
  if (contentHeight > innerHeight) {
    contentHeight = innerHeight;
    contentWidth = contentHeight * ratio;
  }

  return {
    x: (width - contentWidth) / 2,
    y: (height - contentHeight) / 2,
    width: contentWidth,
    height: contentHeight,
  };
}

export default function ImagePlaceholderShape({
  element,
  isSelected,
  draggable = true,
  interactive = true,
  onDragEnd,
  onDragMove,
  onSelect,
}: ShapeProps) {
  const isInteractive = interactive !== false;
  const altText = element.alt ?? element.text ?? element.name ?? 'Image';
  const contentFrame = getContentFrame(
    element.width,
    element.height,
    element.objectFit,
    element.aspectRatio
  );
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
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
      >
      <Rect
        width={element.width}
        height={element.height}
        fill={resolveFill(element.fill, element.backgroundColor)}
        stroke={resolveStrokeColor(element, isSelected, '#333333')}
        strokeWidth={resolveStrokeWidth(element.strokeWidth, 1)}
        cornerRadius={element.borderRadius ?? 0}
        shadowEnabled={isSelected}
        shadowColor="#000000"
        shadowBlur={12}
        shadowOpacity={0.12}
      />
      <Line
        points={[
          contentFrame.x,
          contentFrame.y,
          contentFrame.x + contentFrame.width,
          contentFrame.y + contentFrame.height,
        ]}
        stroke={resolveStrokeColor(element, isSelected, '#a3a3a3')}
        strokeWidth={1}
      />
      <Line
        points={[
          contentFrame.x + contentFrame.width,
          contentFrame.y,
          contentFrame.x,
          contentFrame.y + contentFrame.height,
        ]}
        stroke={resolveStrokeColor(element, isSelected, '#a3a3a3')}
        strokeWidth={1}
      />
      {element.objectFit && element.objectFit !== 'fill' ? (
        <Rect
          x={contentFrame.x}
          y={contentFrame.y}
          width={contentFrame.width}
          height={contentFrame.height}
          fill="rgba(255,255,255,0.35)"
          stroke={resolveStrokeColor(element, isSelected, '#a3a3a3')}
          strokeWidth={1}
          dash={element.objectFit === 'cover' ? [4, 4] : undefined}
        />
      ) : null}
      <Text
        x={10}
        y={element.height - 22}
        width={element.width - 20}
        height={14}
        text={altText}
        fontSize={11}
        fill="#4b5563"
        ellipsis
      />
    </Group>
  );
}
