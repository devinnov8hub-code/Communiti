import { Camera, CaretDown, Image as ImageIcon, Paperclip } from '@phosphor-icons/react'
import { useRef, useState, type FormEvent } from 'react'
import { Avatar, IconButton, Menu, MenuRadioItem, Spinner, useToast } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getDisplayName } from '@/features/auth/user'
import { getErrorMessage } from '@/lib/api/errors'
import { useCreatePost } from '../hooks/queries'
import type { Audience } from '../types'
import { AttachmentList } from './CommentComposer'

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'followers', label: 'Followers' },
]

const MAX_LENGTH = 3000

/** "Write Something..." composer at the top of the feed (Figma "create post"). */
export function CreatePost() {
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
      { content: content.trim(), audience, attachments: files },
      {
        onSuccess: () => {
          setContent('')
          setFiles([])
          toast('Your post is live')
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
      className="flex flex-col gap-gap-md border-b border-hairline bg-background px-4 py-2.5 sm:px-5"
    >
      <div className="flex items-start gap-4 sm:gap-5">
        {user && (
          <Avatar src={user.avatarUrl} name={getDisplayName(user)} size={58} className="size-12 sm:size-[58px]" />
        )}
        <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
          <Menu
            align="start"
            trigger={
              <button
                type="button"
                aria-label={`Audience: ${audienceLabel}`}
                className="flex items-center gap-2 rounded-full border border-grey-40/60 px-3 py-2 text-caption font-semibold text-brand-orange"
              >
                {audienceLabel}
                <CaretDown aria-hidden className="size-3.5" />
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
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write Something..."
            aria-label="Write something"
            maxLength={MAX_LENGTH}
            rows={1}
            className="field-sizing-content max-h-72 min-h-[26px] w-full resize-none bg-transparent text-body-m text-fg outline-none placeholder:text-fg-muted sm:text-body-l"
          />
        </div>
      </div>

      {files.length > 0 && (
        <AttachmentList files={files} onRemove={(file) => setFiles((f) => f.filter((x) => x !== file))} />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 text-brand-orange">
          <IconButton label="Add photo" onClick={() => imageInput.current?.click()} className="size-[34px]">
            <ImageIcon className="size-[34px]" />
          </IconButton>
          <IconButton label="Attach file" onClick={() => fileInput.current?.click()} className="size-[34px]">
            <Paperclip className="size-[34px]" />
          </IconButton>
          <IconButton label="Take a photo" onClick={() => cameraInput.current?.click()} className="size-[34px]">
            <Camera className="size-[34px]" />
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
