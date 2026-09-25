/** Inline form-level error (e.g. an API failure). */
export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="w-full rounded-control border border-red-500/40 bg-red-500/10 px-3 py-2 text-body-s text-red-600 dark:text-red-400"
    >
      {message}
    </p>
  )
}
