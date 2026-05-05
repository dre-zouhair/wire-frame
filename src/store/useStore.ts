import { create } from 'zustand';

export type ElementType = 'box' | 'text' | 'button' | 'image-placeholder' | 'input';

export interface WireframeElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
}

export interface AppState {
  elements: WireframeElement[];
  selectedId: string | null;
  addElement: (type: ElementType) => void;
  updateElement: (id: string, newProps: Partial<WireframeElement>) => void;
  selectElement: (id: string | null) => void;
  deleteSelected: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export const useStore = create<AppState>((set) => ({
  elements: [],
  selectedId: null,

  addElement: (type: ElementType) =>
    set((state) => {
      const defaults: Record<ElementType, Omit<WireframeElement, 'id' | 'type'>> = {
        box: { x: 100, y: 100, width: 200, height: 150 },
        text: { x: 100, y: 100, width: 200, height: 40, text: 'Text Element' },
        button: { x: 100, y: 100, width: 120, height: 40, text: 'Button' },
        'image-placeholder': { x: 100, y: 100, width: 200, height: 150 },
        input: { x: 100, y: 100, width: 200, height: 40, text: 'Input value' },
      };

      const newElement: WireframeElement = {
        id: generateId(),
        type,
        ...defaults[type],
      };

      return {
        elements: [...state.elements, newElement],
        selectedId: newElement.id,
      };
    }),

  updateElement: (id: string, newProps: Partial<WireframeElement>) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...newProps } : el
      ),
    })),

  selectElement: (id: string | null) =>
    set(() => ({
      selectedId: id,
    })),

  deleteSelected: () =>
    set((state) => {
      if (!state.selectedId) return state;
      return {
        elements: state.elements.filter((el) => el.id !== state.selectedId),
        selectedId: null,
      };
    }),
}));
