'use client'

import { useActionState, useState, useRef } from 'react'
import Link from 'next/link'
import { createSorteo, updateSorteo } from '@/app/actions/sorteos'

async function comprimirImagen(file, maxDimension = 1400, quality = 0.82) {
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

const TIPOS = [
  { value: 'sorteo',      label: 'Sorteo' },
  { value: 'pozito',      label: 'Pozito' },
  { value: 'especial',    label: 'Especial' },
  { value: 'aniversario', label: 'Aniversario' },
]

const currentYear = new Date().getFullYear()
const YEARS   = Array.from({ length: 6 }, (_, i) => String(currentYear + i))
const MESES   = [
  ['1','Enero'], ['2','Febrero'], ['3','Marzo'], ['4','Abril'],
  ['5','Mayo'],  ['6','Junio'],   ['7','Julio'], ['8','Agosto'],
  ['9','Septiembre'], ['10','Octubre'], ['11','Noviembre'], ['12','Diciembre'],
]
const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00','05','10','15','20','25','30','35','40','45','50','55']

function pad(n) { return String(n).padStart(2, '0') }

function parseParts(iso) {
  if (!iso) return { year: '', month: '', day: '', hour: '20', minute: '00' }
  const date = new Date(iso)
  if (isNaN(date.getTime())) return { year: '', month: '', day: '', hour: '20', minute: '00' }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(date).map(({ type, value }) => [type, value])
  )
  return {
    year:   parts.year,
    month:  String(parseInt(parts.month)),
    day:    String(parseInt(parts.day)),
    hour:   parts.hour === '24' ? '00' : parts.hour,
    minute: parts.minute,
  }
}

function getDaysInMonth(year, month) {
  if (!year || !month) return 31
  return new Date(parseInt(year), parseInt(month), 0).getDate()
}

function inputCls(error) {
  return [
    'w-full rounded-lg border px-4 py-2.5 text-sm text-content outline-none transition',
    error
      ? 'border-danger/50 bg-danger/5 focus:border-danger/60 focus:ring-1 focus:ring-danger/30'
      : 'border-gold/10 bg-surface2 focus:border-gold/40 focus:ring-1 focus:ring-gold/30',
  ].join(' ')
}

function Field({ label, required, error, children, hint }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
        {required && <span className="ml-1 text-gold/70">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-[11px] text-muted/70">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  )
}

function DateTimePicker({ initialValue, onChange, error }) {
  const p = parseParts(initialValue)
  const [y,  setY]  = useState(p.year)
  const [mo, setMo] = useState(p.month)
  const [d,  setD]  = useState(p.day)
  const [h,  setH]  = useState(p.hour)
  const [mi, setMi] = useState(p.minute)

  function buildIso(y, mo, d, h, mi) {
    if (!y || !mo || !d) return ''
    return `${y}-${pad(mo)}-${pad(d)}T${pad(h || '00')}:${pad(mi || '00')}:00-05:00`
  }

  const days = getDaysInMonth(y, mo)
  const DAY_OPTS = Array.from({ length: days }, (_, i) => String(i + 1))

  function handleYear(val) { setY(val); onChange(buildIso(val, mo, d, h, mi)) }
  function handleMonth(val) {
    const newDays = getDaysInMonth(y, val)
    const newD    = d && parseInt(d) > newDays ? String(newDays) : d
    setMo(val); setD(newD); onChange(buildIso(y, val, newD, h, mi))
  }
  function handleDay(val)    { setD(val);  onChange(buildIso(y, mo, val, h,   mi)) }
  function handleHour(val)   { setH(val);  onChange(buildIso(y, mo, d,   val, mi)) }
  function handleMinute(val) { setMi(val); onChange(buildIso(y, mo, d,   h,   val)) }

  const sCls = [
    'rounded-lg border px-2.5 py-2.5 text-sm text-content outline-none transition appearance-none bg-surface2',
    error
      ? 'border-danger/40 focus:border-danger/60 focus:ring-1 focus:ring-danger/30'
      : 'border-gold/10 focus:border-gold/40 focus:ring-1 focus:ring-gold/30',
  ].join(' ')

  const iso = buildIso(y, mo, d, h, mi)

  return (
    <div className="space-y-2">
      <input type="hidden" name="fecha_sorteo" value={iso} readOnly />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        <select value={y}  onChange={e => handleYear(e.target.value)}   className={`${sCls} col-span-1`} aria-label="Año">
          <option value="">Año</option>
          {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
        </select>
        <select value={mo} onChange={e => handleMonth(e.target.value)}  className={`${sCls} col-span-1`} aria-label="Mes">
          <option value="">Mes</option>
          {MESES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={d}  onChange={e => handleDay(e.target.value)}    className={`${sCls} col-span-1`} aria-label="Día">
          <option value="">Día</option>
          {DAY_OPTS.map(day => <option key={day} value={day}>{day}</option>)}
        </select>
        <select value={h}  onChange={e => handleHour(e.target.value)}   className={`${sCls} col-span-1`} aria-label="Hora">
          {HOURS.map(hr => <option key={hr} value={hr}>{hr}:00</option>)}
        </select>
        <select value={mi} onChange={e => handleMinute(e.target.value)} className={`${sCls} col-span-1`} aria-label="Minutos">
          {MINUTES.map(min => <option key={min} value={min}>:{min}</option>)}
        </select>
      </div>
      {iso && (
        <p className="text-xs text-muted">
          {new Date(iso).toLocaleString('es-PE', {
            timeZone: 'America/Lima',
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}
    </div>
  )
}

function ImageUploadField({ initialUrl, error }) {
  const [preview, setPreview] = useState(initialUrl ?? null)
  const [dragOver, setDragOver] = useState(false)
  const [removeImagen, setRemoveImagen] = useState(false)
  const inputRef = useRef(null)

  async function handleFile(file) {
    if (!file?.type.startsWith('image/')) return
    if (file.size > 15 * 1024 * 1024) {
      alert('La imagen no puede superar 15 MB')
      return
    }
    const compressed = await comprimirImagen(file)
    setPreview(URL.createObjectURL(compressed))
    setRemoveImagen(false)
    const dt = new DataTransfer()
    dt.items.add(compressed)
    if (inputRef.current) inputRef.current.files = dt.files
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  function clear() {
    setPreview(null)
    setRemoveImagen(true)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="remove_imagen" value={removeImagen ? '1' : '0'} />

      <div
        role="button"
        tabIndex={0}
        aria-label="Subir imagen del sorteo"
        className={[
          'relative w-full cursor-pointer overflow-hidden border-2 border-dashed transition-all duration-200',
          'aspect-[16/7]',
          dragOver
            ? 'border-gold bg-gold/5 scale-[1.005]'
            : 'border-gold/25 bg-surface2 hover:border-gold/50 hover:bg-surface2/80',
        ].join(' ')}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/0 transition-colors hover:bg-black/20 flex items-center justify-center">
              <span className="opacity-0 hover:opacity-100 rounded bg-black/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm transition-opacity">
                Cambiar imagen
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-muted">
            <IconImage className="size-9 opacity-35" />
            <div className="text-center">
              <p className="text-sm font-medium text-muted/80">
                {dragOver ? 'Suelta la imagen aquí' : 'Clic o arrastra la imagen del sorteo'}
              </p>
              <p className="mt-1 text-[11px] text-muted/50">
                JPG, PNG, WEBP · Máx. 5 MB · Recomendado: 1200 × 525 px
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        name="imagen"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
      />

      {preview && (
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-danger"
        >
          <IconTrash className="size-3.5" />
          Quitar imagen
        </button>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

export default function SorteoForm({ sorteo, imagenUrl }) {
  const editing = !!sorteo
  const action  = editing ? updateSorteo.bind(null, sorteo.id) : createSorteo
  const [state, formAction, pending] = useActionState(action, { errors: {} })

  const [nombre,      setNombre]      = useState(sorteo?.nombre ?? '')
  const [tipo,        setTipo]        = useState(sorteo?.tipo ?? '')
  const [fechaSorteo, setFechaSorteo] = useState(sorteo?.fecha_sorteo ?? '')
  const [precio,      setPrecio]      = useState(sorteo?.precio_participacion?.toString() ?? '')
  const [descripcion, setDescripcion] = useState(sorteo?.descripcion ?? '')
  const [limite,      setLimite]      = useState(sorteo?.limite_participantes?.toString() ?? '')

  const progress = [nombre.trim(), tipo, fechaSorteo, precio.trim(), descripcion.trim()]
    .filter(Boolean).length

  const errors = state?.errors ?? {}

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/sorteos"
          className="flex items-center gap-1.5 text-sm text-muted transition hover:text-gold"
        >
          <IconArrowLeft className="size-4" />
          Volver
        </Link>
        <h1 className="font-display text-2xl tracking-wide text-gold">
          {editing ? 'Editar Sorteo' : 'Nuevo Sorteo'}
        </h1>
      </div>

      {/* Barra de progreso */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Completitud del formulario</span>
          <span className="font-semibold text-gold">{progress}/5</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-gold transition-all duration-500"
            style={{ width: `${(progress / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Error global */}
      {errors._ && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {errors._}
        </div>
      )}

      <form action={formAction}>
        <div className="space-y-4">

          {/* Datos principales */}
          <div className="rounded-xl border border-gold/15 bg-surface p-6">
            <h2 className="mb-5 border-l-2 border-gold pl-3 text-xs font-bold uppercase tracking-widest text-gold">
              Información del sorteo
            </h2>
            <div className="space-y-5">
              <Field label="Nombre del sorteo" required error={errors.nombre}>
                <input
                  type="text"
                  name="nombre"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  maxLength={200}
                  placeholder="Ej: Gran Sorteo de Navidad"
                  className={inputCls(errors.nombre)}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Tipo de sorteo" required error={errors.tipo}>
                  <select
                    name="tipo"
                    value={tipo}
                    onChange={e => setTipo(e.target.value)}
                    className={inputCls(errors.tipo)}
                  >
                    <option value="">Seleccionar tipo…</option>
                    {TIPOS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Precio de participación (S/)" required error={errors.precio_participacion}>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="precio_participacion"
                    value={precio}
                    onChange={e => setPrecio(e.target.value)}
                    placeholder="0.00"
                    className={inputCls(errors.precio_participacion)}
                  />
                </Field>
              </div>

              <Field
                label="Límite de participantes"
                hint="Opcional. Al llenarse, el formulario público se cierra automáticamente."
                error={errors.limite_participantes}
              >
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    name="limite_participantes"
                    value={limite}
                    onChange={e => setLimite(e.target.value.replace(/\D/g, ''))}
                    min="1"
                    placeholder="Sin límite"
                    className={inputCls(errors.limite_participantes)}
                  />
                  {limite && (
                    <button
                      type="button"
                      onClick={() => setLimite('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-danger transition-colors"
                    >
                      ✕ quitar
                    </button>
                  )}
                </div>
              </Field>

              <Field label="Fecha y hora del sorteo" required error={errors.fecha_sorteo}>
                <DateTimePicker
                  initialValue={sorteo?.fecha_sorteo ?? ''}
                  onChange={setFechaSorteo}
                  error={errors.fecha_sorteo}
                />
              </Field>

              <Field label="Descripción" error={errors.descripcion}>
                <textarea
                  name="descripcion"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  onInput={e => {
                    e.target.style.height = 'auto'
                    e.target.style.height = `${e.target.scrollHeight}px`
                  }}
                  rows={4}
                  maxLength={5000}
                  placeholder="Describe el sorteo, premios, condiciones de participación…"
                  className={`${inputCls(errors.descripcion)} resize-none`}
                />
              </Field>
            </div>
          </div>

          {/* Imagen del sorteo */}
          <div className="rounded-xl border border-gold/15 bg-surface p-6">
            <div className="mb-5">
              <h2 className="border-l-2 border-gold pl-3 text-xs font-bold uppercase tracking-widest text-gold">
                Imagen del sorteo
              </h2>
              <p className="mt-1.5 pl-3 text-[11px] text-muted/70">
                Se muestra en el hero de la página principal. Opcional pero muy recomendada.
              </p>
            </div>
            <ImageUploadField initialUrl={imagenUrl ?? null} error={errors.imagen} />
          </div>

        </div>

        {/* Acciones */}
        <div className="mt-5 flex items-center justify-end gap-3">
          <Link
            href="/dashboard/sorteos"
            className="rounded-lg border border-gold/20 px-5 py-2.5 text-sm text-muted transition hover:border-gold/40 hover:text-cream"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-bg transition hover:bg-gold-light disabled:opacity-60"
          >
            {pending && <Spinner />}
            {editing ? 'Guardar cambios' : 'Crear sorteo'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function IconArrowLeft({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function IconImage({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18A1.5 1.5 0 0022.5 18.75v-12A1.5 1.5 0 0021 5.25H3A1.5 1.5 0 001.5 6.75v12A1.5 1.5 0 003 20.25zM9.75 9.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  )
}

function IconTrash({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}
