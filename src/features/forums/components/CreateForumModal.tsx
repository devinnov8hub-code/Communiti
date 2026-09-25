import { CloudArrowUp, X } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { paths } from '@/app/paths'
import { Button, FieldError, Modal, SelectField, TextField, useToast } from '@/components/ui'
import { INTEREST_TOPICS } from '@/features/auth/constants'
import { getErrorMessage } from '@/lib/api/client'
import { controlBoxClass } from '@/components/ui/controlStyles'
import { cn } from '@/lib/cn'
import { useCreateForum } from '../hooks/queries'

const MAX_TOPICS = 5
const TOPIC_OPTIONS = INTEREST_TOPICS.map((topic) => ({ value: topic, label: topic }))

const schema = z.object({
  name: z.string().trim().min(3, 'Give your forum a name').max(60),
  topics: z.array(z.string()).min(1, 'Pick at least one topic').max(MAX_TOPICS),
  about: z.string().trim().min(20, 'Tell people what this forum is about (20+ characters)').max(1000),
})
type Values = z.infer<typeof schema>

/** "Create new Forum" sheet. */
export function CreateForumModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const create = useCreateForum()
  const [header, setHeader] = useState<File>()
  const [preview, setPreview] = useState<string>()
  const fileInput = useRef<HTMLInputElement>(null)
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview])

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', topics: [], about: '' } })

  const submit = handleSubmit((values) =>
    create.mutate(
      { ...values, header },
      {
        onSuccess: (forum) => {
          toast('Forum created')
          onClose()
          navigate(paths.forum(forum.id))
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    ),
  )

  return (
    <Modal
      open
      onClose={onClose}
      title="Create new Forum"
      divided
      footer={
        <Button
          type="submit"
          form="create-forum"
          loading={create.isPending}
          className="h-[54px] rounded-full bg-brand-orange font-normal"
        >
          Create Forum
        </Button>
      }
    >
      <form id="create-forum" noValidate onSubmit={submit} className="flex flex-col gap-gap-md">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="relative flex h-[144px] w-full items-center justify-center overflow-hidden rounded-control border border-dashed border-brand-orange bg-brand-orange-tint"
        >
          {preview ? (
            <img src={preview} alt="Forum header preview" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-[7px] text-body-m text-brand-orange">
              <CloudArrowUp aria-hidden className="size-8" />
              Upload Header
            </span>
          )}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            setHeader(file)
            setPreview(URL.createObjectURL(file))
          }}
        />

        <TextField
          label="Forum Name"
          placeholder="e.g Sustainability inc..."
          className="[&>label]:text-body-m [&>label]:font-semibold [&>label]:text-fg"
          error={errors.name?.message}
          {...register('name')}
        />

        <Controller
          control={control}
          name="topics"
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              <p className="text-body-m font-semibold text-fg">Focus Topics (Select up to {MAX_TOPICS})</p>
              {field.value.length > 0 && (
                <ul className="flex flex-wrap gap-3 px-5 py-2.5">
                  {field.value.map((topic) => (
                    <li key={topic}>
                      <button
                        type="button"
                        aria-label={`Remove ${topic}`}
                        onClick={() => field.onChange(field.value.filter((item) => item !== topic))}
                        className="flex items-center gap-1.5 rounded-full bg-brand-orange p-2 text-body-m text-white"
                      >
                        <X aria-hidden className="size-3.5" />
                        {topic}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <SelectField
                label="Add a focus topic"
                className="[&>label]:sr-only"
                placeholder="e.g Sustainability"
                options={TOPIC_OPTIONS.filter((option) => !field.value.includes(option.value))}
                value=""
                disabled={field.value.length >= MAX_TOPICS}
                onChange={(event) => {
                  if (event.target.value) field.onChange([...field.value, event.target.value])
                }}
              />
              {errors.topics?.message && <FieldError>{errors.topics.message}</FieldError>}
            </div>
          )}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="forum-about" className="text-body-m font-semibold text-fg">
            About your Forum
          </label>
          <textarea
            id="forum-about"
            rows={5}
            placeholder="write a brief description of your Forum."
            aria-invalid={errors.about ? true : undefined}
            className={cn(
              controlBoxClass,
              'h-auto min-h-[120px] resize-y items-start py-[5px] text-body-m text-fg outline-none placeholder:text-fg-muted',
              errors.about && 'border-red-500',
            )}
            {...register('about')}
          />
          {errors.about?.message && <FieldError>{errors.about.message}</FieldError>}
        </div>
      </form>
    </Modal>
  )
}
