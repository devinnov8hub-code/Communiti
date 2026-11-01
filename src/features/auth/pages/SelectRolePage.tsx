import { ArrowLeft } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { LogoLockup } from '@/components/brand/Logo'
import { Button } from '@/components/ui'
import { meApi } from '@/lib/api'
import { cn } from '@/lib/cn'
import { useAuth } from '../hooks/useAuth'
import { SELECTABLE_ROLES, type SelectableRole } from '../roles'

/** Onboarding step 1 (Figma "Select user type"). */
export function SelectRolePage() {
  // Someone who left after submitting the form carries on from the topics screen.
  const status = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: () => meApi.getOnboardingStatus(),
    gcTime: 0,
  })
  if (status.data?.nextStep === 'interests') return <Navigate to={paths.onboardingInterests} replace />

  return <SelectRoleScreen formPath={paths.onboardingRoleForm} />
}

/** Settings → "Change my role". */
export function ChangeRolePage() {
  return <SelectRoleScreen formPath={paths.changeRoleForm} backTo={paths.settingsSection('account')} />
}

interface SelectRoleScreenProps {
  formPath: (role: SelectableRole) => string
  backTo?: string
}

function SelectRoleScreen({ formPath, backTo }: SelectRoleScreenProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selected, setSelected] = useState(SELECTABLE_ROLES.find((role) => role.value === user?.role)?.value)

  return (
    <main className="flex min-h-dvh items-center bg-background px-5 py-10 sm:px-10">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-gap-lg">
        <LogoLockup />

        <div className="flex flex-col gap-10 xl:gap-[70px]">
          <div className="flex flex-col gap-2">
            {backTo && (
              <Link
                to={backTo}
                className="flex w-fit items-center gap-1 text-body-m text-grey-40 hover:text-fg dark:text-white"
              >
                <ArrowLeft aria-hidden className="size-6" />
                Back
              </Link>
            )}
            <h1 className="text-title-sm font-bold text-fg sm:text-head2">Select Role</h1>
            <p className="text-body-s text-fg-body">
              Select the option that best describes you. This helps us personalize your experience and connect you with
              the right opportunities, people, and resources.
            </p>
          </div>

          <div className="flex flex-col gap-10 xl:gap-[150px]">
            <fieldset className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <legend className="sr-only">Role</legend>
              {SELECTABLE_ROLES.map((role) => (
                <label
                  key={role.value}
                  className={cn(
                    'flex cursor-pointer flex-col gap-2 rounded-card pb-2.5 transition-colors',
                    'focus-within:ring-2 focus-within:ring-brand-green',
                    selected === role.value
                      ? 'border border-brand-orange bg-brand-orange-tint drop-shadow-[0px_4px_2px_rgba(246,134,32,0.2)] dark:bg-brand-orange/15'
                      : 'border border-border-default/40 bg-background',
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selected === role.value}
                    onChange={() => setSelected(role.value)}
                    className="sr-only"
                  />
                  <img src={role.image} alt="" className="h-[219px] w-full rounded-t-card object-cover" />
                  <span className="flex flex-col gap-[7px] px-2">
                    <span className="text-body-l font-semibold text-fg">{role.label}</span>
                    <span className="text-caption text-fg-muted">{role.description}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <Button
              disabled={!selected}
              onClick={() => selected && navigate(formPath(selected))}
              className="self-end sm:w-[336px]"
            >
              Select
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
