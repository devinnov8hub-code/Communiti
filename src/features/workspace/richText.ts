/**
 * Research documents are stored as TipTap/ProseMirror JSON. The web editor is plain text for now, so
 * these convert between the two: one paragraph per line on save, and the text of every node on read
 * (so documents written with formatting elsewhere still show their words).
 */

interface RichNode {
  type?: string
  text?: string
  content?: RichNode[]
}

/** Each of these ends a line (an empty paragraph is a blank line). */
const LINES = new Set(['paragraph', 'heading', 'codeBlock'])

export function textToRichText(text: string): RichNode {
  return {
    type: 'doc',
    content: text
      .split('\n')
      .map((line) => (line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' })),
  }
}

export function richTextToText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!content || typeof content !== 'object') return ''

  const lines: string[] = []
  let line = ''
  const walk = (node: RichNode) => {
    if (node.type === 'hardBreak') {
      lines.push(line)
      line = ''
      return
    }
    if (typeof node.text === 'string') line += node.text
    node.content?.forEach(walk)
    if (node.type && LINES.has(node.type)) {
      lines.push(line)
      line = ''
    }
  }
  walk(content as RichNode)
  if (line) lines.push(line)
  return lines.join('\n').trim()
}
