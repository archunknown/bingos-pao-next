'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { createSorteo, updateSorteo } from '@/app/actions/sorteos'

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

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
        {required && <span className="ml-1 text-gold/70">*</span>}
      </label>
      {children}
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

export default function SorteoForm({ sorteo }) {
  const editing = !!sorteo
  const action  = editing ? updateSorteo.bind(null, sorteo.id) : createSorteo
  const [state, formAction, pending] = useActionState(action, { errors: {} })

  const [nombre,      setNombre]      = useState(sorteo?.nombre ?? '')
  const [tipo,        setTipo]        = useState(sorteo?.tipo ?? '')
  const [fechaSorteo, setFechaSorteo] = useState(sorteo?.fecha_sorteo ?? '')
  const [precio,      setPrecio]      = useState(sorteo?.precio_participacion?.toString() ?? '')
  const [descripcion, setDescripcion] = useState(sorteo?.descripcion ?? '')

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
        <div className="rounded-xl border border-gold/15 bg-surface p-6">
          <div className="space-y-5">
            {/* Nombre */}
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
              {/* Tipo */}
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

              {/* Precio */}
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

            {/* Fecha y hora */}
            <Field label="Fecha y hora del sorteo" required error={errors.fecha_sorteo}>
              <DateTimePicker
                initialValue={sorteo?.fecha_sorteo ?? ''}
                onChange={setFechaSorteo}
                error={errors.fecha_sorteo}
              />
            </Field>

            {/* Descripción */}
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
