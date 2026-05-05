import { Group, Path, Rect } from 'react-konva';
import type { ShapeProps } from './types';
import { resolveStrokeColor } from './shared';

export const ICON_PATHS: Record<string, string> = {
  menu: 'M4 6H20M4 12H20M4 18H20',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14Zm5.5 12.5L21 21',
  user: 'M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
  home: 'M4 11L12 4l8 7v9H4z',
  settings:
    'M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8Zm0-4v2m0 14v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  'chevron-left': 'M15 6L9 12L15 18',
  'chevron-right': 'M9 6L15 12L9 18',
  'chevron-up': 'M6 15L12 9L18 15',
  'chevron-down': 'M6 9L12 15L18 9',
  'sort-asc': 'M7 18V6M7 6L4 9M7 6L10 9M14 18V6M14 18L11 15M14 18L17 15',
  'sort-desc': 'M7 6v12M7 18L4 15M7 18L10 15M14 6v12M14 6L11 9M14 6L17 9',
  'chevrons-left': 'M11 6L5 12L11 18M19 6L13 12L19 18',
  'chevrons-right': 'M13 6L19 12L13 18M5 6L11 12L5 18',
  ellipsis: 'M6 12h.01M12 12h.01M18 12h.01',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  x: 'M6 6L18 18M18 6L6 18',
};

export default function IconShape({
  element,
  draggable = true,
  interactive = true,
  onDragEnd,
  onDragMove,
  onSelect,
}: ShapeProps) {
  const isInteractive = interactive !== false;
  const pathData = ICON_PATHS[element.iconName ?? 'search'];
  const scale = Math.min(element.width, element.height) / 24;

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
        fill="rgba(255,255,255,0.001)"
        listening
      />
      <Path
        data={pathData}
        x={Math.max(0, (element.width - 24 * scale) / 2)}
        y={Math.max(0, (element.height - 24 * scale) / 2)}
        scaleX={scale}
        scaleY={scale}
        stroke={resolveStrokeColor(element, false, '#333333')}
        strokeWidth={1.8}
        lineCap="round"
        lineJoin="round"
        fillEnabled={false}
      />
    </Group>
  );
}
