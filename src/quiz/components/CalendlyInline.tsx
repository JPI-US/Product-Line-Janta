import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: {
        url: string
        parentElement: HTMLElement
        prefill?: Record<string, string | undefined>
        utm?: Record<string, string | undefined>
      }) => void
    }
  }
}

const CALENDLY_SCRIPT_SRC = 'https://assets.calendly.com/assets/external/widget.js'

type Props = {
  /** Full Calendly scheduling URL, e.g. https://calendly.com/your-org/30min */
  url: string
  className?: string
}

/**
 * Inline Calendly embed (official widget script + `initInlineWidget`).
 */
export function CalendlyInline({ url, className }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parent = parentRef.current
    const trimmed = url.trim()
    if (!parent || !trimmed) return

    let cancelled = false

    const init = () => {
      if (cancelled || !parent.isConnected) return
      parent.replaceChildren()
      window.Calendly?.initInlineWidget({ url: trimmed, parentElement: parent })
    }

    parent.replaceChildren()

    if (window.Calendly) {
      init()
    } else {
      let script = document.querySelector<HTMLScriptElement>(`script[src="${CALENDLY_SCRIPT_SRC}"]`)
      if (!script) {
        script = document.createElement('script')
        script.src = CALENDLY_SCRIPT_SRC
        script.async = true
        document.body.appendChild(script)
      }
      if (window.Calendly) {
        init()
      } else {
        script.addEventListener('load', init, { once: true })
      }
    }

    return () => {
      cancelled = true
      parent.replaceChildren()
    }
  }, [url])

  return <div ref={parentRef} className={className ?? 'savings-calendly-host'} />
}
