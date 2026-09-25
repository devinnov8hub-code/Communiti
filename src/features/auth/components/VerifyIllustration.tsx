import blob from '@/assets/auth/verify-illustration/blob.svg'
import part1 from '@/assets/auth/verify-illustration/part-1.svg'
import part2 from '@/assets/auth/verify-illustration/part-2.svg'
import part3 from '@/assets/auth/verify-illustration/part-3.svg'
import part4 from '@/assets/auth/verify-illustration/part-4.svg'
import part5 from '@/assets/auth/verify-illustration/part-5.svg'
import { cn } from '@/lib/cn'

// Positions of each layer inside the 173×127 envelope frame (from Figma).
const PARTS = [
  { src: part1, inset: 'top-[17.82%] right-[1.93%] bottom-[6%] left-[18.93%]' },
  { src: part2, inset: 'top-[31.23%] right-[81.13%] bottom-[52.59%] left-[1.97%]' },
  { src: part3, inset: 'top-[63.64%] right-[67.57%] bottom-[22.55%] left-[9.73%]' },
  { src: part4, inset: 'top-[40.59%] right-[12.03%] bottom-[47%] left-[79.5%]' },
  { src: part5, inset: 'top-[5.45%] right-[47.33%] bottom-[77.64%] left-[38.53%]' },
]

/** Envelope-with-letter illustration shown on "Enter verification code". */
export function VerifyIllustration({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('relative h-[193px] w-full overflow-clip', className)}>
      <img
        src={blob}
        alt=""
        width={208}
        height={145}
        className="absolute top-[27.5px] left-[calc(50%-4px)] h-[145px] w-[208px] max-w-none -translate-x-1/2"
      />
      <div className="absolute top-[20.5px] left-[calc(50%+3.5px)] h-[127px] w-[173px] -translate-x-1/2 overflow-clip">
        {PARTS.map(({ src, inset }) => (
          <span key={src} className={cn('absolute', inset)}>
            <img src={src} alt="" className="block size-full max-w-none" />
          </span>
        ))}
      </div>
    </div>
  )
}
