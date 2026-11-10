import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import type { Innovation } from '../types'

/** Horizontal "Featured Innovations" cards on the Explore tab. */
export function InnovationStrip({ innovations }: { innovations: Innovation[] }) {
  return (
    <ul className="-mx-2 flex snap-x [scrollbar-width:thin] gap-[15px] overflow-x-auto px-2 pb-1">
      {innovations.map((innovation) => (
        <li key={innovation.id} className="shrink-0 snap-start">
          <Link
            to={paths.innovation(innovation.id)}
            className="flex w-[206px] flex-col items-center justify-center gap-2 rounded-card bg-surface px-3 py-2.5 transition hover:ring-1 hover:ring-hairline"
          >
            {innovation.thumbUrl ? (
              <img
                src={innovation.thumbUrl}
                alt=""
                width={80}
                height={63}
                loading="lazy"
                className="h-[63px] w-20 object-contain"
              />
            ) : (
              <span aria-hidden className="h-[63px] w-20 rounded-md bg-background" />
            )}
            <span className="flex w-full flex-col gap-[7px] text-center">
              <span className="text-body-m text-innovation">{innovation.title}</span>
              <span className="text-caption whitespace-pre-line text-grey-45 dark:text-grey-30">
                {innovation.tagline}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
