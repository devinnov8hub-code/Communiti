import { ChatCenteredText, Check, DotsThree, DotsThreeOutlineVertical, Trash } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { Button, IconButton, Menu, MenuItem, Spinner, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/client'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useCommentOnResearch, useCreateResearch, useDeleteResearch, useResearch } from '../hooks/queries'
import type { ResearchDoc } from '../types'
import { CommentBar, TabState, WorkspaceAction } from './shared'

/** Research documents: list on the left, reader / editor on the right (Figma "Research"). */
export function ResearchTab({ projectId }: { projectId: string }) {
  const docs = useResearch(projectId)
  const remove = useDeleteResearch(projectId)
  const toast = useToast()
  const [selectedId, setSelectedId] = useState<string>()
  const [writing, setWriting] = useState(false)
  const viewer = useRef<HTMLElement>(null)

  const selected = docs.data?.find((doc) => doc.id === selectedId) ?? docs.data?.[0]

  const show = (id: string) => {
    setWriting(false)
    setSelectedId(id)
    // On stacked (mobile) layouts, bring the reader into view.
    if (window.matchMedia('(max-width: 1023px)').matches) viewer.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const deleteDoc = (doc: ResearchDoc) =>
    remove.mutate(doc.id, {
      onSuccess: () => {
        toast(`“${doc.title}” deleted`)
        if (doc.id === selectedId) setSelectedId(undefined)
      },
      onError: (error) => toast(getErrorMessage(error)),
    })

  return (
    <div className="flex flex-col gap-gap-sm">
      <WorkspaceAction
        onClick={() => {
          setWriting(true)
          viewer.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }}
      >
        New Document
      </WorkspaceAction>

      {docs.isPending ? (
        <TabState>
          <Spinner className="text-brand-orange" />
        </TabState>
      ) : docs.isError ? (
        <TabState>{getErrorMessage(docs.error)}</TabState>
      ) : (
        <div className="grid border-t border-hairline lg:min-h-[659px] lg:grid-cols-[minmax(0,546px)_minmax(0,1fr)] lg:gap-3">
          <ul className="flex flex-col gap-2 py-2">
            {docs.data.length === 0 && (
              <li className="py-10 text-center text-body-m text-fg-muted">No research documents yet.</li>
            )}
            {docs.data.map((doc) => (
              <li
                key={doc.id}
                className={cn(
                  'flex items-start gap-2 border-b border-grey-30 px-[3px] py-2 last:border-b-0 dark:border-hairline',
                  doc.id === selected?.id && !writing && 'bg-fg/[0.03]',
                )}
              >
                <button
                  type="button"
                  onClick={() => show(doc.id)}
                  aria-current={doc.id === selected?.id && !writing ? 'true' : undefined}
                  className="flex min-w-0 flex-1 items-center gap-1 text-left"
                >
                  {doc.thumbnailUrl ? (
                    <img src={doc.thumbnailUrl} alt="" className="h-[62px] w-16 shrink-0 rounded-sm object-cover" />
                  ) : (
                    <span aria-hidden className="h-[62px] w-16 shrink-0 rounded-sm bg-grey-30" />
                  )}
                  <span className="flex min-w-0 flex-col gap-[5px]">
                    <span className="truncate text-body-m text-fg">{doc.title}</span>
                    <span className="text-body-s text-grey-40 dark:text-fg-body">
                      Updated by: {doc.updatedBy}&nbsp;&nbsp;{timeAgo(doc.updatedAt)}
                    </span>
                  </span>
                </button>
                <DocMenu
                  trigger={
                    <IconButton label={`Actions for ${doc.title}`} className="size-7 text-fg">
                      <DotsThree weight="bold" className="size-6" />
                    </IconButton>
                  }
                  onOpen={() => show(doc.id)}
                  onDelete={() => deleteDoc(doc)}
                />
              </li>
            ))}
          </ul>

          <section
            ref={viewer}
            aria-label={writing ? 'New document' : 'Document'}
            className="flex min-h-[480px] scroll-mt-20 flex-col justify-between gap-6 border-t border-hairline px-5 py-2.5 lg:border-t-0 lg:border-l"
          >
            {writing ? (
              <ResearchEditor
                projectId={projectId}
                onDone={(doc) => {
                  setWriting(false)
                  if (doc) setSelectedId(doc.id)
                }}
              />
            ) : selected ? (
              <ResearchReader projectId={projectId} doc={selected} onDelete={() => deleteDoc(selected)} />
            ) : (
              <p className="m-auto text-body-m text-fg-muted">Select a document to read it.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function DocMenu({
  trigger,
  onOpen,
  onDelete,
}: {
  trigger: Parameters<typeof Menu>[0]['trigger']
  onOpen?: () => void
  onDelete: () => void
}) {
  return (
    <Menu trigger={trigger} className="w-[200px]">
      {(close) => (
        <>
          {onOpen && (
            <MenuItem
              size="sm"
              icon={<ChatCenteredText />}
              onSelect={() => {
                close()
                onOpen()
              }}
            >
              Open
            </MenuItem>
          )}
          <MenuItem
            size="sm"
            tone="danger"
            icon={<Trash />}
            onSelect={() => {
              close()
              onDelete()
            }}
          >
            Delete document
          </MenuItem>
        </>
      )}
    </Menu>
  )
}

function ResearchReader({ projectId, doc, onDelete }: { projectId: string; doc: ResearchDoc; onDelete: () => void }) {
  const comment = useCommentOnResearch(projectId)
  const toast = useToast()

  return (
    <>
      <div className="flex flex-col gap-gap-md">
        <div className="flex justify-end">
          <DocMenu
            trigger={
              <IconButton label="Document actions" className="size-10 bg-black/5 text-fg dark:bg-white/10">
                <DotsThreeOutlineVertical weight="fill" className="size-6" />
              </IconButton>
            }
            onDelete={onDelete}
          />
        </div>
        <div className="flex flex-col gap-[23px]">
          <div className="flex flex-col gap-[11px]">
            <h2 className="text-body-l font-semibold text-fg">{doc.title}</h2>
            <p className="text-body-s text-grey-40 dark:text-fg-body">
              Updated by: {doc.updatedBy}&nbsp;&nbsp;{timeAgo(doc.updatedAt)}
            </p>
            <p className="flex items-center gap-1 text-body-s text-info-strong dark:text-info">
              <ChatCenteredText aria-hidden className="size-6" />
              {doc.commentsCount} {doc.commentsCount === 1 ? 'Comment' : 'Comments'}
            </p>
          </div>
          <p className="text-body-m whitespace-pre-line text-fg">{doc.body}</p>
        </div>
      </div>
      <CommentBar
        pending={comment.isPending}
        onSubmit={(text) =>
          comment.mutateAsync(
            { docId: doc.id, text },
            { onSuccess: () => toast('Comment added'), onError: (error) => toast(getErrorMessage(error)) },
          )
        }
      />
    </>
  )
}

/** Blank document with an inline title and body (Figma "Write a document"). */
function ResearchEditor({ projectId, onDone }: { projectId: string; onDone: (doc?: ResearchDoc) => void }) {
  const create = useCreateResearch(projectId)
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const canSave = title.trim().length > 0 && body.trim().length > 0

  const save = () =>
    create.mutate(
      { title: title.trim(), body: body.trim() },
      {
        onSuccess: (doc) => {
          toast('Document saved')
          onDone(doc)
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    )

  return (
    <div className="flex flex-1 flex-col gap-gap-md">
      <div className="flex items-center justify-between gap-3">
        <IconButton
          label="Save document"
          onClick={save}
          disabled={!canSave || create.isPending}
          className="size-10 bg-black/5 text-brand-orange dark:bg-white/10"
        >
          {create.isPending ? <Spinner /> : <Check weight="bold" className="size-5" />}
        </IconButton>
        <Button
          variant="outline"
          fullWidth={false}
          onClick={() => onDone()}
          className="h-9 rounded-full px-4 text-body-s font-normal"
        >
          Discard
        </Button>
      </div>
      <input
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Research title"
        aria-label="Research title"
        className="bg-transparent text-body-l font-medium text-fg outline-none placeholder:text-grey-40"
      />
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Research body"
        aria-label="Research body"
        className="min-h-[320px] flex-1 resize-none bg-transparent text-body-s text-fg caret-brand-orange outline-none placeholder:text-grey-40"
      />
    </div>
  )
}
