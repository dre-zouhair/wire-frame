import { Group, Path } from 'react-konva';
import type { ShapeProps } from './types';

const ICON_PATHS: Record<string, string> = {
  menu: 'M4 6H20M4 12H20M4 18H20',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14Zm5.5 12.5L21 21',
  user: 'M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
  home: 'M4 11L12 4l8 7v9H4z',
  settings:
    'M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8Zm0-4v2m0 14v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
};

export default function IconShape({
  element,
  draggable = true,
  onDragEnd,
  onSelect,
}: ShapeProps) {
  const pathData = ICON_PATHS[element.iconName ?? 'search'];
  const scale = Math.min(element.width, element.height) / 24;

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
      <Path
        data={pathData}
        x={0}
        y={0}
        scaleX={scale}
        scaleY={scale}
        stroke="#333333"
        strokeWidth={1.8}
        lineCap="round"
        lineJoin="round"
        fillEnabled={false}
      />
    </Group>
  );
}
