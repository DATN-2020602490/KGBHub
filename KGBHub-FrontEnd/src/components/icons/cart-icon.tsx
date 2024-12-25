import { ComponentProps } from 'react'

export default function CartIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={32}
      height={32}
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M4.035 16.927c.462 2.309.693 3.463 1.522 4.143s2.007.68 4.362.68h4.162c2.355 0 3.532 0 4.361-.68c.83-.68 1.06-1.834 1.523-4.143l.6-3c.664-3.32.996-4.98.096-6.079S18.067 6.75 14.68 6.75H9.32c-3.386 0-5.08 0-5.98 1.098s-.568 2.758.096 6.079z"
        opacity=".5"
      />
      <circle cx={15} cy="9.75" r={1} fill="currentColor" />
      <circle cx={9} cy="9.75" r={1} fill="currentColor" />
      <path
        fill="currentColor"
        d="M9.75 5.75a2.25 2.25 0 0 1 4.5 0v1h.431q.565 0 1.069.002V5.75a3.75 3.75 0 1 0-7.5 0v1.002q.504-.003 1.069-.002h.431z"
      />
    </svg>
  )
}
