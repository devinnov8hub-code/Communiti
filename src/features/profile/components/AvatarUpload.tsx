import { CameraPlus } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

interface AvatarUploadProps {
  src?: string
  name: string
  onSelect: (file: File) => void
  className?: string
}

/** 113px round photo with a darkened camera overlay (Figma "Profile/CameraPlus"). */
export function AvatarUpload({ src, name, onSelect, className }: AvatarUploadProps) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string>()

  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview])

  const image = preview ?? src
  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-label="Upload profile photo"
        className={cn(
          'relative flex size-[113px] shrink-0 items-center justify-center overflow-hidden rounded-full border-5 border-popover bg-brand-orange-tint',
          className,
        )}
      >
        {image ? (
          <img src={image} alt={name} className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="text-h3 font-semibold text-brand-orange">{name.slice(0, 1).toUpperCase()}</span>
        )}
        <span className="absolute inset-0 bg-black/25" />
        <CameraPlus aria-hidden className="relative size-[34px] text-white" />
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          setPreview(URL.createObjectURL(file))
          onSelect(file)
        }}
      />
    </>
  )
}
