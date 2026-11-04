import { CameraIcon, CaretDownIcon, Image as ImageIcon, PaperclipIcon } from '@phosphor-icons/react'
import { useRef, useState, type FormEvent } from 'react'
import { Avatar, IconButton, Menu, MenuRadioItem, Spinner, useToast } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getDisplayName } from '@/features/auth/user'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { useCreatePost } from '../hooks/queries'
import type { Audience } from '../types'
import { AttachmentList } from './CommentComposer'

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  // "Following" in the design; the backend value is `followers` (only people who follow you see it).
  { value: 'followers', label: 'Following' },
]

const MAX_LENGTH = 3000

interface CreatePostProps {
  /** Post inside this forum (Figma "create a post" sheet): no audience choice, sized for a modal. */
  forumId?: string
  onPosted?: () => void
}

/** "Write Something..." composer at the top of the feed (Figma "create post"). */
export function CreatePost({ forumId, onPosted }: CreatePostProps = {}) {
  const { user } = useAuth()
  const toast = useToast()
  const createPost = useCreatePost()
  const [content, setContent] = useState('')
  const [audience, setAudience] = useState<Audience>('everyone')
  const [files, setFiles] = useState<File[]>([])
  const imageInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)

  const canPost = (content.trim().length > 0 || files.length > 0) && !createPost.isPending

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!canPost) return
    createPost.mutate(
      { content: content.trim(), audience, attachments: files, forumId },
      {
        onSuccess: () => {
          setContent('')
          setFiles([])
          toast('Your post is live')
          onPosted?.()
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    )
  }

  const onPick = (list: FileList | null) => list && setFiles((current) => [...current, ...Array.from(list)])
  const audienceLabel = AUDIENCES.find((item) => item.value === audience)?.label

  return (
    <form
      onSubmit={submit}
      aria-label="Create a post"
      className={cn(
        'flex flex-col gap-gap-md',
        !forumId && 'border-b border-hairline bg-background px-4 py-2.5 sm:px-5',
      )}
    >
      <div className="flex items-start gap-4 sm:gap-5">
        {user && (
          <Avatar src={user.avatarUrl} name={getDisplayName(user)} size={58} className="size-12 sm:size-[58px]" />
        )}
        <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
          {!forumId && (
            <Menu
              align="start"
              trigger={
                <button
                  type="button"
                  aria-label={`Audience: ${audienceLabel}`}
                  className="flex items-center gap-2 rounded-full border border-grey-40/60 px-3 py-2 text-caption font-semibold text-brand-orange"
                >
                  {audienceLabel}
                  <CaretDownIcon aria-hidden className="size-3.5" />
                </button>
              }
            >
              {(close) =>
                AUDIENCES.map((item) => (
                  <MenuRadioItem
                    key={item.value}
                    checked={item.value === audience}
                    onSelect={() => {
                      setAudience(item.value)
                      close()
                    }}
                  >
                    {item.label}
                  </MenuRadioItem>
                ))
              }
            </Menu>
          )}
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write Something..."
            aria-label="Write something"
            maxLength={MAX_LENGTH}
            rows={1}
            autoFocus={Boolean(forumId)}
            className={cn(
              'field-sizing-content max-h-72 w-full resize-none',
              forumId ? 'mt-[17px] min-h-[200px]' : 'min-h-[26px]',
              'bg-transparent text-body-m text-fg outline-none placeholder:text-fg-muted sm:text-body-l',
            )}
          />
        </div>
      </div>

      {files.length > 0 && (
        <AttachmentList files={files} onRemove={(file) => setFiles((f) => f.filter((x) => x !== file))} />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 text-brand-orange">
          <IconButton label="Add photo" onClick={() => imageInput.current?.click()} className="h-6 w-8">
            <ImageIcon className="h-6 w-8" />
          </IconButton>
          <IconButton label="Attach file" onClick={() => fileInput.current?.click()} className="h-6 w-8">
            <PaperclipIcon className="h-6 w-8" />
          </IconButton>
          <IconButton label="Take a photo" onClick={() => cameraInput.current?.click()} className="h-6 w-8">
            <CameraIcon className="h-6 w-8" />
          </IconButton>
        </div>
        <button
          type="submit"
          aria-disabled={!canPost}
          className="flex w-[75px] items-center justify-center rounded-full bg-brand-orange px-2 py-[5px] text-body-l text-white transition hover:brightness-95 disabled:opacity-60"
        >
          {createPost.isPending ? <Spinner className="size-[22px]" /> : 'Post'}
        </button>
      </div>

      <input ref={imageInput} type="file" accept="image/*" multiple hidden onChange={(e) => onPick(e.target.files)} />
      <input ref={fileInput} type="file" multiple hidden onChange={(e) => onPick(e.target.files)} />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => onPick(e.target.files)}
      />
    </form>
  )
}
