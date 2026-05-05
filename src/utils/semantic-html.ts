export type SemanticElementType =
  | 'div'
  | 'section'
  | 'header'
  | 'main'
  | 'footer'
  | 'nav'
  | 'aside'
  | 'article'
  | 'ul'
  | 'li'
  | 'img';

export const SEMANTIC_CONTAINER_TYPES = new Set<SemanticElementType>([
  'div',
  'section',
  'header',
  'main',
  'footer',
  'nav',
  'aside',
  'article',
  'ul',
  'li',
]);

export const SEMANTIC_LIST_TYPES = new Set<SemanticElementType>(['ul', 'li']);
export const SEMANTIC_LEAF_TYPES = new Set<SemanticElementType>(['img']);

export function isSemanticContainerType(type: string) {
  return SEMANTIC_CONTAINER_TYPES.has(type as SemanticElementType);
}

export function canContainChild(parentType: string, childType: string) {
  if (parentType === 'artboard' || parentType === 'container' || parentType === 'box') {
    return childType !== 'artboard' && childType !== 'instance' && childType !== 'li';
  }

  if (!isSemanticContainerType(parentType)) {
    return false;
  }

  if (parentType === 'ul') {
    return childType === 'li';
  }

  if (parentType === 'li') {
    return childType !== 'artboard' && childType !== 'instance' && childType !== 'li';
  }

  return childType !== 'artboard' && childType !== 'instance' && childType !== 'li';
}

export function getDefaultSemanticName(type: SemanticElementType) {
  switch (type) {
    case 'div':
      return 'Div';
    case 'section':
      return 'Section';
    case 'header':
      return 'Header';
    case 'main':
      return 'Main';
    case 'footer':
      return 'Footer';
    case 'nav':
      return 'Nav';
    case 'aside':
      return 'Aside';
    case 'article':
      return 'Article';
    case 'ul':
      return 'List';
    case 'li':
      return 'List Item';
    case 'img':
      return 'Image';
    default:
      return type;
  }
}
