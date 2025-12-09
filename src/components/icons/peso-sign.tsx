
import * as React from "react"

export const PesoSign = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M8 19V5" />
    <path d="M8 12h5.5a4.5 4.5 0 1 1 0 7H8" />
    <path d="M8 8h4.5a2.5 2.5 0 1 1 0 5H8" />
  </svg>
)
