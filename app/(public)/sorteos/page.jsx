'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// The proxy handles this redirect before the page is ever rendered.
// This component is a client-side fallback only.
export default function SorteosPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/') }, [router])
  return null
}
