import { DotsThree, Trash } from '@phosphor-icons/react'
import { useDeferredValue, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ActionButton, ConfirmDialog, IconButton, Menu, MenuItem, Spinner, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/cn'
import { AddHighlightsModal } from '../components/AddHighlightsModal'
import { AdminTopBar } from '../components/AdminTopBar'
import { ErrorState } from '../components/states'
import { AdminContent } from '../components/ui'
import { useDeleteHighlightGroup, useHighlightGroup, useHighlightGroups } from '../hooks/queries'
import { adminPaths } from '../paths'
import type { HighlightGroup } from '../types'

/** Community highlights grouped by event (Figma "Highlights"). */
export function HighlightsPage() {
  const groups = useHighlightGroups()
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const query = useDeferredValue(search.trim().toLowerCase())
  const visible = groups.data?.filter((group) => group.title.toLowerCase().includes(query))

  return (
    <>
      <AdminTopBar title="Highlights" searchPlaceholder="Search in Highlights" search={search} onSearch={setSearch} />
      <AdminContent className="gap-gap-lg">
        <ActionButton onClick={() => setAdding(true)} className="self-end">
          Add Highlights
        </ActionButton>
        {groups.isPending ? (
          <div className="flex justify-center py-24 text-brand-orange">
            <Spinner />
          </div>
        ) : groups.isError ? (
          <ErrorState message={getErrorMessage(groups.error)} onRetry={() => groups.refetch()} />
        ) : visible?.length ? (
          visible.map((group, index) => (
            <section key={group.id} className="flex flex-col gap-4 lg:px-2">
              <h2 className="text-h4 font-semibold text-fg">
                <Link to={adminPaths.highlight(group.id)} className="hover:underline">
                  {group.title}
                </Link>
              </h2>
              <GroupMosaic group={group} mirrored={index % 2 === 1} />
            </section>
          ))
        ) : (
          <p className="py-16 text-center text-body-m text-fg-muted">No highlights found.</p>
        )}
      </AdminContent>
      {adding && <AddHighlightsModal onClose={() => setAdding(false)} />}
    </>
  )
}

/**
 * 4 small photos + 1 large (Figma "Tetfair 2025"); alternate groups put the large
 * photo in the middle (Figma "R4i 2025 pt II").
 */
function GroupMosaic({ group, mirrored }: { group: HighlightGroup; mirrored: boolean }) {
  const [a, b, c, d, big] = group.images
  const tile = (photo: HighlightGroup['images'][number] | undefined, className?: string) =>
    photo && (
      <Link
        key={photo.id}
        to={adminPaths.highlight(group.id)}
        aria-label={`${group.title} photo`}
        className={cn('group block overflow-hidden rounded-sm bg-surface', className)}
      >
        <img
          src={photo.imageUrl}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
    )

  return (
    <div
      className={cn(
        'grid auto-rows-[110px] gap-1 sm:auto-rows-[143px]',
        mirrored ? 'grid-cols-[1fr_2.2fr_1fr]' : 'grid-cols-[1fr_1fr_2.2fr]',
      )}
    >
      {mirrored ? (
        <>
          {tile(a, 'col-start-1 row-start-1')}
          {tile(b, 'col-start-1 row-start-2')}
          {tile(big ?? c, 'col-start-2 row-span-2 row-start-1')}
          {tile(c, 'col-start-3 row-start-1')}
          {tile(d, 'col-start-3 row-start-2')}
        </>
      ) : (
        <>
          {tile(a)}
          {tile(b)}
          {tile(big ?? c, 'col-start-3 row-span-2 row-start-1')}
          {tile(c)}
          {tile(d)}
        </>
      )}
    </div>
  )
}

/** One highlights group (Figma "Highlights view"). */
export function HighlightDetailPage() {
  const { highlightId = '' } = useParams()
  const group = useHighlightGroup(highlightId)
  const remove = useDeleteHighlightGroup()
  const navigate = useNavigate()
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <AdminTopBar title="Highlights" searchPlaceholder="Search in Highlights" />
      <AdminContent className="gap-gap-md">
        <ActionButton onClick={() => setAdding(true)} className="self-end">
          Add Highlights
        </ActionButton>
        {group.isPending ? (
          <div className="flex justify-center py-24 text-brand-orange">
            <Spinner />
          </div>
        ) : group.isError ? (
          <ErrorState message={getErrorMessage(group.error)} onRetry={() => group.refetch()} />
        ) : (
          <>
            <nav aria-label="Breadcrumb" className="text-body-m text-fg-muted">
              <Link to={adminPaths.highlights} className="hover:underline">
                Community Highlights
              </Link>
              <span aria-hidden> &gt; </span>
              <span aria-current="page" className="text-fg">
                {group.data.title}
              </span>
            </nav>
            <figure className="flex flex-col gap-2 lg:px-2">
              <img
                src={group.data.cover.imageUrl}
                alt=""
                className="h-[240px] w-full rounded-sm object-cover sm:h-[465px]"
              />
              <figcaption className="flex items-center justify-between gap-3 border-b border-hairline pb-2">
                <span className="text-h4 font-semibold text-innovation">{group.data.cover.title}</span>
                <Menu
                  trigger={
                    <IconButton label="Highlight options" className="size-7 text-fg">
                      <DotsThree weight="bold" className="size-6" />
                    </IconButton>
                  }
                  className="w-[220px]"
                >
                  {(close) => (
                    <MenuItem
                      size="sm"
                      tone="danger"
                      icon={<Trash />}
                      onSelect={() => {
                        close()
                        setConfirming(true)
                      }}
                    >
                      Delete highlights
                    </MenuItem>
                  )}
                </Menu>
              </figcaption>
            </figure>
            <section className="flex flex-col gap-2 lg:px-2">
              <h2 className="text-caption font-semibold text-brand-orange">More like this</h2>
              <ul className="columns-2 gap-2 sm:gap-3">
                {group.data.images.slice(1).map((photo, index) => (
                  <li key={photo.id} className="mb-2 break-inside-avoid sm:mb-3">
                    <img
                      src={photo.imageUrl}
                      alt=""
                      loading="lazy"
                      className={cn(
                        'w-full rounded-sm object-cover',
                        index % 3 === 1 ? 'h-[180px] sm:h-[285px]' : 'h-[90px] sm:h-[140px]',
                      )}
                    />
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </AdminContent>
      {adding && <AddHighlightsModal onClose={() => setAdding(false)} />}
      <ConfirmDialog
        open={confirming}
        title="Delete highlights?"
        message="This removes the whole group and its photos."
        confirmLabel="Delete"
        loading={remove.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() =>
          remove.mutate(highlightId, {
            onSuccess: () => {
              toast('Highlights deleted')
              navigate(adminPaths.highlights, { replace: true })
            },
            onError: (error) => toast(getErrorMessage(error)),
          })
        }
      />
    </>
  )
}
