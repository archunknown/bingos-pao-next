'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setProcessing(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setProcessing(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const nombre = 'Bingos Pao'

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-4 font-sans">
      <title>Acceso Admin — Bingos Pao</title>

      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(212,175,55,0.08),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(212,175,55,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.4) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-sm"
      >
        {/* Logo + nombre */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-2xl font-bold text-bg shadow-lg shadow-gold/20">
            {nombre.charAt(0)}
          </div>
          <h1 className="font-display text-3xl tracking-widest text-gold">{nombre}</h1>
          <p className="text-xs text-muted">Panel de administración</p>
        </div>

        {/* Tarjeta */}
        <div className="rounded-2xl border border-gold/10 bg-surface p-8 shadow-2xl shadow-black/60">
          <form onSubmit={submit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                autoComplete="username"
                autoFocus
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gold/10 bg-surface2 px-4 py-2.5 text-sm text-content placeholder-muted/50 outline-none transition focus:border-gold/40 focus:ring-1 focus:ring-gold/30"
                placeholder="admin@ejemplo.com"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gold/10 bg-surface2 px-4 py-2.5 pr-10 text-sm text-content placeholder-muted/50 outline-none transition focus:border-gold/40 focus:ring-1 focus:ring-gold/30"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-cream"
                  aria-label="Mostrar contraseña"
                >
                  {showPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Error de autenticación */}
            {error && (
              <p className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-2.5 text-xs text-danger">
                {error}
              </p>
            )}

            {/* Botón */}
            <motion.button
              type="submit"
              disabled={processing}
              whileHover={{ scale: processing ? 1 : 1.02 }}
              whileTap={{ scale: processing ? 1 : 0.98 }}
              className="mt-1 w-full rounded-lg bg-gold py-2.5 text-sm font-bold text-bg transition-colors hover:bg-gold-light disabled:opacity-50"
            >
              {processing ? 'Ingresando…' : 'Ingresar'}
            </motion.button>
          </form>
        </div>

        {/* Volver al sitio */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-gold"
          >
            <IconArrowLeft />
            Volver al sitio
          </a>
        </div>
      </motion.div>
    </div>
  )
}

function IconEye() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

function IconArrowLeft() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}
