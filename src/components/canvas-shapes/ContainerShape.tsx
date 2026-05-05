import { Group, Rect } from 'react-konva';
import type { GroupShapeProps } from './types';

export default function ContainerShape({
  element,
  isSelected,
  draggable = true,
  onDragEnd,
  onSelect,
  children,
}: GroupShapeProps) {
  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      draggable={draggable}
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
    >
      <Rect
        width={element.width}
        height={element.height}
        fill="rgba(255,255,255,0.01)"
        stroke={isSelected ? '#111111' : '#9ca3af'}
        strokeWidth={1}
        dash={[6, 4]}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect(element.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect(element.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
        }}
      />
      {children}
    </Group>
  );
}
