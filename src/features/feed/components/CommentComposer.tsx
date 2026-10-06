import { Image, Paperclip, X } from '@phosphor-icons/react'
import { useRef, useState, type FormEvent } from 'react'
import { Avatar, IconButton, Spinner, useToast } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getDisplayName } from '@/features/auth/user'
import { getErrorMessage } from '@/lib/api/errors'
import { useAddComment } from '../hooks/queries'

/** "Write a comment..." bar with image / file attachments. */
export function CommentComposer({ postId }: { postId: string }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const imageInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const addComment = useAddComment()
  const toast = useToast()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!content.trim() && files.length === 0) return
    addComment.mutate(
      { postId, content: content.trim(), attachments: files },
      {
        onSuccess: () => {
          setContent('')
          setFiles([])
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    )
  }

  const onPick = (list: FileList | null) => list && setFiles((current) => [...current, ...Array.from(list)])

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-2">
      <div className="flex w-full items-center justify-between gap-3 rounded-full bg-surface px-5 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-[19px]">
          {user && (
            <Avatar src={user.avatarUrl} name={getDisplayName(user)} size={40} className="hidden sm:inline-flex" />
          )}
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write a comment..."
            aria-label="Write a comment"
            disabled={addComment.isPending}
            className="min-w-0 flex-1 bg-transparent text-body-s text-fg outline-none placeholder:text-fg-muted"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 text-fg">
          {addComment.isPending ? (
            <Spinner className="size-5 text-brand-orange" />
          ) : (
            <>
              <IconButton label="Attach image" onClick={() => imageInput.current?.click()} className="size-6">
                <Image className="size-6" />
              </IconButton>
              <IconButton label="Attach file" onClick={() => fileInput.current?.click()} className="size-6">
                <Paperclip className="size-6" />
              </IconButton>
            </>
          )}
        </div>
        <input ref={imageInput} type="file" accept="image/*" hidden onChange={(e) => onPick(e.target.files)} />
        <input ref={fileInput} type="file" hidden onChange={(e) => onPick(e.target.files)} />
        {/* Enter submits; the button keeps it accessible. */}
        <button type="submit" className="sr-only">
          Send comment
        </button>
      </div>
      {files.length > 0 && (
        <AttachmentList files={files} onRemove={(file) => setFiles((f) => f.filter((x) => x !== file))} />
      )}
    </form>
  )
}

export function AttachmentList({ files, onRemove }: { files: File[]; onRemove: (file: File) => void }) {
  return (
    <ul className="flex flex-wrap gap-2 px-2">
      {files.map((file) => (
        <li
          key={`${file.name}-${file.lastModified}`}
          className="flex items-center gap-1 rounded-full bg-brand-orange-tint py-1 pr-1 pl-3 text-caption text-brand-orange"
        >
          <span className="max-w-[180px] truncate">{file.name}</span>
          <IconButton label={`Remove ${file.name}`} onClick={() => onRemove(file)} className="size-5">
            <X className="size-3" />
          </IconButton>
        </li>
      ))}
    </ul>
  )
}
