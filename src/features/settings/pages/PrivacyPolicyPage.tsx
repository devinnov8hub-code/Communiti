import { SettingsSection } from '../components/SettingsSection'

// TODO: replace with the final policy text from the legal team.
const SECTIONS = [
  {
    title: 'Information we collect',
    body: 'We collect the details you give us when you create an account — such as your email address, role, date of birth and country — along with the content you post, projects you join and messages you send.',
  },
  {
    title: 'How we use your information',
    body: 'We use your information to run CommUniti: to personalise your feed, connect you with collaborators, keep the community safe and let you know about activity that matters to you.',
  },
  {
    title: 'Who can see your information',
    body: 'Your profile and posts are visible to the community according to your Visibility settings. We never sell your personal data.',
  },
  {
    title: 'Your choices',
    body: 'You can update your account details, control who can message you and request collaborations, and delete your account at any time from Settings.',
  },
]

/** Settings → Privacy policy (no Figma frame; plain readable document). */
export function PrivacyPolicyPage() {
  return (
    <SettingsSection title="Privacy policy" className="gap-6 lg:max-w-[720px]">
      <p className="text-body-m text-fg-muted">Last updated: September 2026</p>
      {SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="text-body-l font-semibold text-fg">{section.title}</h2>
          <p className="text-body-m text-fg">{section.body}</p>
        </section>
      ))}
    </SettingsSection>
  )
}
