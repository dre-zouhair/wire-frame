import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { getDescendants } from '@/utils/geometry';

function isTextEntryTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) {
    return false;
  }

  const tagName = element.tagName?.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || Boolean(element.isContentEditable);
}

export function useKeyboardShortcuts() {
  const elements = useStore((state) => state.elements);
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const deleteSelected = useStore((state) => state.deleteSelected);
  const copy = useStore((state) => state.copy);
  const paste = useStore((state) => state.paste);
  const duplicate = useStore((state) => state.duplicate);
  const setSelection = useStore((state) => state.setSelection);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isTextEntry = isTextEntryTarget(event.target);
      if (isTextEntry) {
        return;
      }

      const isSelectAll = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a';
      const isCopy = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c';
      const isPaste = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v';
      const isDuplicate = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd';
      const isRedo =
        (event.metaKey || event.ctrlKey) &&
        ((event.shiftKey && event.key.toLowerCase() === 'z') || event.key.toLowerCase() === 'y');
      const isUndo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !event.shiftKey;
      const isDelete = event.key === 'Delete' || event.key === 'Backspace';

      if (!(isSelectAll || isCopy || isPaste || isDuplicate || isRedo || isUndo || isDelete)) {
        return;
      }

      event.preventDefault();

      if (isSelectAll) {
        const allIds = getDescendants(elements, activeArtboardId).map((element) => element.id);
        setSelection(allIds);
        return;
      }

      if (isCopy) {
        copy();
        return;
      }

      if (isPaste) {
        paste();
        return;
      }

      if (isDuplicate) {
        duplicate();
        return;
      }

      if (isUndo) {
        useStore.temporal.getState().undo();
        return;
      }

      if (isRedo) {
        useStore.temporal.getState().redo();
        return;
      }

      deleteSelected();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeArtboardId, copy, deleteSelected, duplicate, elements, paste, setSelection]);
}
