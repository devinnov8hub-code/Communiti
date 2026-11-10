import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { cn } from '@/lib/cn'
import type { Highlight } from '../types'

/**
 * Photo mosaic from Figma "photo feed". Images repeat in a 10-photo cycle:
 * [2 small | 1 tall] · [half | half] · [1 tall | 2 small] · [half | half]
 */
export function HighlightsMosaic({ highlights }: { highlights: Highlight[] }) {
  const blocks: { kind: 'tall-right' | 'halves' | 'tall-left'; items: Highlight[] }[] = []
  const pattern = [
    ['tall-right', 3],
    ['halves', 2],
    ['tall-left', 3],
    ['halves', 2],
  ] as const
  let index = 0
  let step = 0
  while (index < highlights.length) {
    const [kind, size] = pattern[step % pattern.length]
    blocks.push({ kind, items: highlights.slice(index, index + size) })
    index += size
    step += 1
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      {blocks.map((block, blockIndex) =>
        block.kind === 'halves' ? (
          <div key={blockIndex} className="grid grid-cols-2 gap-1.5">
            {block.items.map((item) => (
              <Tile key={item.id} highlight={item} className="h-[89px]" />
            ))}
          </div>
        ) : (
          <div
            key={blockIndex}
            className={cn(
              'grid grid-rows-[89px_89px] gap-1.5',
              block.kind === 'tall-right' ? 'grid-cols-[42.26fr_55.91fr]' : 'grid-cols-[55.91fr_42.26fr]',
            )}
          >
            {block.items.map((item, itemIndex) => {
              const tall = block.kind === 'tall-right' ? itemIndex === 2 : itemIndex === 0
              return (
                <Tile
                  key={item.id}
                  highlight={item}
                  className={cn(
                    tall ? 'row-span-2 h-[184px]' : 'h-[89px]',
                    block.kind === 'tall-right' && tall && 'col-start-2 row-start-1',
                    block.kind === 'tall-right' && !tall && 'col-start-1',
                  )}
                />
              )
            })}
          </div>
        ),
      )}
    </div>
  )
}

function Tile({ highlight, className }: { highlight: Highlight; className?: string }) {
  return (
    <Link
      to={paths.highlight(highlight.id)}
      aria-label={
        highlight.images.length > 1 ? `${highlight.title} (${highlight.images.length} photos)` : highlight.title
      }
      className={cn('group relative block overflow-hidden rounded-md bg-surface', className)}
    >
      <img
        src={highlight.imageUrl}
        alt=""
        loading="lazy"
        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {/* Albums with more photos say how many more are inside. */}
      {highlight.images.length > 1 && (
        <span
          aria-hidden
          className="absolute right-1.5 bottom-1.5 rounded-full bg-black/60 px-2 py-0.5 text-caption text-white"
        >
          +{highlight.images.length - 1}
        </span>
      )}
    </Link>
  )
}
