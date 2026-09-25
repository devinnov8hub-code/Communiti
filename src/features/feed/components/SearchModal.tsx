import { CaretRight } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, SearchField } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useSearchTopics } from '../hooks/queries'
import type { SearchTopicTone } from '../types'
import { searchUrl } from '../searchUrl'

const TONES: Record<SearchTopicTone, string> = {
  green: 'bg-brand-green-tint',
  blue: 'bg-info-tint',
  orange: 'bg-brand-orange-tint',
}

/** "Search" dialog — keyword search plus browse-by-topic (Figma "search modal"). */
export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const topics = useSearchTopics()
  const [query, setQuery] = useState('')

  const go = (topic?: string) => {
    onClose()
    navigate(searchUrl(query, topic))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (query.trim()) go()
  }

  return (
    <Modal open={open} onClose={onClose} title="Search" gap="sm">
      <form role="search" onSubmit={submit}>
        <SearchField
          size="sm"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a keyword, name or topic..."
        />
      </form>

      <section className="mt-2.5 flex flex-col gap-2">
        <header className="flex items-center justify-between">
          <h3 className="text-body-m font-semibold text-fg">Search in Topics</h3>
          <button type="button" onClick={() => setQuery('')} className="text-caption text-brand-orange underline">
            Clear All
          </button>
        </header>
        <ul className="flex flex-col gap-2">
          {topics.data?.map((topic) => (
            <li key={topic.id}>
              <button
                type="button"
                onClick={() => go(topic.id)}
                className="flex w-full items-center justify-between gap-3 border-b border-surface py-2.5 text-left hover:opacity-80"
              >
                <span className="flex min-w-0 items-center gap-[7px]">
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full p-[3px]',
                      TONES[topic.tone],
                    )}
                  >
                    <img src={topic.iconUrl} alt="" width={22} height={22} className="size-[22px]" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-body-s font-semibold text-fg">{topic.name}</span>
                    <span className="text-caption text-fg-muted">{topic.description}</span>
                  </span>
                </span>
                <CaretRight aria-hidden className="size-[18px] shrink-0 text-fg" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </Modal>
  )
}
