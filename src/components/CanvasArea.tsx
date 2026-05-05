import { useRef, useEffect } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import type Konva from 'konva';
import { useStore, type WireframeElement, type ElementType } from '@/store/useStore';
import BoxShape from './canvas-shapes/BoxShape';
import TextShape from './canvas-shapes/TextShape';
import ButtonShape from './canvas-shapes/ButtonShape';
import ImagePlaceholderShape from './canvas-shapes/ImagePlaceholderShape';
import InputShape from './canvas-shapes/InputShape';

const shapeComponents: Record<ElementType, React.FC<any>> = {
  box: BoxShape,
  text: TextShape,
  button: ButtonShape,
  'image-placeholder': ImagePlaceholderShape,
  input: InputShape,
};

interface CanvasAreaProps {
  width: number;
  height: number;
}

export default function CanvasArea({ width, height }: CanvasAreaProps) {
  const elements = useStore((state) => state.elements);
  const selectedId = useStore((state) => state.selectedId);
  const selectElement = useStore((state) => state.selectElement);
  const updateElement = useStore((state) => state.updateElement);
  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const stage = stageRef.current;
    if (!stage) return;

    if (selectedId) {
      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
        transformer.getLayer()?.batchDraw();
      } else {
        transformer.nodes([]);
        transformer.getLayer()?.batchDraw();
      }
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedId, elements]);

  const handleDragEnd = (id: string, x: number, y: number) => {
    updateElement(id, { x, y });
  };

  const handleClick = (id: string) => {
    selectElement(id);
  };

  const handleStageClick = (e: Konva.KonvaEventObject<any>) => {
    if (e.target === e.target.getStage()) {
      selectElement(null);
    }
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Node;
    const id = node.id();
    if (!id) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    updateElement(id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
    });
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onMouseDown={handleStageClick}
      onTouchStart={handleStageClick}
    >
      <Layer>
        {elements.map((el: WireframeElement) => {
          const ShapeComponent = shapeComponents[el.type];
          const isSelected = el.id === selectedId;
          return (
            <ShapeComponent
              key={el.id}
              element={el}
              isSelected={isSelected}
              onDragEnd={handleDragEnd}
              onClick={handleClick}
            />
          );
        })}
        <Transformer
          ref={transformerRef}
          onTransformEnd={handleTransformEnd}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={false}
          flipEnabled={false}
        />
      </Layer>
    </Stage>
  );
}
