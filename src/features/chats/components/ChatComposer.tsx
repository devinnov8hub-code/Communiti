import {
  Image as ImageIcon,
  Microphone,
  PaperPlaneRight,
  Paperclip,
  PencilSimple,
  Trash,
  X,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { IconButton, Spinner, useToast } from '@/components/ui'
import { AttachmentList } from '@/features/feed/components/CommentComposer'
import type { Message } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { formatDuration } from '../format'
import { useEditMessage, useSendMessage } from '../hooks/queries'
import { MAX_VOICE_SECONDS, useVoiceRecorder } from '../hooks/useVoiceRecorder'

const MAX_ATTACHMENTS = 10

interface ChatComposerProps {
  conversationId: string
  /** My message being edited, or null. */
  editing: Message | null
  onDoneEditing: () => void
}

const roundButton =
  'flex size-[38px] shrink-0 items-center justify-center rounded-full bg-brand-orange p-[5px] text-white hover:brightness-95 disabled:opacity-70'

/** "write a message" bar: text, images, files and voice notes; also edits my last messages. */
export function ChatComposer({ conversationId, editing, onDoneEditing }: ChatComposerProps) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const send = useSendMessage(conversationId)
  const edit = useEditMessage()
  const voice = useVoiceRecorder()
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const busy = send.isPending || edit.isPending
  const canSend = (text.trim().length > 0 || (!editing && files.length > 0)) && !busy
  const onError = (error: unknown) => toast(getErrorMessage(error))

  // Editing puts the message's text in the box.
  useEffect(() => {
    if (!editing) return
    setText(editing.body ?? '')
    input.current?.focus()
  }, [editing])

  const reset = () => {
    setText('')
    setFiles([])
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSend) return
    if (editing) {
      return edit.mutate(
        { id: editing.id, body: text.trim() },
        {
          onSuccess: () => {
            reset()
            onDoneEditing()
          },
          onError,
        },
      )
    }
    send.mutate({ text: text.trim(), attachments: files }, { onSuccess: reset, onError })
  }

  const cancelEdit = () => {
    reset()
    onDoneEditing()
  }

  const startRecording = () =>
    voice.start().catch(() => toast('Allow microphone access in your browser to record a voice note'))

  const sendVoice = async () => {
    const note = await voice.stop()
    if (!note) return toast('Nothing was recorded')
    send.mutate({ text: '', attachments: [], voice: note }, { onError })
  }

  // Send automatically at the length limit.
  const { recording, seconds } = voice
  useEffect(() => {
    if (recording && seconds >= MAX_VOICE_SECONDS) void sendVoice()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the timer matters here
  }, [recording, seconds])

  const onPick = (list: FileList | null) => {
    if (!list) return
    const picked = [...files, ...Array.from(list)]
    if (picked.length > MAX_ATTACHMENTS) toast(`You can send up to ${MAX_ATTACHMENTS} files at a time`)
    setFiles(picked.slice(0, MAX_ATTACHMENTS))
  }

  if (voice.recording) {
    return (
      <div className="flex items-center gap-1 px-2 pt-2.5 pb-[13px]">
        <IconButton label="Discard voice note" onClick={voice.cancel} className="size-[38px] text-error">
          <Trash className="size-5" />
        </IconButton>
        <div
          role="status"
          className="flex h-[38px] min-w-0 flex-1 items-center gap-2 rounded-full bg-input-fill px-3 text-body-s text-fg"
        >
          <span aria-hidden className="size-2.5 animate-pulse rounded-full bg-error" />
          Recording {formatDuration(voice.seconds)}
          <span className="text-caption text-fg-muted">/ {formatDuration(MAX_VOICE_SECONDS)}</span>
        </div>
        <button type="button" aria-label="Send voice note" onClick={sendVoice} className={roundButton}>
          <PaperPlaneRight weight="fill" className="size-[18px]" />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 pt-[5px] pb-2">
      {editing && (
        <div className="mx-2 flex items-center gap-2 rounded-control bg-surface px-3 py-1.5 text-caption text-fg-muted">
          <PencilSimple aria-hidden className="size-4 shrink-0 text-brand-orange" />
          <span className="min-w-0 flex-1 truncate">
            Editing: <span className="text-fg">{editing.body}</span>
          </span>
          <IconButton label="Cancel editing" onClick={cancelEdit} className="size-6">
            <X className="size-4" />
          </IconButton>
        </div>
      )}
      {!editing && files.length > 0 && (
        <AttachmentList files={files} onRemove={(file) => setFiles((current) => current.filter((f) => f !== file))} />
      )}
      <div className="flex items-center gap-1 px-2 py-[5px]">
        <div className="flex h-[38px] min-w-0 flex-1 items-center justify-between gap-2 rounded-full bg-input-fill px-2 py-[5px]">
          <input
            ref={input}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && editing && cancelEdit()}
            placeholder={editing ? 'Edit your message' : 'write a message'}
            aria-label={editing ? 'Edit your message' : 'Write a message'}
            maxLength={4000}
            className="min-w-0 flex-1 bg-transparent text-body-s text-fg outline-none placeholder:text-fg-muted"
          />
          {!editing && (
            <div className="flex shrink-0 items-center gap-2.5 text-fg">
              <IconButton label="Attach image" onClick={() => imageInput.current?.click()} className="size-[18px]">
                <ImageIcon className="size-[18px]" />
              </IconButton>
              <IconButton label="Attach file" onClick={() => fileInput.current?.click()} className="size-[18px]">
                <Paperclip className="size-[18px]" />
              </IconButton>
            </div>
          )}
        </div>
        {busy ? (
          <span role="status" aria-label="Sending" className={roundButton}>
            <Spinner className="size-4" />
          </span>
        ) : canSend || editing || !voice.supported ? (
          <button
            type="submit"
            aria-label={editing ? 'Save edit' : 'Send message'}
            disabled={!canSend}
            className={roundButton}
          >
            <PaperPlaneRight weight="fill" className="size-[18px]" />
          </button>
        ) : (
          <button type="button" aria-label="Record voice note" onClick={startRecording} className={roundButton}>
            <Microphone weight="fill" className="size-[18px]" />
          </button>
        )}
      </div>
      {(['image', 'file'] as const).map((kind) => (
        <input
          key={kind}
          ref={kind === 'image' ? imageInput : fileInput}
          type="file"
          accept={kind === 'image' ? 'image/*' : undefined}
          multiple
          hidden
          onChange={(event) => {
            onPick(event.target.files)
            event.target.value = ''
          }}
        />
      ))}
    </form>
  )
}
