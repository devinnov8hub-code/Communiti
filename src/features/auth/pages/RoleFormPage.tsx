import { ArrowLeft } from '@phosphor-icons/react'
import { useState, type ComponentType } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { LogoLockup } from '@/components/brand/Logo'
import { useToast } from '@/components/ui'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { ApiError, meApi, type ApiFieldErrors, type SubmitRoleBody } from '@/lib/api'
import { AuthLayout } from '../components/AuthLayout'
import {
  InnovatorForm,
  LearnerForm,
  ProfessionalForm,
  ResearcherForm,
  type RoleFormProps,
} from '../components/RoleForms'
import { useAuth } from '../hooks/useAuth'
import { SELECTABLE_ROLES, type SelectableRole } from '../roles'
import { toUser } from '../user'

/** Long enough to see the ticks animate before moving on. */
const TICK_MS = 1200

const ROLE_FORMS: Record<SelectableRole, ComponentType<RoleFormProps>> = {
  researcher: ResearcherForm,
  innovator: InnovatorForm,
  professional: ProfessionalForm,
  learner: LearnerForm,
}

/** The chosen role's verification form (Figma "Researcher user", "Innovator", "Professional", "Learner"). */
export function RoleFormPage() {
  const navigate = useNavigate()
  const { updateUser } = useAuth()

  return (
    <RoleFormScreen
      backTo={paths.onboardingRole}
      onSubmitted={async (me) => {
        updateUser(toUser(me))
        navigate(me.onboardingComplete ? paths.home : paths.onboardingInterests, { replace: true })
      }}
    />
  )
}

/** Settings → "Change my role": as the dialog warns, the member signs in again afterwards. */
export function ChangeRoleFormPage() {
  const toast = useToast()
  const { signOut } = useAuth()

  return (
    <RoleFormScreen
      backTo={paths.changeRole}
      onSubmitted={async (me) => {
        toast(
          me.verificationStatus === 'verified'
            ? 'Your new role is verified. Log in to continue.'
            : 'Your new role has been sent for review. Log in to continue.',
        )
        await signOut()
      }}
    />
  )
}

interface RoleFormScreenProps {
  backTo: string
  onSubmitted: (me: Awaited<ReturnType<typeof meApi.submitRole>>) => Promise<void>
}

function RoleFormScreen({ backTo, onSubmitted }: RoleFormScreenProps) {
  const { role } = useParams()
  const selected = SELECTABLE_ROLES.find((option) => option.value === role)

  const [verified, setVerified] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})

  // The server checks the answers on the spot (1–6 seconds). A form that passes comes back verified.
  const submit = useAsyncAction(async (body: SubmitRoleBody | Promise<SubmitRoleBody>) => {
    setFieldErrors({})
    try {
      const me = await meApi.submitRole(await body)
      if (me.verificationStatus === 'verified') {
        setVerified(true)
        await new Promise((resolve) => setTimeout(resolve, TICK_MS))
      }
      await onSubmitted(me)
    } catch (error) {
      if (error instanceof ApiError && error.fields) setFieldErrors(error.fields)
      throw error
    }
  })

  if (!selected) return <Navigate to={backTo} replace />

  const Form = ROLE_FORMS[selected.value]

  return (
    // These forms use a 710px column, wider than the other auth screens.
    <AuthLayout hero="mentor" className="max-w-[710px] lg:ml-[clamp(0px,calc(50%-318px),142px)] lg:self-start">
      <div className="flex flex-col gap-gap-lg">
        <LogoLockup />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Link
              to={backTo}
              className="flex w-fit items-center gap-1 text-body-m text-grey-40 hover:text-fg dark:text-white"
            >
              <ArrowLeft aria-hidden className="size-6" />
              Back
            </Link>
            <div className="flex flex-col gap-2">
              <h1 className="text-[28px] font-bold text-fg">{selected.label}</h1>
              <p className="text-body-s text-fg-body">{selected.formDescription}</p>
            </div>
          </div>

          <Form
            onSubmit={submit.run}
            pending={submit.pending}
            error={submit.error}
            verified={verified}
            fieldErrors={fieldErrors}
          />
        </div>
      </div>
    </AuthLayout>
  )
}
