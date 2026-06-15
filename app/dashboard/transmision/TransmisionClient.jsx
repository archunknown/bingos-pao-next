'use client'

import { useState, useTransition, useRef } from 'react'
import { saveTransmision } from '@/app/actions/configuracion'

const ESTADOS = [
  {
    value:       'sin_transmision',
    label:       'Sin transmisión',
    descripcion: 'La sección de transmisión no aparece en la web.',
    Icon:        IconOff,
  },
  {
    value:       'proximamente',
    label:       'Próximamente',
    descripcion: 'Se oculta el card de stream. Usa el mensaje del hero para anunciar la fecha.',
    Icon:        IconClock,
  },
  {
    value:       'en_vivo',
    label:       'En vivo',
    descripcion: 'Se muestra el card de transmisión con el enlace al live de Facebook.',
    Icon:        IconLive,
  },
]

const ESTADO_STYLES = {
  sin_transmision: {
    active:   'border-muted/60 bg-surface2 text-cream',
    inactive: 'border-gold/10 text-muted hover:border-gold/30 hover:text-content',
    dot:      'bg-muted',
    accent:   'border-l-muted',
  },
  proximamente: {
    active:   'border-gold bg-gold/10 text-gold',
    inactive: 'border-gold/10 text-muted hover:border-gold/30 hover:text-content',
    dot:      'bg-gold',
    accent:   'border-l-gold',
  },
  en_vivo: {
    active:   'border-danger bg-danger/10 text-danger',
    inactive: 'border-gold/10 text-muted hover:border-gold/30 hover:text-content',
    dot:      'bg-danger animate-pulse',
    accent:   'border-l-danger',
  },
}

export default function TransmisionClient({ config }) {
  const [data, setData] = useState({
    url_stream_live:    config.url_stream_live    ?? '',
    url_stream_grabado: config.url_stream_grabado ?? '',
    estado_stream:      config.estado_stream      || 'sin_transmision',
    mensaje_destacado:  config.mensaje_destacado  ?? '',
  })
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors]          = useState({})
  const [toast, setToast]            = useState(null)
  const toastTimer                   = useRef(null)

  function set(key, val) {
    setData(prev => ({ ...prev, [key]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    startTransition(async () => {
      const result = await saveTransmision(data)
      if (result?.errors) {
        setErrors(result.errors)
        showToast(false, result.errors._ ?? 'Error al guardar')
      } else {
        showToast(true, 'Configuración guardada')
      }
    })
  }

  function showToast(ok, message) {
    clearTimeout(toastTimer.current)
    setToast({ ok, message })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  const styles = ESTADO_STYLES[data.estado_stream]
  const isLive = data.estado_stream === 'en_vivo'
  const isProx = data.estado_stream === 'proximamente'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-wide text-cream">TRANSMISIÓN</h1>
        {toast && (
          <div className={[
            'flex items-center gap-2 rounded border px-4 py-2 text-sm font-medium',
            toast.ok
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-danger/30 bg-danger/10 text-danger',
          ].join(' ')}>
            {toast.ok ? '✓' : '✕'} {toast.message}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Estado selector */}
          <section className="border border-gold/20 bg-surface p-5">
            <p className="mb-4 text-[10px] font-medium uppercase tracking-widest text-muted">
              Estado actual
            </p>
            <div className="flex flex-col gap-2">
              {ESTADOS.map(({ value, label, descripcion, Icon }) => {
                const active = data.estado_stream === value
                const s      = ESTADO_STYLES[value]
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('estado_stream', value)}
                    className={['flex items-center gap-4 border p-4 text-left transition-colors', active ? s.active : s.inactive].join(' ')}
                  >
                    <span className={['flex size-9 shrink-0 items-center justify-center border', active ? 'border-current bg-current/10' : 'border-gold/20 bg-surface2'].join(' ')}>
                      <Icon className={`size-4 ${active ? 'text-current' : 'text-muted'}`} />
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{label}</span>
                        {active && <span className={`size-1.5 rounded-full ${s.dot}`} />}
                      </span>
                      <span className="mt-0.5 block text-xs opacity-60">{descripcion}</span>
                    </span>
                    <span className={['size-4 shrink-0 rounded-full border-2 transition-colors', active ? 'border-current bg-current' : 'border-gold/30'].join(' ')} />
                  </button>
                )
              })}
            </div>
          </section>

          {/* URL contextual */}
          {!isProx && (
            <section className={`border border-gold/20 border-l-4 bg-surface p-5 ${styles.accent}`}>
              {isLive ? (
                <>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-muted">
                    Enlace al live de Facebook
                  </p>
                  <p className="mb-3 text-xs text-muted">Pega la URL del video que está transmitiendo ahora.</p>
                  <input
                    type="url"
                    value={data.url_stream_live}
                    onChange={(e) => set('url_stream_live', e.target.value)}
                    placeholder="https://www.facebook.com/username/videos/..."
                    className={iCls(errors.url_stream_live)}
                  />
                  {errors.url_stream_live && (
                    <p className="mt-1 text-xs text-danger">{errors.url_stream_live}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-muted">
                    Enlace a la última grabación{' '}
                    <span className="normal-case tracking-normal opacity-60">(opcional)</span>
                  </p>
                  <p className="mb-3 text-xs text-muted">
                    Si hay URL, se mostrará el card de "Última transmisión" en la web.
                  </p>
                  <input
                    type="url"
                    value={data.url_stream_grabado}
                    onChange={(e) => set('url_stream_grabado', e.target.value)}
                    placeholder="https://www.facebook.com/username/videos/..."
                    className={iCls(errors.url_stream_grabado)}
                  />
                  {errors.url_stream_grabado && (
                    <p className="mt-1 text-xs text-danger">{errors.url_stream_grabado}</p>
                  )}
                </>
              )}
            </section>
          )}

          {/* Mensaje del hero */}
          <section className="border border-gold/20 bg-surface p-5">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-muted">
              Mensaje del hero{' '}
              <span className="normal-case tracking-normal opacity-60">(opcional)</span>
            </p>
            <p className="mb-3 text-xs text-muted">
              Aparece debajo del título en la página de inicio.
            </p>
            <textarea
              value={data.mensaje_destacado}
              onChange={(e) => set('mensaje_destacado', e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ej. ¡Próximo sorteo el sábado a las 8pm! Inscríbete ahora."
              className={`${iCls(errors.mensaje_destacado)} resize-none`}
            />
            <p className="mt-1 text-right text-xs text-muted">
              {data.mensaje_destacado.length}/500
            </p>
            {errors.mensaje_destacado && (
              <p className="mt-1 text-xs text-danger">{errors.mensaje_destacado}</p>
            )}
          </section>

          {errors._ && (
            <p className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {errors._}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="bg-gold px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-bg transition hover:bg-gold-light disabled:opacity-50"
            >
              {isPending ? 'Guardando…' : 'Guardar configuración'}
            </button>
          </div>
        </form>

        {/* Preview en tiempo real */}
        <div className="space-y-3 lg:sticky lg:top-6">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
            Vista previa pública
          </p>
          <StreamCardPreview data={data} />
        </div>
      </div>
    </div>
  )
}

// ─── Preview ──────────────────────────────────────────────────────────────────

function StreamCardPreview({ data }) {
  const { estado_stream, url_stream_live, url_stream_grabado, mensaje_destacado } = data
  const isLive     = estado_stream === 'en_vivo'
  const isProx     = estado_stream === 'proximamente'
  const hasGrabado = !!url_stream_grabado

  return (
    <div className="space-y-3">
      {mensaje_destacado && (
        <div className="border border-gold/20 bg-surface p-4">
          <p className="mb-1 text-[9px] uppercase tracking-widest text-muted/60">Hero — mensaje</p>
          <p className="text-sm font-medium text-gold">"{mensaje_destacado}"</p>
        </div>
      )}

      {estado_stream === 'sin_transmision' && !hasGrabado && (
        <div className="flex flex-col items-center gap-2 border border-dashed border-muted/20 bg-surface p-6 text-center">
          <IconOff className="size-8 text-muted/30" />
          <p className="text-xs text-muted/50">La sección de transmisión no aparece</p>
        </div>
      )}

      {isLive && (
        <div className={['border-2 bg-surface p-4', url_stream_live ? 'border-danger/60' : 'border-danger/30'].join(' ')}>
          <div className="mb-3 flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-danger" />
            <span className="text-xs font-bold uppercase tracking-widest text-danger">En Vivo</span>
          </div>
          <div className="mb-3 flex aspect-video items-center justify-center bg-black/60">
            <svg className="size-10 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <div className={['py-2 text-center text-xs font-bold uppercase tracking-wider', url_stream_live ? 'bg-danger text-white' : 'bg-surface2 text-muted'].join(' ')}>
            {url_stream_live ? 'Ver transmisión en vivo →' : 'Sin URL — botón no disponible'}
          </div>
        </div>
      )}

      {isProx && (
        <div className="border border-gold/30 bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <IconClock className="size-4 text-gold" />
            <span className="text-xs font-bold uppercase tracking-widest text-gold">Próximamente</span>
          </div>
          <p className="text-xs text-muted">
            El card de stream está oculto. Usa el mensaje del hero para anunciar la fecha.
          </p>
        </div>
      )}

      {estado_stream === 'sin_transmision' && hasGrabado && (
        <div className="border border-gold/20 bg-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <IconOff className="size-4 text-muted" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted">Última transmisión</span>
          </div>
          <div className="mb-3 flex aspect-video items-center justify-center bg-black/60">
            <svg className="size-10 text-muted/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="bg-surface2 py-2 text-center text-xs font-bold uppercase tracking-wider text-muted">
            Ver grabación →
          </div>
        </div>
      )}

      <div className={`flex items-start gap-2 border-l-4 bg-surface2 px-3 py-2.5 text-xs text-muted ${ESTADO_STYLES[data.estado_stream].accent}`}>
        <svg className="mt-0.5 size-3.5 shrink-0 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{previewText(data)}</span>
      </div>
    </div>
  )
}

function previewText({ estado_stream, url_stream_live, url_stream_grabado, mensaje_destacado }) {
  const parts = []
  if (estado_stream === 'en_vivo' && url_stream_live)
    parts.push('card EN VIVO con enlace al live')
  else if (estado_stream === 'en_vivo')
    parts.push('estado En vivo sin URL — sin enlace visible')
  else if (estado_stream === 'sin_transmision' && url_stream_grabado)
    parts.push('card "Última transmisión"')
  else
    parts.push('sin card de transmisión')
  if (mensaje_destacado) parts.push('mensaje en el hero')
  return parts.join(' · ') + '.'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function iCls(error) {
  return [
    'w-full border bg-surface2 px-3 py-2.5 text-sm text-cream placeholder-muted outline-none transition-colors',
    error ? 'border-danger' : 'border-gold/20 focus:border-gold',
  ].join(' ')
}

function IconOff({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 6.343L4.929 4.929M19.07 4.929l-1.414 1.414M4.929 19.07l1.414-1.414M6.343 17.657a5 5 0 010-7.072M3 12H1m22 0h-2" />
    </svg>
  )
}

function IconClock({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconLive({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M6.343 6.343a8 8 0 000 11.314M17.657 6.343a8 8 0 010 11.314" />
      <path strokeLinecap="round" d="M3.515 3.515a13 13 0 000 16.97M20.485 3.515a13 13 0 010 16.97" opacity="0.4" />
    </svg>
  )
}
