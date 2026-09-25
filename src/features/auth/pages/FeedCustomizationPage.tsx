import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { LogoLockup } from '@/components/brand/Logo'
import { Button, FieldError, Pill } from '@/components/ui'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authApi } from '../api/auth.service'
import { AuthHeading } from '../components/AuthHeading'
import { AuthLayout } from '../components/AuthLayout'
import { FormAlert } from '../components/FormAlert'
import { INTEREST_TOPICS } from '../constants'
import { useAuth } from '../hooks/useAuth'
import { interestsSchema, type InterestsValues } from '../schemas'

type Topic = InterestsValues['topics'][number]

export function FeedCustomizationPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InterestsValues>({
    resolver: zodResolver(interestsSchema),
    defaultValues: {
      topics: (user?.interests ?? []).filter((topic): topic is Topic =>
        (INTEREST_TOPICS as readonly string[]).includes(topic),
      ),
    },
  })

  const submit = useAsyncAction(async ({ topics }: InterestsValues) => {
    updateUser(await authApi.updateInterests(topics))
    navigate(paths.home, { replace: true })
  })

  return (
    <AuthLayout hero="team">
      <div className="flex flex-col gap-gap-lg">
        <LogoLockup />

        <div className="flex flex-col gap-gap-md">
          <AuthHeading
            title="One more thing!"
            descriptionTone="body"
            description="Select one or more topics to discover relevant projects, discussions, opportunities, and insights from the innovation community."
          />

          <form noValidate onSubmit={handleSubmit(submit.run)} className="flex flex-col gap-gap-xl">
            <Controller
              control={control}
              name="topics"
              render={({ field }) => (
                <fieldset className="flex flex-col gap-2">
                  <legend className="sr-only">Topics</legend>
                  {/* Design lets the pill cloud run a little wider than the form column. */}
                  <div className="flex flex-wrap gap-gap-sm xl:-mr-24">
                    {INTEREST_TOPICS.map((topic) => (
                      <Pill
                        key={topic}
                        label={topic}
                        selected={field.value.includes(topic)}
                        onSelectedChange={(selected) =>
                          field.onChange(
                            selected ? [...field.value, topic] : field.value.filter((value) => value !== topic),
                          )
                        }
                      />
                    ))}
                  </div>
                  {errors.topics?.message && <FieldError>{errors.topics.message}</FieldError>}
                </fieldset>
              )}
            />

            <FormAlert message={submit.error} />

            <Button type="submit" loading={submit.pending}>
              Go to Communiti
            </Button>
          </form>
        </div>
      </div>
    </AuthLayout>
  )
}
