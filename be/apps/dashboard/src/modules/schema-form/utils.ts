import type { UiFieldNode, UiNode } from './types'

export const collectFieldNodes = <Key extends string>(
  nodes: ReadonlyArray<UiNode<Key>>,
): UiFieldNode<Key>[] => {
  const fields: UiFieldNode<Key>[] = []

  for (const node of nodes) {
    if (node.type === 'field') {
      fields.push(node)
      continue
    }

    fields.push(...collectFieldNodes(node.children))
  }

  return fields
}
