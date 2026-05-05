import { Group, Rect, Text } from 'react-konva';
import type { GroupShapeProps } from './types';
import { resolveStrokeWidth } from './shared';

interface ArtboardShapeProps extends GroupShapeProps {
  onBackgroundMouseDown?: (event: any) => void;
}

export default function ArtboardShape({
  element,
  isSelected,
  draggable = true,
  onDragEnd,
  onSelect,
  children,
}: ArtboardShapeProps) {
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
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
      clipX={0}
      clipY={0}
      clipWidth={element.width}
      clipHeight={element.height}
    >
      <Rect
        width={element.width}
        height={element.height}
        fill="#ffffff"
        stroke={isSelected ? '#111111' : '#2f2f2f'}
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
