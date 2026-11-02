import { ArrowRight } from '@phosphor-icons/react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Avatar, Button, EmptyState, Modal, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { SettingsGroup, SettingsSection } from '../components/SettingsSection'
import { useBlockedUsers, useUnblockUser } from '../hooks/queries'

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported'
const LABEL: Record<PermissionState, string> = {
  granted: 'Allowed',
  denied: 'Blocked',
  prompt: 'Not Allowed',
  unsupported: 'Not available',
}

/** Browser camera permission, requested on click. */
function useCameraPermission() {
  const [state, setState] = useState<PermissionState>('prompt')

  useEffect(() => {
    let status: PermissionStatus | undefined
    navigator.permissions
      ?.query({ name: 'camera' as PermissionName })
      .then((result) => {
        status = result
        setState(result.state)
        result.onchange = () => setState(result.state)
      })
      .catch(() => setState(navigator.mediaDevices ? 'prompt' : 'unsupported'))
    return () => {
      if (status) status.onchange = null
    }
  }, [])

  const request = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((track) => track.stop())
      setState('granted')
    } catch {
      setState('denied')
    }
  }, [])

  return { state, request }
}

/** Persistent storage (keeps drafts/offline data from being evicted). */
function useStoragePermission() {
  const supported = Boolean(navigator.storage?.persisted)
  const [state, setState] = useState<PermissionState>(supported ? 'prompt' : 'unsupported')
  useEffect(() => {
    if (supported) navigator.storage.persisted().then((persisted) => setState(persisted ? 'granted' : 'prompt'))
  }, [supported])
  const request = useCallback(async () => {
    const granted = await navigator.storage?.persist?.()
    setState(granted ? 'granted' : 'denied')
  }, [])
  return { state, request }
}

/** Settings → Privacy. */
export function PrivacySettingsPage() {
  const camera = useCameraPermission()
  const storage = useStoragePermission()
  const blocked = useBlockedUsers()
  const [showBlocked, setShowBlocked] = useState(false)
  const toast = useToast()

  const ask = (permission: { state: PermissionState; request: () => Promise<void> }, name: string) => () => {
    if (permission.state === 'denied') toast(`${name} access is blocked — enable it in your browser’s site settings.`)
    else if (permission.state === 'prompt') permission.request()
  }

  return (
    <SettingsSection title="Privacy" className="px-1 lg:pl-1">
      <SettingsGroup title="System Permissions">
        <Row label="Camera" value={LABEL[camera.state]} onClick={ask(camera, 'Camera')} />
        <Row label="Storage" value={LABEL[storage.state]} onClick={ask(storage, 'Storage')} />
      </SettingsGroup>
      <SettingsGroup title="Others">
        <Row label="Blocked accounts" value={String(blocked.data?.length ?? '')} onClick={() => setShowBlocked(true)} />
      </SettingsGroup>
      <SettingsGroup title="Account management">
        <Row label="Delete My Account" to={paths.deleteAccount} />
      </SettingsGroup>

      {showBlocked && <BlockedAccountsModal onClose={() => setShowBlocked(false)} />}
    </SettingsSection>
  )
}

function Row({ label, value, onClick, to }: { label: string; value?: ReactNode; onClick?: () => void; to?: string }) {
  const content = (
    <>
      <span className="text-body-m text-fg">{label}</span>
      <span className="flex items-center gap-1.5 text-body-m text-fg-muted">
        {value}
        <ArrowRight aria-hidden className="size-6" />
      </span>
    </>
  )
  const className = 'flex w-full items-center justify-between py-[5px] text-left hover:opacity-80'
  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  )
}

function BlockedAccountsModal({ onClose }: { onClose: () => void }) {
  const blocked = useBlockedUsers()
  const unblock = useUnblockUser()
  const toast = useToast()
  return (
    <Modal open onClose={onClose} title="Blocked accounts" gap="sm" className="max-w-[480px]">
      {blocked.data?.length ? (
        <ul className="flex flex-col">
          {blocked.data.map((author) => (
            <li
              key={author.id}
              className="flex items-center justify-between gap-3 border-b border-hairline py-2.5 last:border-b-0"
            >
              <span className="flex items-center gap-2.5">
                <Avatar src={author.avatarUrl ?? undefined} name={author.fullName} size={40} />
                <span className="text-body-m text-fg">{author.fullName}</span>
              </span>
              <Button
                variant="outline"
                fullWidth={false}
                className="h-9 rounded-full px-4 text-body-s"
                disabled={unblock.isPending}
                onClick={() =>
                  unblock.mutate(author.id, {
                    onSuccess: () => toast(`${author.fullName} unblocked`),
                    onError: (error) => toast(getErrorMessage(error)),
                  })
                }
              >
                Unblock
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No blocked accounts" description="People you block will appear here." className="py-8" />
      )}
    </Modal>
  )
}
