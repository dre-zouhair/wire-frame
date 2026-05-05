import { Group, Rect, Text } from 'react-konva';
import type { GroupShapeProps } from './types';
import { resolveFill, resolveStrokeWidth } from './shared';

interface ArtboardShapeProps extends GroupShapeProps {
  onBackgroundMouseDown?: (event: any) => void;
}

export default function ArtboardShape({
  element,
  isSelected,
  draggable = true,
  interactive = true,
  onDragEnd,
  onDragMove,
  onSelect,
  children,
}: ArtboardShapeProps) {
  const isInteractive = interactive !== false;
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
      onDragEnd={(e) => {
        if (e.target.id() !== element.id) {
          e.cancelBubble = true;
          return;
        }

        onDragEnd(element.id, e.target.x(), e.target.y());
      }}
      clipX={0}
      clipY={0}
      clipWidth={element.width}
      clipHeight={element.height}
    >
      <Rect
        width={element.width}
        height={element.height}
        fill={resolveFill(element.fill, element.backgroundColor) ?? '#ffffff'}
        stroke={isSelected ? '#111111' : element.isMasterComponent ? '#a855f7' : '#2f2f2f'}
        strokeWidth={resolveStrokeWidth(element.strokeWidth, 1)}
        shadowColor="#000000"
        shadowBlur={22}
        shadowOpacity={0.22}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect(element.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect(element.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
        }}
      />
      <Text
        x={14}
        y={12}
        text={element.name ?? 'Page'}
        fontSize={12}
        fontStyle="bold"
        fill="#6b7280"
        listening={false}
      />
      {children}
    </Group>
  );
}
