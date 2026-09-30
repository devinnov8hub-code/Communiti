import { DotsThree, DotsThreeOutlineVertical, Plus } from '@phosphor-icons/react'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Avatar, FilePicker, IconButton, Menu, MenuItem, Modal, Spinner, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/client'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useCommentOnVersion, useCreateVersion, usePrototypes, useVersions } from '../hooks/queries'
import type { PrototypeVersion } from '../types'
import { CommentBar, FilledField, ModalActions, TabState } from './shared'

function download(url: string, name: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
}

/** A prototype's versions: grid on the left, preview on the right (Figma "version"). */
export function PrototypeVersions({ projectId, prototypeId }: { projectId: string; prototypeId: string }) {
  const prototypes = usePrototypes(projectId)
  const versions = useVersions(projectId, prototypeId)
  const [selectedId, setSelectedId] = useState<string>()
  const [uploading, setUploading] = useState(false)
  const preview = useRef<HTMLElement>(null)
  const prototype = prototypes.data?.find((item) => item.id === prototypeId)
  const selected = versions.data?.find((version) => version.id === selectedId) ?? versions.data?.[0]

  const show = (id: string) => {
    setSelectedId(id)
    if (window.matchMedia('(max-width: 1023px)').matches) preview.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="grid border-t border-hairline lg:min-h-[686px] lg:grid-cols-[minmax(0,546px)_minmax(0,1fr)] lg:gap-3">
      <div className="flex flex-col gap-4 py-2.5 lg:px-5">
        <nav aria-label="Breadcrumb" className="text-body-m text-grey-40 dark:text-fg-body">
          <Link to={paths.projectTab(projectId, 'prototype')} className="hover:underline">
            {prototype?.name ?? 'Prototype'}
          </Link>
          <span aria-hidden> &gt; </span>
          <span className="text-fg">Versions</span>
        </nav>

        {versions.isPending ? (
          <TabState>
            <Spinner className="text-brand-orange" />
          </TabState>
        ) : versions.isError ? (
          <TabState>{getErrorMessage(versions.error)}</TabState>
        ) : versions.data.length === 0 ? (
          <TabState>No versions yet. Upload the first CAD file.</TabState>
        ) : (
          <ul className="grid grid-cols-2 gap-x-3.5 gap-y-2">
            {versions.data.map((version) => (
              <li key={version.id} className="flex flex-col gap-[7px]">
                <button
                  type="button"
                  onClick={() => show(version.id)}
                  aria-label={`Preview ${version.name}`}
                  aria-current={version.id === selected?.id ? 'true' : undefined}
                  className={cn(
                    'block h-[103px] overflow-hidden bg-white outline-offset-2',
                    version.id === selected?.id && 'ring-2 ring-brand-orange',
                  )}
                >
                  <img
                    src={version.thumbnailUrl ?? version.imageUrl}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </button>
                <div className="flex items-start gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate text-body-s text-fg">{version.name}</p>
                    <p className="truncate text-caption text-grey-40 dark:text-fg-body">
                      Edited by {version.editedBy.name}
                    </p>
                  </div>
                  <VersionMenu version={version} onOpen={() => show(version.id)} />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="pointer-events-none sticky bottom-6 mt-auto flex justify-center pt-4">
          <button
            type="button"
            onClick={() => setUploading(true)}
            aria-label="Upload a new version"
            className="pointer-events-auto flex size-[60px] items-center justify-center rounded-full bg-brand-orange text-white shadow-popover transition hover:brightness-95"
          >
            <Plus className="size-7" />
          </button>
        </div>
      </div>

      <section
        ref={preview}
        aria-label="Version preview"
        className="flex scroll-mt-20 flex-col justify-between gap-6 border-t border-hairline px-5 py-2.5 lg:border-t-0 lg:border-l"
      >
        {selected ? (
          <VersionPreview projectId={projectId} prototypeId={prototypeId} version={selected} />
        ) : (
          <p className="m-auto py-10 text-body-m text-fg-muted">Select a version to preview it.</p>
        )}
      </section>

      {uploading && (
        <UploadVersionModal
          projectId={projectId}
          prototypeId={prototypeId}
          onClose={() => setUploading(false)}
          onUploaded={(version) => setSelectedId(version.id)}
        />
      )}
    </div>
  )
}

function VersionMenu({ version, onOpen }: { version: PrototypeVersion; onOpen: () => void }) {
  return (
    <Menu
      trigger={
        <IconButton label={`Actions for ${version.name}`} className="size-6 text-fg">
          <DotsThree weight="bold" className="size-5" />
        </IconButton>
      }
      className="w-[200px]"
    >
      {(close) => (
        <>
          <MenuItem
            size="sm"
            onSelect={() => {
              close()
              onOpen()
            }}
          >
            Preview
          </MenuItem>
          {version.imageUrl && (
            <MenuItem
              size="sm"
              onSelect={() => {
                close()
                download(version.imageUrl!, version.name)
              }}
            >
              Download
            </MenuItem>
          )}
        </>
      )}
    </Menu>
  )
}

function VersionPreview({
  projectId,
  prototypeId,
  version,
}: {
  projectId: string
  prototypeId: string
  version: PrototypeVersion
}) {
  const comment = useCommentOnVersion(projectId, prototypeId)
  const toast = useToast()

  return (
    <>
      <div className="flex flex-col items-center gap-gap-md">
        <div className="flex w-full justify-end">
          <Menu
            trigger={
              <IconButton label="Version actions" className="size-10 bg-black/5 text-fg dark:bg-white/10">
                <DotsThreeOutlineVertical weight="fill" className="size-6" />
              </IconButton>
            }
            className="w-[200px]"
          >
            {(close) =>
              version.imageUrl ? (
                <MenuItem
                  size="sm"
                  onSelect={() => {
                    close()
                    download(version.imageUrl!, version.name)
                  }}
                >
                  Download {version.name}
                </MenuItem>
              ) : (
                <p className="text-body-s text-fg-muted">No file attached.</p>
              )
            }
          </Menu>
        </div>
        {version.imageUrl && (
          <img
            src={version.imageUrl}
            alt={`${version.name} preview`}
            className="aspect-square w-full max-w-[354px] bg-white object-contain"
          />
        )}
        <h2 className="sr-only">{version.name}</h2>
      </div>

      <div className="flex flex-col gap-1 border-t border-hairline">
        <div className="mx-auto flex w-full max-w-[354px] items-center gap-3 py-2.5">
          <div className="flex flex-1 items-center gap-1">
            <Avatar src={version.editedBy.avatarUrl} name={version.editedBy.name} size={28} />
            <div className="flex flex-col gap-1.5 text-caption">
              <span className="text-grey-40 dark:text-fg-body">Updated by</span>
              <span className="text-fg">
                {version.editedBy.name.split(' ')[0]}&nbsp;&nbsp;{timeAgo(version.updatedAt)}
              </span>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-1">
            <Avatar src={version.editedBy.avatarUrl} name={version.editedBy.name} size={28} />
            <div className="flex flex-col gap-1.5 text-caption">
              <span className="text-grey-40 dark:text-fg-body">Comments</span>
              <span className="text-fg">{version.commentsCount}</span>
            </div>
          </div>
        </div>
        <div className="pt-[5px] pb-2 sm:px-5">
          <CommentBar
            pending={comment.isPending}
            onSubmit={(text) =>
              comment.mutateAsync(
                { versionId: version.id, text },
                { onSuccess: () => toast('Comment added'), onError: (error) => toast(getErrorMessage(error)) },
              )
            }
          />
        </div>
      </div>
    </>
  )
}

/** "Upload version" sheet (Figma "add version"). */
function UploadVersionModal({
  projectId,
  prototypeId,
  onClose,
  onUploaded,
}: {
  projectId: string
  prototypeId: string
  onClose: () => void
  onUploaded: (version: PrototypeVersion) => void
}) {
  const upload = useCreateVersion(projectId, prototypeId)
  const toast = useToast()
  const [name, setName] = useState('')
  const [file, setFile] = useState<File>()
  const [errors, setErrors] = useState<{ name?: string; file?: string; form?: string }>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next = {
      name: name.trim() ? undefined : 'Name this version',
      file: file ? undefined : 'Choose a CAD file to upload',
    }
    setErrors(next)
    if (next.name || next.file || !file) return
    upload.mutate(
      { name: name.trim(), file },
      {
        onSuccess: (version) => {
          toast(`${version.name} uploaded`)
          onUploaded(version)
          onClose()
        },
        onError: (error) => setErrors({ form: getErrorMessage(error) }),
      },
    )
  }

  return (
    <Modal open onClose={onClose} title="Upload version" gap="sm" className="max-w-[458px] [&_h2]:text-body-m">
      <form onSubmit={submit} noValidate className="flex flex-col gap-gap-sm">
        <FilledField
          label="Enter version name"
          placeholder="Version name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
        />
        <FilePicker
          variant="dropzone"
          placeholder="Upload CAD file"
          accept=".dwg,.dxf,.step,.stp,.stl,.iges,.igs,.sldprt,.f3d,image/*,application/pdf"
          file={file}
          onChange={setFile}
          error={errors.file}
        />
        {errors.form && (
          <p role="alert" className="text-body-s text-error">
            {errors.form}
          </p>
        )}
        <div className="pt-6">
          <ModalActions confirmLabel="Upload Version" onCancel={onClose} loading={upload.isPending} />
        </div>
      </form>
    </Modal>
  )
}
