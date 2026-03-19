"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={{
        "--normal-bg": "#111118",
        "--normal-text": "#f0f0f5",
        "--normal-border": "#222230",
        "--success-bg": "#111118",
        "--success-text": "#22c55e",
        "--success-border": "#22c55e44",
        "--error-bg": "#111118",
        "--error-text": "#f43f5e",
        "--error-border": "#f43f5e44",
        "--border-radius": "10px",
      }}
      {...props}
    />
  )
}

export { Toaster }