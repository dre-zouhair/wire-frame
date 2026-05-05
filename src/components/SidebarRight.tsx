import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';

export default function SidebarRight() {
  const selectedId = useStore((state) => state.selectedId);
  const elements = useStore((state) => state.elements);
  const updateElement = useStore((state) => state.updateElement);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  const [x, setX] = useState('0');
  const [y, setY] = useState('0');
  const [w, setW] = useState('0');
  const [h, setH] = useState('0');
  const [text, setText] = useState('');

  useEffect(() => {
    if (selectedElement) {
      setX(String(selectedElement.x));
      setY(String(selectedElement.y));
      setW(String(selectedElement.width));
      setH(String(selectedElement.height));
      setText(selectedElement.text || '');
    }
  }, [selectedElement]);

  if (!selectedElement) {
    return (
      <div className="w-64 h-full border-l border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-gray-400 text-center">Select an element to edit its properties</p>
        </div>
      </div>
    );
  }

  const hasTextProp = selectedElement.type === 'text' || selectedElement.type === 'button' || selectedElement.type === 'input';

  const commitUpdate = () => {
    if (!selectedElement) return;
    const updates: Partial<typeof selectedElement> = {
      x: Number(x) || 0,
      y: Number(y) || 0,
      width: Number(w) || 20,
      height: Number(h) || 20,
    };
    if (hasTextProp) {
      updates.text = text;
    }
    updateElement(selectedElement.id, updates);
  };

  return (
    <div className="w-64 h-full border-l border-gray-200 bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Properties</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">Type</label>
          <div className="text-sm text-gray-800 font-medium capitalize">{selectedElement.type.replace('-', ' ')}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">X</label>
            <input
              type="number"
              value={x}
              onChange={(e) => setX(e.target.value)}
              onBlur={commitUpdate}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">Y</label>
            <input
              type="number"
              value={y}
              onChange={(e) => setY(e.target.value)}
              onBlur={commitUpdate}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">Width</label>
            <input
              type="number"
              value={w}
              onChange={(e) => setW(e.target.value)}
              onBlur={commitUpdate}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">Height</label>
            <input
              type="number"
              value={h}
              onChange={(e) => setH(e.target.value)}
              onBlur={commitUpdate}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        </div>

        {hasTextProp && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={commitUpdate}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}
