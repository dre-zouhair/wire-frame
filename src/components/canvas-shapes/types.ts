import type { ReactNode } from 'react';
import type { WireframeElement } from '@/store/useStore';

export interface ShapeProps {
  element: WireframeElement;
  isSelected: boolean;
  draggable?: boolean;
  interactive?: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onSelect: (id: string, additive: boolean) => void;
}

export interface GroupShapeProps extends ShapeProps {
  children?: ReactNode;
  visualBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
