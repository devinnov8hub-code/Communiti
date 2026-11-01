import type { ReactNode } from 'react'
import { Button } from '@/components/ui'

export function DialogMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 text-fg">
      <h3 className="text-body-m font-semibold">{title}</h3>
      <p className="text-body-s">{children}</p>
    </div>
  )
}

export function DialogActions({ onCancel, onContinue }: { onCancel: () => void; onContinue: () => void }) {
  return (
    <div className="mt-4 flex gap-2">
      <Button onClick={onCancel} className="flex-1 rounded-full bg-background font-normal text-fg hover:bg-fg/5">
        Cancel
      </Button>
      <Button onClick={onContinue} className="flex-1 rounded-full bg-brand-orange font-normal">
        Continue
      </Button>
    </div>
  )
}
