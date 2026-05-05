import { Download, Redo2, Undo2 } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';
import type Konva from 'konva';
import { ARTBOARD_PRESETS, useStore, type PageTemplate, type PreviewPreset } from '@/store/useStore';
import { downloadCss, exportCssDocument } from '@/utils/cssExport';
import { downloadHtml, exportHtmlDocument } from '@/utils/htmlExport';

interface TopBarProps {
  stageRef: RefObject<Konva.Stage | null>;
}

export default function TopBar({ stageRef }: TopBarProps) {
  const elements = useStore((state) => state.elements);
  const designTokens = useStore((state) => state.designTokens);
  const selectedIds = useStore((state) => state.selectedIds);
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const setSelection = useStore((state) => state.setSelection);
  const createPage = useStore((state) => state.createPage);
  const setActivePage = useStore((state) => state.setActivePage);
  const deletePage = useStore((state) => state.deletePage);
  const pageDragEnabled = useStore((state) => state.pageDragEnabled);
  const setPageDragEnabled = useStore((state) => state.setPageDragEnabled);
  const changeArtboardSize = useStore((state) => state.changeArtboardSize);
  const setPreviewPreset = useStore((state) => state.setPreviewPreset);
  const zoomToFit = useStore((state) => state.zoomToFit);
  const groupSelected = useStore((state) => state.groupSelected);
  const ungroupSelected = useStore((state) => state.ungroupSelected);
  const temporalState = useSyncExternalStore(
    useStore.temporal.subscribe,
    useStore.temporal.getState,
    useStore.temporal.getState
  );
  const canUndo = temporalState.pastStates.length > 0;
  const canRedo = temporalState.futureStates.length > 0;

  const pages = elements.filter((element) => element.type === 'artboard');
  const activePage = pages.find((page) => page.id === activeArtboardId) ?? pages[0] ?? null;
  const selectedElement = selectedIds[0]
    ? elements.find((element) => element.id === selectedIds[0]) ?? null
    : null;
  const artboardValue =
    activePage &&
    ARTBOARD_PRESETS.find(
      (preset) => preset.width === activePage.width && preset.height === activePage.height
    )?.name;
  const previewPresetValue: PreviewPreset =
    activePage?.width === ARTBOARD_PRESETS[1].width && activePage?.height === ARTBOARD_PRESETS[1].height
      ? 'tablet'
      : activePage?.width === ARTBOARD_PRESETS[2].width && activePage?.height === ARTBOARD_PRESETS[2].height
        ? 'mobile'
        : 'desktop';

  const canGroup = selectedIds.filter((id) => {
    const element = elements.find((item) => item.id === id);
    return Boolean(element && element.type !== 'artboard');
  }).length >= 2 &&
    (!selectedElement || selectedElement.parentId == null || elements.find((item) => item.id === selectedElement.parentId)?.type !== 'ul');
  const canUngroup =
    (selectedElement?.type === 'container' ||
      selectedElement?.type === 'div' ||
      selectedElement?.type === 'ul' ||
      selectedElement?.type === 'li') &&
    selectedIds.length === 1;
  const [pageTemplate, setPageTemplate] = useState<PageTemplate>('blank');

  const handleExportPng = async () => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const previousSelection = selectedIds;
    setSelection([]);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    try {
      const cropX = activePage?.x ?? 0;
      const cropY = activePage?.y ?? 0;
      const cropWidth = activePage?.width ?? stage.width();
      const cropHeight = activePage?.height ?? stage.height();
      const dataUrl = stage.toDataURL({
        pixelRatio: 3,
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'wireframe-export.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setSelection(previousSelection);
    }
  };

  const handleExportHtml = () => {
    const html = exportHtmlDocument(elements, { rootId: activePage?.id ?? null, tokens: designTokens });
    downloadHtml('wireframe-export.html', html);
  };

  const handleExportCss = () => {
    const css = exportCssDocument(elements, { rootId: activePage?.id ?? null, tokens: designTokens });
    downloadCss('wireframe-export.css', css);
  };

  return (
    <header className="flex h-12 items-center justify-between border-b border-zinc-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Page
        </label>
        <select
          value={activePage?.id ?? ''}
          onChange={(event) => setActivePage(event.target.value)}
          className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-400"
        >
          {pages.map((page, index) => (
            <option key={page.id} value={page.id}>
              {page.name ?? `Page ${index + 1}`}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => createPage(pageTemplate)}
          className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          New Page
        </button>
        <select
          value={pageTemplate}
          onChange={(event) => setPageTemplate(event.target.value as PageTemplate)}
          className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-400"
        >
          <option value="blank">Blank</option>
          <option value="landing">Landing</option>
          <option value="dashboard">Dashboard</option>
          <option value="form">Form</option>
          <option value="article">Article</option>
          <option value="mobile">Mobile</option>
        </select>
        <button
          type="button"
          disabled={pages.length <= 1 || !activePage}
          onClick={() => {
            if (activePage) {
              deletePage(activePage.id);
            }
          }}
          className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
          Delete Page
        </button>
        <label className="flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700">
          <input
            type="checkbox"
            checked={pageDragEnabled}
            onChange={(event) => setPageDragEnabled(event.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-700"
          />
          Drag Page
        </label>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Size
          </label>
          <select
            value={artboardValue ?? 'custom'}
            onChange={(event) => {
              const preset = ARTBOARD_PRESETS.find((item) => item.name === event.target.value);
              if (preset) {
                changeArtboardSize(preset.width, preset.height);
              }
            }}
            className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-400"
          >
            {ARTBOARD_PRESETS.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.name}
              </option>
            ))}
            <option value="custom">Custom</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Preview
            </label>
            <select
              value={previewPresetValue}
              onChange={(event) => setPreviewPreset(event.target.value as PreviewPreset)}
              className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-400"
            >
              <option value="desktop">Desktop</option>
              <option value="tablet">Tablet</option>
              <option value="mobile">Mobile</option>
            </select>
            <button
              type="button"
              onClick={() => zoomToFit()}
              className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Zoom to Fit
            </button>
          </div>
          <span className="text-xs text-zinc-400">All changes saved</span>
        </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canUndo}
          onClick={() => useStore.temporal.getState().undo()}
          className="rounded-md border border-zinc-300 p-2 text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={() => useStore.temporal.getState().redo()}
          className="rounded-md border border-zinc-300 p-2 text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleExportPng}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <span className="inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export PNG
          </span>
        </button>
        <button
          type="button"
          onClick={handleExportHtml}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Export HTML
        </button>
        <button
          type="button"
          onClick={handleExportCss}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Export CSS
        </button>
        <button
          type="button"
          disabled={!canGroup}
          onClick={() => groupSelected(selectedIds)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Group
        </button>
        <button
          type="button"
          disabled={!canUngroup}
          onClick={() => {
            if (
              selectedElement?.type === 'container' ||
              selectedElement?.type === 'div' ||
              selectedElement?.type === 'ul' ||
              selectedElement?.type === 'li'
            ) {
              ungroupSelected(selectedElement.id);
            }
          }}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ungroup
        </button>
      </div>
    </header>
  );
}
