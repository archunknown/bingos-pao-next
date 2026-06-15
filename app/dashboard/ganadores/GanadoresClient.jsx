'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { registrarGanador, toggleGanadorPublicado } from '@/app/actions/ganadores'

const WIZARD_STEPS = [
  { key: 'sorteo_id',       label: 'Sorteo',       num: 1 },
  { key: 'participante_id', label: 'Participante', num: 2 },
  { key: 'premio_id',       label: 'Premio',       num: 3 },
]

export default function GanadoresClient({ sorteos, ganadores }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleToggle(g) {
    startTransition(async () => {
      await toggleGanadorPublicado(g.id, g.publicado)
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl tracking-wide text-cream">GANADORES</h1>

      {/* Wizard registrar */}
      <RegistrarGanadorWizard sorteos={sorteos} />

      {/* Tabla ganadores */}
      <section>
        <h2 className="mb-4 border-l-4 border-gold pl-3 font-display text-2xl text-gold">
          GANADORES REGISTRADOS
        </h2>
        <div className="overflow-hidden border border-gold/20 bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface2 text-left">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-muted">Participante</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-muted">Premio</th>
                  <th className="hidden px-4 py-3 text-xs font-medium uppercase tracking-widest text-muted md:table-cell">Sorteo</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-muted">Publicado</th>
                  <th className="hidden px-4 py-3 text-xs font-medium uppercase tracking-widest text-muted lg:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {ganadores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted">
                        <svg className="size-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m-5-8H5a2 2 0 01-2-2V7h18v4a2 2 0 01-2 2h-2m-8 0h8m-8 0a5 5 0 0010 0" />
                        </svg>
                        <p className="text-sm font-medium">No hay ganadores registrados aún</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ganadores.map((g) => (
                    <tr key={g.id} className="border-b border-gold/10 transition-colors duration-150 hover:bg-surface2">
                      <td className="px-4 py-3 font-medium text-cream">
                        <span className="flex items-center gap-2">
                          {g.publicado && <span className="text-gold" title="Publicado">★</span>}
                          {g.participante?.nombres} {g.participante?.apellidos}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-content">{g.premio?.nombre}</td>
                      <td className="hidden px-4 py-3 text-content md:table-cell">{g.sorteo?.nombre}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleToggle(g)}
                          className={[
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition duration-150 disabled:opacity-50',
                            g.publicado
                              ? 'border-success/30 bg-success/10 text-success hover:bg-success/20'
                              : 'border-muted/20 bg-surface2 text-muted hover:text-cream',
                          ].join(' ')}
                        >
                          <span className={`size-1.5 rounded-full ${g.publicado ? 'bg-success' : 'bg-muted/40'}`} />
                          {g.publicado ? 'Publicado' : 'Oculto'}
                        </button>
                      </td>
                      <td suppressHydrationWarning className="hidden px-4 py-3 text-xs text-muted lg:table-cell">
                        {new Date(g.created_at).toLocaleString('es-PE', {
                          dateStyle: 'short', timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

function RegistrarGanadorWizard({ sorteos }) {
  const [sorteoId, setSorteoId]           = useState('')
  const [participanteId, setParticipante] = useState('')
  const [premioId, setPremio]             = useState('')
  const [participantes, setParticipantes] = useState([])
  const [premios, setPremios]             = useState([])
  const [isPending, startTransition]      = useTransition()
  const [errors, setErrors]               = useState({})
  const [loadingOpts, setLoadingOpts]     = useState(false)

  const activeStep = !sorteoId ? 1 : !participanteId ? 2 : 3

  async function onSorteoChange(id) {
    setSorteoId(id)
    setParticipante('')
    setPremio('')
    setParticipantes([])
    setPremios([])
    setErrors({})
    if (!id) return
    setLoadingOpts(true)
    try {
      const res = await fetch(`/api/ganadores/opciones?sorteo_id=${id}`)
      const json = await res.json()
      setParticipantes(json.participantes ?? [])
      setPremios(json.premios ?? [])
    } catch {
      // ignore fetch errors
    } finally {
      setLoadingOpts(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    startTransition(async () => {
      const result = await registrarGanador(sorteoId, participanteId, premioId)
      if (result?.errors) { setErrors(result.errors); return }
      // redirect happens inside action on success
    })
  }

  const canSubmit = sorteoId && participanteId && premioId && !isPending

  return (
    <section className="border border-gold/20 bg-surface p-5">
      <h2 className="mb-6 border-l-4 border-gold pl-3 font-display text-2xl text-gold">
        REGISTRAR GANADOR
      </h2>

      {/* Steps */}
      <div className="mb-6 flex items-center gap-0">
        {WIZARD_STEPS.map((step, i) => {
          const vals = { sorteo_id: sorteoId, participante_id: participanteId, premio_id: premioId }
          const done    = vals[step.key] !== ''
          const current = activeStep === step.num
          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={[
                  'flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors duration-200',
                  done    ? 'border-gold bg-gold text-bg'           :
                  current ? 'border-gold/70 bg-gold/10 text-gold'   :
                            'border-muted/30 bg-surface2 text-muted/50',
                ].join(' ')}>
                  {done ? '✓' : step.num}
                </div>
                <span className={`text-[10px] uppercase tracking-wider ${done || current ? 'text-gold' : 'text-muted/50'}`}>
                  {step.label}
                </span>
              </div>
              {i < WIZARD_STEPS.length - 1 && (
                <div className={[
                  'mb-4 flex-1 border-t-2 transition-colors duration-200',
                  sorteoId ? 'border-gold/40' : 'border-muted/20',
                ].join(' ')} />
              )}
            </div>
          )
        })}
      </div>

      {errors._ && (
        <p className="mb-4 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {errors._}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
        {/* Sorteo */}
        <WField label="Sorteo">
          <select
            value={sorteoId}
            onChange={(e) => onSorteoChange(e.target.value)}
            className={sCls()}
          >
            <option value="">Seleccionar sorteo</option>
            {sorteos.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </WField>

        {/* Participante */}
        <WField label="Participante confirmado">
          {loadingOpts ? (
            <div className={`${sCls()} flex items-center justify-center text-muted/50`}>
              Cargando…
            </div>
          ) : (
            <ParticipanteCombobox
              participantes={participantes}
              value={participanteId}
              onChange={setParticipante}
              disabled={!sorteoId}
            />
          )}
        </WField>

        {/* Premio */}
        <WField label="Premio">
          <select
            value={premioId}
            onChange={(e) => setPremio(e.target.value)}
            disabled={premios.length === 0}
            className={sCls()}
          >
            <option value="">
              {sorteoId
                ? premios.length === 0 ? 'Sin premios' : 'Seleccionar premio'
                : 'Primero elige un sorteo'}
            </option>
            {premios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
                {p.monto != null
                  ? ` (S/ ${Number(p.monto).toFixed(2)})`
                  : p.descripcion_premio ? ` (${p.descripcion_premio})` : ''}
              </option>
            ))}
          </select>
        </WField>

        <div className="flex items-end sm:col-span-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className="bg-gold px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-bg transition hover:bg-gold-light disabled:opacity-40"
          >
            {isPending ? 'Registrando…' : 'Registrar ganador'}
          </button>
        </div>
      </form>
    </section>
  )
}

// ─── Participante Combobox ────────────────────────────────────────────────────

function ParticipanteCombobox({ participantes, value, onChange, disabled }) {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen]             = useState(false)
  const containerRef                = useRef(null)

  useEffect(() => { if (!value) setInputValue('') }, [value])

  useEffect(() => {
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const filtered = inputValue.trim() === ''
    ? participantes.slice(0, 60)
    : participantes.filter((p) => {
        const q = inputValue.toLowerCase()
        return (
          `${p.nombres} ${p.apellidos}`.toLowerCase().includes(q) ||
          String(p.numero_registro ?? '').toLowerCase().includes(q)
        )
      }).slice(0, 60)

  function handleChange(e) {
    setInputValue(e.target.value)
    if (value) onChange('')
    setOpen(true)
  }

  function handleFocus() {
    if (value) { setInputValue(''); onChange('') }
    setOpen(true)
  }

  function select(p) {
    onChange(String(p.id))
    setInputValue(`${p.numero_registro} — ${p.nombres} ${p.apellidos}`)
    setOpen(false)
  }

  const placeholder = disabled
    ? 'Primero elige un sorteo'
    : participantes.length === 0
    ? 'Sin participantes confirmados'
    : 'Buscar por nombre o N° registro…'

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={sCls()}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-0.5 max-h-56 w-full overflow-y-auto border border-gold/30 bg-surface shadow-xl">
          {filtered.map((p) => (
            <li
              key={p.id}
              onMouseDown={(e) => { e.preventDefault(); select(p) }}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-gold/10"
            >
              <span className="shrink-0 font-bold text-gold">{p.numero_registro}</span>
              <span className="text-cream">{p.nombres} {p.apellidos}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sCls() {
  return 'w-full border border-gold/20 bg-surface2 px-3 py-2.5 text-sm text-cream outline-none transition-colors focus:border-gold disabled:opacity-40 appearance-none'
}

function WField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-medium uppercase tracking-widest text-muted">{label}</label>
      {children}
    </div>
  )
}
