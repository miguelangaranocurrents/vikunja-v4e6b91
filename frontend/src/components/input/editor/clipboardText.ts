import type {Fragment, Node as ProseMirrorNode} from '@tiptap/pm/model'

function leafText(node: ProseMirrorNode): string {
	const href = node.attrs?.href
	return typeof href === 'string' ? href : ''
}

function inlineText(node: ProseMirrorNode): string {
	return node.textBetween(0, node.content.size, '\n', leafText)
}

function serializeListItem(item: ProseMirrorNode, marker: string): string {
	const indent = ' '.repeat(marker.length)
	const parts: string[] = []
	item.forEach((child, _offset, index) => {
		const text = serializeNode(child)
		if (index === 0) {
			parts.push(text)
		} else {
			parts.push(text.split('\n').map(line => line === '' ? line : indent + line).join('\n'))
		}
	})
	return marker + parts.join('\n')
}

function serializeNode(node: ProseMirrorNode): string {
	switch (node.type.name) {
		case 'bulletList': {
			const items: string[] = []
			node.forEach(item => items.push(serializeListItem(item, '- ')))
			return items.join('\n')
		}
		case 'orderedList': {
			const start = typeof node.attrs.start === 'number' ? node.attrs.start : 1
			const items: string[] = []
			node.forEach((item, _offset, index) => items.push(serializeListItem(item, `${start + index}. `)))
			return items.join('\n')
		}
		case 'taskList': {
			const items: string[] = []
			node.forEach(item => items.push(serializeListItem(item, item.attrs.checked ? '- [x] ' : '- [ ] ')))
			return items.join('\n')
		}
	}

	if (node.isLeaf) {
		return leafText(node)
	}
	if (node.isTextblock) {
		return inlineText(node)
	}

	return serializeFragment(node.content)
}

export function serializeFragment(fragment: Fragment): string {
	const blocks: string[] = []
	fragment.forEach(node => {
		blocks.push(serializeNode(node))
	})
	return blocks.join('\n\n')
}
