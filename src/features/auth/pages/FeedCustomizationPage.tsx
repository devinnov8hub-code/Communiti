import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { LogoLockup } from '@/components/brand/Logo'
import { Button, FieldError, Pill, Spinner } from '@/components/ui'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { getErrorMessage, meApi, topicsApi } from '@/lib/api'
import { AuthHeading } from '../components/AuthHeading'
import { AuthLayout } from '../components/AuthLayout'
import { FormAlert } from '../components/FormAlert'
import { useAuth } from '../hooks/useAuth'
import { interestsSchema, type InterestsValues } from '../schemas'
import { toUser } from '../user'

export function FeedCustomizationPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const topics = useQuery({ queryKey: ['topics'], queryFn: () => topicsApi.listTopics(), staleTime: Infinity })

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InterestsValues>({
    resolver: zodResolver(interestsSchema),
    defaultValues: { topics: user?.interests ?? [] },
  })

  const submit = useAsyncAction(async ({ topics: topicIds }: InterestsValues) => {
    // This finishes onboarding, but only answers with the topics, so fetch the updated member.
    await meApi.setInterests({ topicIds })
    updateUser(toUser(await meApi.getMe()))
    navigate(paths.home, { replace: true })
  })

  // The role comes from the previous screen.
  if (!user?.role) return <Navigate to={paths.onboardingRole} replace />

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
                    {topics.isPending && <Spinner className="text-brand-green" />}
                    {topics.data?.data.map((topic) => (
                      <Pill
                        key={topic.id}
                        label={topic.name}
                        selected={field.value.includes(topic.id)}
                        onSelectedChange={(selected) =>
                          field.onChange(
                            selected ? [...field.value, topic.id] : field.value.filter((value) => value !== topic.id),
                          )
                        }
                      />
                    ))}
                  </div>
                  {errors.topics?.message && <FieldError>{errors.topics.message}</FieldError>}
                </fieldset>
              )}
            />

            <FormAlert message={submit.error ?? (topics.isError ? getErrorMessage(topics.error) : null)} />

            <Button type="submit" loading={submit.pending}>
              Go to Communiti
            </Button>
          </form>
        </div>
      </div>
    </AuthLayout>
  )
}
