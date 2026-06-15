'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

export default function FlashToast() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (!success && !error) return

    setToast({ msg: success || error, type: success ? 'success' : 'error' })

    const params = new URLSearchParams(searchParams.toString())
    params.delete('success')
    params.delete('error')
    const newUrl = params.size ? `${pathname}?${params}` : pathname
    router.replace(newUrl, { scroll: false })

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setToast(null), 4000)
    // No cleanup return: router.replace re-triggers this effect with empty params,
    // which hits the early return above and leaves the running timer untouched.
  }, [searchParams.toString()])

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.msg}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="pointer-events-none fixed bottom-6 right-6 z-50 w-80 overflow-hidden rounded-xl border shadow-2xl"
          style={{
            borderColor: toast.type === 'success' ? 'rgba(39,174,96,0.4)' : 'rgba(192,57,43,0.4)',
            backgroundColor: toast.type === 'success' ? 'rgba(39,174,96,0.12)' : 'rgba(192,57,43,0.12)',
          }}
        >
          <div className="flex items-start gap-3 px-4 py-3">
            {toast.type === 'success' ? <IconCheck /> : <IconX />}
            <p className="flex-1 text-sm font-medium text-content">{toast.msg}</p>
            <button
              type="button"
              className="pointer-events-auto shrink-0 text-muted transition hover:text-content"
              onClick={() => setToast(null)}
              aria-label="Cerrar"
            >
              <IconClose />
            </button>
          </div>
          <motion.div
            className="h-0.5 origin-left"
            style={{ backgroundColor: toast.type === 'success' ? '#27AE60' : '#C0392B' }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            onAnimationComplete={() => setToast(null)}
            transition={{ duration: 4, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function IconCheck() {
  return (
    <svg className="mt-0.5 size-4 shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function IconX() {
  return (
    <svg className="mt-0.5 size-4 shrink-0 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
