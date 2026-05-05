import {
  AlignLeft,
  Box,
  CheckSquare,
  Circle,
  ChevronDown,
  ChevronUp,
  Heading1,
  Image,
  LayoutGrid,
  Minus,
  MousePointerClick,
  Pilcrow,
  ToggleLeft,
  Type,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useStore, type ElementType } from '@/store/useStore';
import { getElementChildren } from '@/utils/geometry';

const componentItems: Array<{ type: ElementType; label: string; icon: ReactNode }> = [
  { type: 'container', label: 'Container', icon: <LayoutGrid className="h-4 w-4" /> },
  { type: 'box', label: 'Box', icon: <Box className="h-4 w-4" /> },
  { type: 'divider', label: 'Divider', icon: <Minus className="h-4 w-4" /> },
  { type: 'heading', label: 'Heading', icon: <Heading1 className="h-4 w-4" /> },
  { type: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> },
  { type: 'button', label: 'Button', icon: <MousePointerClick className="h-4 w-4" /> },
  { type: 'input', label: 'Input', icon: <Type className="h-4 w-4" /> },
  { type: 'textarea', label: 'Textarea', icon: <AlignLeft className="h-4 w-4" /> },
  { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="h-4 w-4" /> },
  { type: 'radio', label: 'Radio', icon: <Circle className="h-4 w-4" /> },
  { type: 'toggle', label: 'Toggle', icon: <ToggleLeft className="h-4 w-4" /> },
  { type: 'dropdown', label: 'Dropdown', icon: <ChevronDown className="h-4 w-4" /> },
  { type: 'label', label: 'Label', icon: <Pilcrow className="h-4 w-4" /> },
  { type: 'image-placeholder', label: 'Image', icon: <Image className="h-4 w-4" /> },
  { type: 'icon', label: 'Icon', icon: <Type className="h-4 w-4" /> },
  { type: 'avatar', label: 'Avatar', icon: <Image className="h-4 w-4" /> },
  { type: 'table', label: 'Table', icon: <LayoutGrid className="h-4 w-4" /> },
];

function getLayerLabel(type: ElementType, name?: string, text?: string) {
  switch (type) {
    case 'artboard':
      return name ?? 'Artboard';
    case 'container':
      return name ?? 'Container';
    case 'divider':
      return name ?? 'Divider';
    case 'heading':
      return name ?? text ?? 'Heading';
    case 'text':
      return name ?? text ?? 'Text';
    case 'button':
      return name ?? text ?? 'Button';
    case 'input':
      return name ?? text ?? 'Input';
    case 'textarea':
      return name ?? text ?? 'Textarea';
    case 'checkbox':
      return name ?? text ?? 'Checkbox';
    case 'radio':
      return name ?? text ?? 'Radio';
    case 'toggle':
      return name ?? text ?? 'Toggle';
    case 'dropdown':
      return name ?? text ?? 'Dropdown';
    case 'label':
      return name ?? text ?? 'Label';
    case 'image-placeholder':
      return name ?? 'Image';
    case 'icon':
      return name ?? 'Icon';
    case 'avatar':
      return name ?? 'Avatar';
    case 'table':
      return name ?? 'Table';
    case 'instance':
      return name ?? 'Instance';
    default:
      return name ?? type;
  }
}

export default function SidebarLeft() {
  const elements = useStore((state) => state.elements);
  const addElement = useStore((state) => state.addElement);
  const createInstance = useStore((state) => state.createInstance);
  const moveSelectedSibling = useStore((state) => state.moveSelectedSibling);
  const selectedIds = useStore((state) => state.selectedIds);
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const setActivePage = useStore((state) => state.setActivePage);
  const selectElement = useStore((state) => state.selectElement);

  const rootPages = elements.filter((element) => element.type === 'artboard');
  const masterComponents = elements.filter((element) => element.isMasterComponent);

  const renderTree = (parentId: string | null, depth = 0): ReactNode => {
    const nodes =
      parentId === null
        ? rootPages
        : getElementChildren(elements, parentId);

    return nodes.map((element) => {
      const children = getElementChildren(elements, element.id);
      const isActive = element.id === selectedIds[selectedIds.length - 1];
      const isPartOfSelection = selectedIds.includes(element.id);
      const isActivePage = element.id === activeArtboardId;
      const canToggleSelection = element.type !== 'artboard';
      const siblingElements = element.parentId ? getElementChildren(elements, element.parentId) : [];
      const siblingIndex = siblingElements.findIndex((item) => item.id === element.id);
      const canMoveUp = element.parentId ? siblingIndex > 0 : false;
      const canMoveDown =
        element.parentId ? siblingIndex >= 0 && siblingIndex < siblingElements.length - 1 : false;

      return (
        <div key={element.id} className={depth > 0 ? 'ml-3 border-l border-zinc-200 pl-3' : ''}>
          <div className="relative py-0.5">
            {depth > 0 ? (
              <span className="absolute -left-3 top-5 h-px w-3 bg-zinc-200" />
            ) : null}
            <div
              className={[
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
                element.type === 'artboard' && isActivePage
                  ? 'bg-zinc-900 text-white'
                  : isActive
                    ? 'bg-zinc-900 text-white'
                    : isPartOfSelection
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-700 hover:bg-zinc-100',
              ].join(' ')}
              style={{ paddingLeft: 12 + Math.max(0, depth - 1) * 16 }}
            >
              <button
                type="button"
                onClick={() => {
                  if (element.type === 'artboard') {
                    setActivePage(element.id);
                    return;
                  }

                  selectElement(element.id, false);
                }}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                {canToggleSelection ? (
                  <input
                    type="checkbox"
                    checked={isPartOfSelection}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                    }}
                    onChange={(event) => {
                      event.stopPropagation();
                      selectElement(element.id, true);
                    }}
                    className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900"
                  />
                ) : null}
                <span className="truncate">
                  {element.type === 'artboard'
                    ? element.name ?? `Page ${rootPages.findIndex((page) => page.id === element.id) + 1}`
                    : getLayerLabel(element.type, element.name, element.text)}
                </span>
              </button>
              <div className="ml-3 flex shrink-0 items-center gap-1">
                <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  {element.type}
                </span>
                {element.type !== 'artboard' ? (
                  <>
                    <button
                      type="button"
                      disabled={!canMoveUp}
                      onClick={(event) => {
                        event.stopPropagation();
                        moveSelectedSibling('up');
                      }}
                      className="rounded border border-zinc-200 p-1 text-zinc-500 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={!canMoveDown}
                      onClick={(event) => {
                        event.stopPropagation();
                        moveSelectedSibling('down');
                      }}
                      className="rounded border border-zinc-200 p-1 text-zinc-500 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          {children.length > 0 ? renderTree(element.id, depth + 1) : null}
        </div>
      );
    });
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <section className="flex min-h-0 flex-1 flex-col border-b border-zinc-200">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Components
          </h2>
        </div>
        <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-3">
          {componentItems.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => addElement(item.type)}
              className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col border-b border-zinc-200">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Local Components
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {masterComponents.length > 0 ? (
              masterComponents.map((component) => (
                <button
                  key={component.id}
                  type="button"
                  onClick={() => createInstance(component.id)}
                  className="flex w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <span className="truncate">
                    {getLayerLabel(component.type, component.name, component.text)}
                  </span>
                  <span className="ml-2 shrink-0 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                    master
                  </span>
                </button>
              ))
            ) : (
              <p className="px-1 py-2 text-sm text-zinc-400">
                Promote an element to a master component from the right sidebar.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Pages & Layers
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {rootPages.length > 0 ? renderTree(null) : null}
        </div>
      </section>
    </aside>
  );
}
