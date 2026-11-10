import { Check } from '@phosphor-icons/react'
import { useState } from 'react'
import { Modal } from '@/components/ui'
import { TopicIcon } from '@/features/feed/components/TopicIcon'
import { useSearchTopics } from '@/features/feed/hooks/queries'
import { cn } from '@/lib/cn'

interface SortTopicsModalProps {
  open: boolean
  /** Topic ids. */
  selected: string[]
  onApply: (topicIds: string[]) => void
  onClose: () => void
}

/** "Sort based on topics" dialog (Figma "featured INnov filter"). */
export function SortTopicsModal({ open, selected, onApply, onClose }: SortTopicsModalProps) {
  const topics = useSearchTopics()
  const [draft, setDraft] = useState(selected)

  const toggle = (id: string) =>
    setDraft((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  return (
    <Modal open={open} onClose={onClose} title="Sort based on topics" gap="md" className="[&_h2]:text-body-l">
      <ul className="-mt-2 flex flex-col gap-2">
        {topics.data?.map((topic, index) => {
          const checked = draft.includes(topic.id)
          return (
            <li key={topic.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(topic.id)}
                className="flex w-full items-center gap-[7px] border-b border-surface py-2.5 text-left last:border-b-0"
              >
                <TopicIcon slug={topic.slug} index={index} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-body-s font-semibold text-fg">{topic.name}</span>
                  <span className="text-caption text-fg-muted">{topic.description}</span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full border-2 transition-colors',
                    checked ? 'border-brand-orange bg-brand-orange text-white' : 'border-hairline',
                  )}
                >
                  {checked && <Check weight="bold" className="size-3" />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="flex gap-2.5 px-2.5 pt-2">
        <button
          type="button"
          onClick={() => setDraft([])}
          className="h-[38px] flex-1 rounded-full border border-border-default text-body-l text-fg hover:bg-fg/5"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            onApply(draft)
            onClose()
          }}
          className="h-[38px] flex-1 rounded-full bg-brand-orange text-body-l text-white hover:brightness-95"
        >
          Apply
        </button>
      </div>
    </Modal>
  )
}
