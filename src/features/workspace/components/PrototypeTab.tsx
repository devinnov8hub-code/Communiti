import { DotsThree, Trash } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AvatarStack, FilePicker, IconButton, Menu, MenuItem, Modal, Spinner, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { useCreatePrototype, useDeletePrototype, usePrototypes } from '../hooks/queries'
import type { Prototype } from '../types'
import { FilledField, ModalActions, TabState, WorkspaceAction } from './shared'

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** Prototype library (Figma "Prototype"). Opening a prototype shows its versions. */
export function PrototypeTab({ projectId, isAdmin }: { projectId: string; isAdmin: boolean }) {
  const prototypes = usePrototypes(projectId)
  const [creating, setCreating] = useState(false)

  return (
    <div className="flex flex-col gap-gap-sm">
      <WorkspaceAction onClick={() => setCreating(true)}>New Prototype</WorkspaceAction>

      <div className="border-t border-hairline pt-2.5 sm:px-4 lg:px-8">
        {prototypes.isPending ? (
          <TabState>
            <Spinner className="text-brand-orange" />
          </TabState>
        ) : prototypes.isError ? (
          <TabState>{getErrorMessage(prototypes.error)}</TabState>
        ) : prototypes.data.length === 0 ? (
          <TabState>No prototypes yet. Create one to start uploading versions.</TabState>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {prototypes.data.map((prototype) => (
              <PrototypeCard key={prototype.id} projectId={projectId} prototype={prototype} canDelete={isAdmin} />
            ))}
          </ul>
        )}
      </div>

      {creating && <NewPrototypeModal projectId={projectId} onClose={() => setCreating(false)} />}
    </div>
  )
}

function PrototypeCard({
  projectId,
  prototype,
  canDelete,
}: {
  projectId: string
  prototype: Prototype
  canDelete: boolean
}) {
  const remove = useDeletePrototype(projectId)
  const toast = useToast()
  const href = paths.prototype(projectId, prototype.id)

  return (
    <li className="flex flex-col gap-2 border-b border-hairline pb-3">
      <Link to={href} tabIndex={-1} aria-hidden className="block aspect-[350/220] overflow-hidden bg-white">
        {prototype.thumbnailUrl && (
          <img src={prototype.thumbnailUrl} alt="" loading="lazy" className="size-full object-cover" />
        )}
      </Link>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-body-m font-semibold text-fg">
            <Link to={href} className="hover:underline">
              {prototype.name}
            </Link>
          </h3>
          <p className="text-caption text-grey-40 dark:text-fg-body">
            Created {dateFormat.format(new Date(prototype.createdAt))}
          </p>
          <div className="flex items-center gap-1">
            <AvatarStack people={[prototype.createdBy]} size={24} />
            <span className="text-caption text-grey-40 dark:text-fg-body">
              {prototype.versionCount} {prototype.versionCount === 1 ? 'Version' : 'Versions'}
            </span>
          </div>
        </div>
        {canDelete && (
          <Menu
            trigger={
              <IconButton label={`Actions for ${prototype.name}`} className="size-7 text-fg">
                <DotsThree weight="bold" className="size-6" />
              </IconButton>
            }
            className="w-[200px]"
          >
            {(close) => (
              <MenuItem
                size="sm"
                tone="danger"
                icon={<Trash />}
                onSelect={() => {
                  close()
                  remove.mutate(prototype.id, {
                    onSuccess: () => toast(`“${prototype.name}” deleted`),
                    onError: (error) => toast(getErrorMessage(error)),
                  })
                }}
              >
                Delete prototype
              </MenuItem>
            )}
          </Menu>
        )}
      </div>
    </li>
  )
}

/** "New Prototype" sheet (Figma "add prototype"). */
function NewPrototypeModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const create = useCreatePrototype(projectId)
  const toast = useToast()
  const [name, setName] = useState('Untitled Prototype')
  const [thumbnail, setThumbnail] = useState<File>()
  const [error, setError] = useState<string>()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (name.trim().length < 2) return setError('Give your prototype a name (at least 2 characters)')
    create.mutate(
      { name: name.trim(), thumbnail },
      {
        onSuccess: () => {
          toast('Prototype created')
          onClose()
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    )
  }

  return (
    <Modal open onClose={onClose} title="New Prototype" gap="sm" className="max-w-[458px] [&_h2]:text-body-m">
      <form onSubmit={submit} className="flex flex-col gap-gap-md">
        <FilePicker
          variant="dashed"
          placeholder="Upload Thumbnail"
          accept="image/*"
          file={thumbnail}
          onChange={setThumbnail}
        />
        <FilledField
          label="Enter Prototype name"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError(undefined)
          }}
          onFocus={(event) => event.target.select()}
          maxLength={120}
          error={error}
        />
        <ModalActions confirmLabel="Create" onCancel={onClose} loading={create.isPending} />
      </form>
    </Modal>
  )
}
