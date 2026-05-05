import { useStore, type ElementType } from '@/store/useStore';
import { Square, Type, MousePointerClick, Image, TextCursorInput } from 'lucide-react';

const componentItems: { type: ElementType; label: string; icon: React.ReactNode }[] = [
  { type: 'box', label: 'Box', icon: <Square className="w-4 h-4" /> },
  { type: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
  { type: 'button', label: 'Button', icon: <MousePointerClick className="w-4 h-4" /> },
  { type: 'image-placeholder', label: 'Image', icon: <Image className="w-4 h-4" /> },
  { type: 'input', label: 'Input', icon: <TextCursorInput className="w-4 h-4" /> },
];

export default function SidebarLeft() {
  const addElement = useStore((state) => state.addElement);

  return (
    <div className="w-64 h-full border-r border-gray-200 bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Components</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {componentItems.map((item) => (
          <button
            key={item.type}
            onClick={() => addElement(item.type)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
