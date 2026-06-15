'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState, useTransition } from 'react'
import { registrarParticipante } from '@/app/actions/participantes'

async function comprimirImagen(file, maxDimension = 1200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Canvas toBlob failed')); return }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
          },
          'image/webp',
          quality
        )
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const TIPO_LABEL = {
  sorteo: 'SORTEO', pozito: 'POZITO', especial: 'ESPECIAL', aniversario: 'ANIVERSARIO',
}

const PASOS = [
  { n: 1, texto: 'Elige el monto y realiza el pago por Yape o Plin al titular indicado.' },
  { n: 2, texto: 'Toma una captura de pantalla del comprobante de pago.' },
  { n: 3, texto: 'Completa el formulario con tus datos y sube la captura.' },
  { n: 4, texto: 'Espera la confirmación. Te avisaremos por WhatsApp y verás el resultado en vivo.' },
]

function pluralizar(nombre) {
  return nombre.split(' ').map(w => {
    const lw = w.toLowerCase()
    if (lw.endsWith('s')) return lw
    if (/[aeiouáéíóú]$/i.test(lw)) return lw + 's'
    return lw + 'es'
  }).join(' ')
}

export default function SorteoPublicoClient({ sorteo, config }) {
  const countdown = useCountdown(sorteo.fecha_sorteo)
  const [enviado, setEnviado] = useState(false)

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
        className="relative overflow-hidden border-b border-gold/20 px-4 py-10 md:py-16"
      >
        <div className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: 'url(/sorteo-hero.webp)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(6px)', transform: 'scale(1.05)' }} />
        <div className="pointer-events-none absolute inset-0" style={{ background: 'rgba(10,10,10,0.78)' }} />
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-bg">
              {TIPO_LABEL[sorteo.tipo] ?? sorteo.tipo.toUpperCase()}
            </span>
          </div>
          <h1 className="font-display text-6xl leading-none text-cream md:text-8xl">{sorteo.nombre}</h1>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted">
            <IconCalendar />
            {sorteo.fecha_sorteo_fmt}
          </p>
          {sorteo.descripcion && (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted/80">{sorteo.descripcion}</p>
          )}
          {countdown && !countdown.expired && (
            <div className="mt-6 inline-flex items-center gap-1.5">
              {buildUnits(countdown).map(({ v, l }, i, arr) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="flex flex-col items-center border border-gold/30 bg-bg px-3 py-2">
                    <span className="font-display text-4xl leading-none text-gold">{String(v).padStart(2, '0')}</span>
                    <span className="mt-1 text-[9px] uppercase tracking-widest text-muted">{l}</span>
                  </div>
                  {i < arr.length - 1 && <span className="font-display text-2xl text-gold/50">:</span>}
                </div>
              ))}
            </div>
          )}
          {countdown?.expired && (
            <p className="mt-4 font-display text-2xl tracking-widest text-gold">¡EL SORTEO ESTÁ EN CURSO!</p>
          )}
        </div>
      </motion.div>

      {/* Stepper */}
      <div className="border-b border-gold/10 bg-surface px-4 py-5">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start gap-0">
            {PASOS.map((paso, i) => (
              <div key={paso.n} className="flex flex-1 items-start">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex size-7 items-center justify-center rounded-full bg-gold text-xs font-bold text-bg">{paso.n}</div>
                  <p className="hidden w-20 text-center text-[9px] leading-tight text-muted sm:block">
                    {['Pagar', 'Captura', 'Registrar', 'Esperar'][i]}
                  </p>
                </div>
                {i < PASOS.length - 1 && <div className="mt-3.5 flex-1 border-t-2 border-dashed border-gold/20" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
        <div className="grid gap-8 lg:grid-cols-2">

          {/* Columna izquierda */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="space-y-6">
            {sorteo.premios?.length > 0 && (
              <section className="border border-gold/20 bg-surface">
                <div className="border-b border-gold/10 px-5 py-4">
                  <h2 className="border-l-4 border-gold pl-3 font-display text-3xl text-gold">PREMIOS</h2>
                </div>
                <ul className="divide-y divide-gold/10">
                  {sorteo.premios.map(p => (
                    <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                      <p className="text-sm text-cream">
                        <span className="text-base font-bold text-gold">{p.cantidad}</span>
                        {'  '}{p.cantidad > 1 ? pluralizar(p.nombre) : p.nombre}
                      </p>
                      {p.monto != null ? (
                        <span className="shrink-0 font-bold text-gold">S/ {Number(p.monto).toFixed(2)}</span>
                      ) : p.descripcion_premio ? (
                        <span className="shrink-0 text-sm text-muted">{p.descripcion_premio}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="border border-gold/20 bg-surface px-5 py-5">
              <h2 className="mb-5 border-l-4 border-gold pl-3 font-display text-2xl text-cream">CÓMO PARTICIPAR</h2>
              <ol className="flex flex-col gap-4">
                {PASOS.map(({ n, texto }) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center bg-gold text-xs font-bold text-bg">{n}</span>
                    <span className="text-sm text-muted">{texto}</span>
                  </li>
                ))}
              </ol>
            </section>
          </motion.div>

          {/* Columna derecha */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="space-y-5">
            <div className="bg-gold p-6 text-center text-bg">
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">Precio por participación</p>
              <p className="font-display text-5xl leading-tight">S/ {Number(sorteo.precio_participacion).toFixed(2)}</p>
            </div>

            <div>
              <h3 className="mb-3 font-display text-2xl text-cream">REALIZA TU PAGO</h3>
              <div className="grid grid-cols-2 gap-3">
                <QrCard label="YAPE" imgUrl={config.qr_yape_url} titular={config.titular_pago} />
                <QrCard label="PLIN" imgUrl={config.qr_plin_url} titular={config.titular_pago} />
              </div>
            </div>

            <div className="flex items-center gap-3 border-l-4 border-gold bg-gold/10 px-4 py-3">
              <svg className="size-5 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-cream">Toma captura de pantalla del pago antes de continuar</p>
            </div>

            {enviado ? (
              <SuccessState whatsapp={config.whatsapp_contacto} />
            ) : (
              <RegistroForm
                sorteoId={sorteo.id}
                terminos={config.terminos_condiciones}
                onSuccess={() => setEnviado(true)}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/* ── QR Card ── */
function QrCard({ label, imgUrl, titular }) {
  return (
    <div className="flex flex-col items-center gap-3 border border-gold/30 bg-surface2 p-4 text-center">
      <p className="font-display text-xl tracking-widest text-gold">{label}</p>
      {imgUrl ? (
        <img src={imgUrl} alt={`QR ${label}`} className="h-28 w-28 border border-gold/20 object-contain" />
      ) : (
        <div className="flex h-28 w-28 flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gold/20 text-muted">
          <svg className="size-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path strokeLinecap="round" d="M14 14h.01M14 17h3M17 14v3M20 17v.01M20 14h.01" />
          </svg>
          <span className="text-[9px] leading-tight">Sin QR<br/>configurado</span>
        </div>
      )}
      {titular && <p className="text-xs font-bold text-gold">{titular}</p>}
    </div>
  )
}

/* ── Estado éxito ── */
function SuccessState({ whatsapp }) {
  const digits = whatsapp?.replace(/\D/g, '') ?? ''
  const waHref = digits ? `https://wa.me/${digits.length === 9 ? `51${digits}` : digits}` : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="border border-gold/20 bg-surface p-8 text-center"
    >
      <div className="mx-auto mb-5 flex size-16 items-center justify-center border border-gold bg-gold/20 text-gold">
        <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="font-display text-4xl text-gold">¡REGISTRO RECIBIDO!</p>
      <p className="mx-auto mt-3 max-w-sm text-sm text-cream">
        Tu participación está <span className="font-semibold text-gold">pendiente de confirmación</span>.
        Te notificaremos por WhatsApp una vez revisado el comprobante.
      </p>
      {waHref && (
        <a href={waHref} target="_blank" rel="noreferrer"
          className="mt-6 inline-block bg-gold px-6 py-3 text-sm font-bold uppercase tracking-widest text-bg transition-colors hover:bg-gold-light">
          Contactar por WhatsApp
        </a>
      )}
    </motion.div>
  )
}

/* ── Modal términos ── */
function TerminosModal({ terminos, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} onClick={onClose}>
      <div className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto border border-gold/30 bg-surface shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gold/20 px-6 py-4">
          <h3 className="font-display text-2xl text-gold">TÉRMINOS Y CONDICIONES</h3>
          <button type="button" onClick={onClose} className="text-muted transition-colors hover:text-cream">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="whitespace-pre-wrap px-6 py-5 text-sm leading-relaxed text-content">{terminos}</div>
        <div className="border-t border-gold/20 px-6 py-4">
          <button type="button" onClick={onClose}
            className="w-full bg-gold py-2.5 text-sm font-bold uppercase tracking-widest text-bg transition-colors hover:bg-gold-light">
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Formulario de registro ── */
function RegistroForm({ sorteoId, terminos, onSuccess }) {
  const [preview, setPreview]           = useState(null)
  const [comprobanteFile, setComprobanteFile] = useState(null)
  const [showTerminos, setShowTerminos]  = useState(false)
  const [dragOver, setDragOver]          = useState(false)
  const [nombres, setNombres]            = useState('')
  const [apellidos, setApellidos]        = useState('')
  const [whatsapp, setWhatsapp]          = useState('')
  const [aceptoTerminos, setAcepto]      = useState(false)
  const [errors, setErrors]              = useState({})
  const [isPending, startTransition]     = useTransition()
  const formRef = useRef(null)
  const fileRef = useRef(null)

  async function handleFile(file) {
    if (!file) return
    const compressed = await comprimirImagen(file)
    setPreview(URL.createObjectURL(compressed))
    setComprobanteFile(compressed)
  }

  function submit(e) {
    e.preventDefault()
    setErrors({})
    const fd = new FormData(formRef.current)
    fd.set('terminos', String(aceptoTerminos))
    if (comprobanteFile) {
      fd.set('comprobante', comprobanteFile)
    } else {
      fd.delete('comprobante')
    }
    startTransition(async () => {
      const result = await registrarParticipante(fd)
      if (result?.errors) {
        setErrors(result.errors)
      } else {
        onSuccess()
      }
    })
  }

  const inputCls = err => [
    'w-full border bg-surface2 px-3 py-2.5 text-sm text-cream placeholder-muted outline-none transition-colors',
    err ? 'border-danger' : 'border-gold/20 focus:border-gold',
  ].join(' ')

  return (
    <>
      {showTerminos && terminos && (
        <TerminosModal terminos={terminos} onClose={() => setShowTerminos(false)} />
      )}

      <form ref={formRef} onSubmit={submit} noValidate className="space-y-5 border border-gold/20 bg-surface p-5">
        {/* Honeypot */}
        <div style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <input type="hidden" name="sorteo_id" value={sorteoId} />
        <h2 className="font-display text-3xl text-cream">REGISTRAR PARTICIPACIÓN</h2>

        {errors._ && (
          <div className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{errors._}</div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombres" error={errors.nombres}>
            <input type="text" name="nombres" value={nombres} onChange={e => setNombres(e.target.value)}
              maxLength={100} className={inputCls(errors.nombres)} placeholder="Juan" />
          </Field>
          <Field label="Apellidos" error={errors.apellidos}>
            <input type="text" name="apellidos" value={apellidos} onChange={e => setApellidos(e.target.value)}
              maxLength={100} className={inputCls(errors.apellidos)} placeholder="Pérez" />
          </Field>
        </div>

        <Field label="WhatsApp" error={errors.whatsapp}>
          <input type="text" inputMode="numeric" name="whatsapp" value={whatsapp}
            onChange={e => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 9))}
            maxLength={9} pattern="\d{9}" className={inputCls(errors.whatsapp)} placeholder="999999999" />
        </Field>

        <Field label="Foto del comprobante" error={errors.comprobante}>
          <div
            className={['cursor-pointer overflow-hidden border-2 border-dashed bg-surface2 transition-all duration-150',
              dragOver ? 'scale-[1.01] border-gold bg-gold/5'
              : errors.comprobante ? 'border-danger' : 'border-gold/30 hover:border-gold/60'].join(' ')}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          >
            {preview ? (
              <img src={preview} alt="Comprobante" className="max-h-48 w-full object-contain p-2" />
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-muted">
                <svg className="size-10 text-gold/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-cream">
                  {dragOver ? 'Suelta aquí la imagen' : 'Sube la captura de tu pago'}
                </span>
                <span className="text-xs text-muted/70">Clic para seleccionar · o arrastra la imagen</span>
                <span className="mt-1 text-[10px] uppercase tracking-widest text-muted/50">JPG, PNG, WEBP</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" name="comprobante" accept="image/*"
            onChange={e => handleFile(e.target.files[0])} className="hidden" />
        </Field>

        <div className="space-y-1">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" checked={aceptoTerminos} onChange={e => setAcepto(e.target.checked)}
              className="mt-0.5 size-4 accent-gold" />
            <span className="text-muted">
              Acepto los{' '}
              {terminos ? (
                <button type="button" onClick={() => setShowTerminos(true)} className="text-gold underline hover:text-gold-light">
                  términos y condiciones
                </button>
              ) : (
                <span className="text-gold">términos y condiciones</span>
              )}{' '}
              del sorteo.
            </span>
          </label>
          {errors.terminos && <p className="text-xs text-danger">{errors.terminos}</p>}
        </div>

        <button
          type="submit" disabled={isPending}
          className="w-full bg-danger py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-danger-dark disabled:opacity-50"
        >
          {isPending ? 'Enviando…' : 'ENVIAR REGISTRO'}
        </button>
      </form>
    </>
  )
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-medium uppercase tracking-widest text-muted">{label}</label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

function buildUnits(cd) {
  if (cd.days > 0) return [{ v: cd.days, l: 'días' }, { v: cd.hours, l: 'horas' }, { v: cd.minutes, l: 'min' }]
  return [{ v: cd.hours, l: 'horas' }, { v: cd.minutes, l: 'min' }, { v: cd.seconds, l: 'seg' }]
}

function calcDiff(iso) {
  if (!iso) return null
  const remaining = new Date(iso).getTime() - Date.now()
  if (remaining <= 0) return { expired: true }
  return {
    expired: false,
    days:    Math.floor(remaining / 86_400_000),
    hours:   Math.floor((remaining % 86_400_000) / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    seconds: Math.floor((remaining % 60_000) / 1000),
  }
}

function useCountdown(iso) {
  const [diff, setDiff] = useState(null)
  useEffect(() => {
    setDiff(calcDiff(iso))
    const id = setInterval(() => setDiff(calcDiff(iso)), 1000)
    return () => clearInterval(id)
  }, [iso])
  return diff
}

function IconCalendar() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
