import { Minus, Plus, X } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Button, Modal, SearchField, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { useSetSkills, useSkillOptions } from '../hooks/queries'
import { SKILL_CATEGORIES, type SkillCategory } from '../types'

const MAX_SKILLS = 10

/** "Add Skills" sheet: selected chips, search, category filter and add/remove list. */
export function AddSkillsModal({ initial, onClose }: { initial: string[]; onClose: () => void }) {
  const [selected, setSelected] = useState(initial)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<SkillCategory>('All')
  const options = useSkillOptions()
  const save = useSetSkills()
  const toast = useToast()

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = (options.data ?? []).filter(
      (option) => (category === 'All' || option.category === category) && option.name.toLowerCase().includes(q),
    )
    // Offer the typed text as a custom skill when it isn't in the list.
    const custom = query.trim()
    if (custom && !list.some((option) => option.name.toLowerCase() === q)) {
      return [{ name: custom, category: 'Tech' as const }, ...list]
    }
    return list
  }, [options.data, query, category])

  const has = (name: string) => selected.some((skill) => skill.toLowerCase() === name.toLowerCase())
  const toggle = (name: string) => {
    if (has(name)) setSelected((current) => current.filter((skill) => skill.toLowerCase() !== name.toLowerCase()))
    else if (selected.length >= MAX_SKILLS) toast(`You can add up to ${MAX_SKILLS} skills`)
    else setSelected((current) => [...current, name])
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Skills"
      divided
      footer={
        <Button
          loading={save.isPending}
          onClick={() =>
            save.mutate(selected, {
              onSuccess: () => {
                toast('Skills updated')
                onClose()
              },
              onError: (error) => toast(getErrorMessage(error)),
            })
          }
          className="h-[38px] rounded-full bg-brand-orange font-normal"
        >
          Save
        </Button>
      }
    >
      {selected.length > 0 && (
        <ul aria-label="Selected skills" className="-mt-1 flex flex-wrap gap-x-[17px] gap-y-2">
          {selected.map((skill) => (
            <li key={skill}>
              <button
                type="button"
                onClick={() => toggle(skill)}
                aria-label={`Remove ${skill}`}
                className="flex items-center gap-1.5 rounded-search bg-brand-orange-soft px-2 py-[5px] text-body-m text-white"
              >
                <X aria-hidden className="size-3.5" />
                {skill}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-gap-sm">
        <p className="text-body-l text-fg">Add a skill to your profile.</p>
        <SearchField
          size="sm"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          className="border-grey-40"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-[23px]">
          <p className="text-body-m font-semibold text-fg">All Skills</p>
          <div role="tablist" aria-label="Skill categories" className="flex gap-3 overflow-x-auto px-5 py-2.5">
            {SKILL_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={item === category}
                onClick={() => setCategory(item)}
                className={cn(
                  'min-w-[60px] shrink-0 rounded-full p-2 text-caption transition-colors',
                  item === category ? 'bg-brand-orange text-white' : 'text-fg-muted hover:text-fg',
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <ul className="flex flex-col gap-1">
          {visible.map((option) => {
            const on = has(option.name)
            return (
              <li
                key={option.name}
                className="flex items-center justify-between border-b border-hairline px-2 py-[5px] last:border-b-0"
              >
                <span className="text-body-s text-fg">{option.name}</span>
                <button
                  type="button"
                  aria-label={on ? `Remove ${option.name}` : `Add ${option.name}`}
                  aria-pressed={on}
                  onClick={() => toggle(option.name)}
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full',
                    on ? 'bg-brand-orange text-white' : 'border border-hairline bg-offwhite text-grey-50',
                  )}
                >
                  {on ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </Modal>
  )
}
