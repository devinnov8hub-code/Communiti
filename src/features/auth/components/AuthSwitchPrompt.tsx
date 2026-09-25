import { Link } from 'react-router-dom'

interface AuthSwitchPromptProps {
  prompt: string
  linkLabel: string
  to: string
}

/** "Already have an account? LogIn" / "Don’t have an account? Sign Up" */
export function AuthSwitchPrompt({ prompt, linkLabel, to }: AuthSwitchPromptProps) {
  return (
    <p className="text-center text-body-m text-grey-50 dark:text-white">
      {prompt}{' '}
      <Link to={to} className="text-brand-green hover:underline">
        {linkLabel}
      </Link>
    </p>
  )
}
