import googleLogo from '@/assets/social/google.svg'
import { Button, type ButtonProps } from '@/components/ui'

export function GoogleButton(props: Omit<ButtonProps, 'variant' | 'children'>) {
  return (
    <Button variant="outline" {...props}>
      {/* Figma: 32px frame with the Google mark inset (material-icon-theme:google). */}
      <span className="relative size-8 shrink-0 overflow-hidden">
        <span className="absolute top-[6.25%] right-[7.73%] bottom-[6.29%] left-[7.81%]">
          <img src={googleLogo} alt="" className="block size-full max-w-none" />
        </span>
      </span>
      Continue with Google
    </Button>
  )
}
