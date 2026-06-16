'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { saveConfiguracion } from '@/app/actions/configuracion'

const inputCls = 'w-full border border-gold/20 bg-surface2 px-3 py-2.5 text-sm text-cream placeholder-muted outline-none transition-colors focus:border-gold'

const TERMINOS_DEFAULT = `1. La participación en este sorteo implica la aceptación total de los presentes términos y condiciones.

2. Podrán participar únicamente personas mayores de 18 años con residencia en territorio nacional.

3. La participación será válida únicamente después de que el organizador confirme la recepción del pago correspondiente y registre correctamente los datos del participante.

4. Cada número adquirido representa una oportunidad independiente de participación. Los participantes podrán adquirir más de un número, sujeto a disponibilidad.

5. El sorteo se realizará en la fecha y hora previamente anunciadas a través de los canales oficiales del organizador. Cualquier modificación será comunicada oportunamente.

6. El ganador será seleccionado mediante un mecanismo aleatorio y transparente. El resultado será publicado en los medios oficiales del organizador.

7. El ganador deberá responder a la comunicación del organizador dentro de un plazo máximo de 7 días calendario. En caso de no obtener respuesta dentro de dicho plazo, el organizador podrá realizar un nuevo sorteo.

8. Los premios son personales e intransferibles y no podrán ser canjeados por dinero en efectivo, salvo que el organizador indique expresamente lo contrario.

9. El organizador se reserva el derecho de verificar la identidad de los participantes y solicitar documentación adicional cuando sea necesario para la entrega del premio.

10. Quedarán descalificadas las participaciones que contengan información falsa, incompleta o que incumplan cualquiera de las disposiciones establecidas en estos términos y condiciones.

11. Los datos proporcionados por los participantes serán utilizados únicamente para fines relacionados con la gestión del sorteo y de acuerdo con la normativa aplicable sobre protección de datos.

12. El organizador se reserva el derecho de modificar los presentes términos y condiciones por razones justificadas, informando oportunamente cualquier cambio a través de sus canales oficiales.`

export default function ConfiguracionClient({ config, imageUrls }) {
  const router   = useRouter()
  const pathname = usePathname()
  const formRef  = useRef(null)
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors]          = useState({})
  const [whatsapp, setWhatsapp]      = useState(config.whatsapp_contacto ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    const formData = new FormData(formRef.current)
    startTransition(async () => {
      const result = await saveConfiguracion(formData)
      if (result?.errors) {
        setErrors(result.errors)
        router.replace(`${pathname}?error=${encodeURIComponent(result.errors._ ?? 'Error al guardar')}`, { scroll: false })
      } else {
        router.replace(`${pathname}?success=${encodeURIComponent('Configuración guardada')}`, { scroll: false })
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-wide text-cream">CONFIGURACIÓN</h1>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">

        <Section title="DATOS DEL NEGOCIO">
          <Field label="Nombre del negocio">
            <input
              type="text"
              name="nombre_negocio"
              defaultValue={config.nombre_negocio}
              maxLength={200}
              className={inputCls}
            />
          </Field>
          <Field label="Titular de pago (Yape / Plin)">
            <input
              type="text"
              name="titular_pago"
              defaultValue={config.titular_pago}
              maxLength={200}
              className={inputCls}
            />
          </Field>
          <Field label="WhatsApp de contacto">
            <input
              type="text"
              inputMode="numeric"
              name="whatsapp_contacto"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 9))}
              maxLength={9}
              placeholder="999999999"
              className={inputCls}
            />
          </Field>
        </Section>

        <Section title="IMÁGENES">
          <div className="grid gap-5 sm:grid-cols-3">
            <FileField
              label="Logo"
              name="logo"
              currentUrl={imageUrls.logo_url}
              error={errors.logo}
            />
            <FileField
              label="QR Yape"
              name="qr_yape"
              currentUrl={imageUrls.qr_yape_url}
              error={errors.qr_yape}
            />
          </div>
        </Section>

        <Section title="REDES SOCIALES">
          <Field label="Facebook">
            <input
              type="url"
              name="url_facebook"
              defaultValue={config.url_facebook}
              maxLength={500}
              placeholder="https://facebook.com/..."
              className={inputCls}
            />
          </Field>
          <Field label="Instagram">
            <input
              type="url"
              name="url_instagram"
              defaultValue={config.url_instagram}
              maxLength={500}
              placeholder="https://instagram.com/..."
              className={inputCls}
            />
          </Field>
          <Field label="TikTok">
            <input
              type="url"
              name="url_tiktok"
              defaultValue={config.url_tiktok}
              maxLength={500}
              placeholder="https://tiktok.com/..."
              className={inputCls}
            />
          </Field>
        </Section>

        <Section title="TÉRMINOS Y CONDICIONES" defaultOpen={false}>
          <textarea
            name="terminos_condiciones"
            defaultValue={config.terminos_condiciones ?? TERMINOS_DEFAULT}
            rows={10}
            placeholder="Escribe aquí los términos y condiciones del sorteo…"
            className={`${inputCls} resize-y`}
          />
        </Section>

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
    </div>
  )
}

// ─── Section colapsable ───────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-gold/20 bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-surface2/50"
      >
        <h2 className="border-l-4 border-gold pl-3 font-display text-2xl text-gold">{title}</h2>
        <svg
          className={`size-4 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="space-y-4 border-t border-gold/10 px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── FileField ────────────────────────────────────────────────────────────────

function FileField({ label, name, currentUrl, error }) {
  const [preview, setPreview]   = useState(currentUrl ?? null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef                = useRef(null)

  // Sync when server refreshes — functional update reads latest state (no stale closure)
  useEffect(() => {
    if (!currentUrl) return
    setPreview(prev => prev ?? currentUrl)
  }, [currentUrl])

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setPreview(URL.createObjectURL(file))
    const dt = new DataTransfer()
    dt.items.add(file)
    if (inputRef.current) inputRef.current.files = dt.files
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  function clear() {
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted">{label}</p>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Subir ${label}`}
        className={[
          'flex h-32 cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed bg-surface2 transition-all duration-150',
          dragOver ? 'scale-[1.02] border-gold bg-gold/10' : 'border-gold/30 hover:border-gold/60',
        ].join(' ')}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
        onDrop={onDrop}
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-contain p-2" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted">
            <svg className="size-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">{dragOver ? 'Suelta aquí' : 'Clic o arrastra'}</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
      />
      {preview && (
        <button
          type="button"
          onClick={clear}
          className="text-xs text-muted transition-colors hover:text-danger"
        >
          Quitar imagen
        </button>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-medium uppercase tracking-widest text-muted">
        {label}
      </label>
      {children}
    </div>
  )
}
