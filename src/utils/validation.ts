import type { WireframeElement } from '@/store/useStore';
import { getElementChildren } from './geometry';
import { canContainChild, isSemanticContainerType } from './semantic-html';

export type ValidationSeverity = 'warning' | 'error';

export interface ValidationWarning {
  id: string;
  severity: ValidationSeverity;
  message: string;
}

function pushWarning(
  warnings: ValidationWarning[],
  elementId: string,
  severity: ValidationSeverity,
  message: string
) {
  warnings.push({ id: elementId, severity, message });
}

export function validateDocument(elements: WireframeElement[]) {
  const warnings: ValidationWarning[] = [];

  const counts = new Map<string, number>();
  for (const element of elements) {
    counts.set(element.id, (counts.get(element.id) ?? 0) + 1);
  }
  for (const [id, count] of counts) {
    if (count > 1) {
      pushWarning(warnings, id, 'error', 'Duplicate element id detected.');
    }
  }

  for (const element of elements) {
    const children = getElementChildren(elements, element.id);

    if (element.type === 'input' && children.length > 0) {
      pushWarning(warnings, element.id, 'error', 'Inputs cannot contain child elements.');
    }

    if (element.type === 'button' && children.length > 0) {
      const invalidChildren = children.filter((child) => child.type !== 'icon' && child.type !== 'text');
      if (invalidChildren.length > 0) {
        pushWarning(
          warnings,
          element.id,
          'warning',
          'Buttons should only contain text and icon content.'
        );
      }
    }

    if (element.type === 'label' && !element.labelFor) {
      pushWarning(warnings, element.id, 'warning', 'Labels should target a control using labelFor.');
    }

    if ((element.type === 'img' || element.type === 'image-placeholder') && !element.alt) {
      pushWarning(warnings, element.id, 'warning', 'Images should include alt text.');
    }

    for (const child of children) {
      if (!canContainChild(element.type, child.type)) {
        pushWarning(
          warnings,
          child.id,
          'error',
          `${element.type} cannot contain ${child.type} elements.`
        );
      }
    }

    if (isSemanticContainerType(element.type)) {
      const nestedLists = children.filter((child) => child.type === 'li');
      if (element.type !== 'ul' && nestedLists.length > 0) {
        pushWarning(warnings, element.id, 'error', 'List items must live directly inside a ul.');
      }
    }

    if (element.type === 'ul') {
      const invalid = children.filter((child) => child.type !== 'li');
      if (invalid.length > 0) {
        pushWarning(warnings, element.id, 'error', 'Unordered lists may only contain list items.');
      }
    }
  }

  return warnings;
}

export function validateElement(element: WireframeElement | null, elements: WireframeElement[]) {
  if (!element) {
    return [];
  }

  return validateDocument(elements).filter((warning) => warning.id === element.id);
}
