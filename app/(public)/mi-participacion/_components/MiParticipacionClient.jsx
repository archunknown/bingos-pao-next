'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

const LS_KEY = 'bingos_busquedas'
const MAX_HIST = 4

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}

function saveHistory(numero) {
  if (!numero?.trim()) return
  const prev = loadHistory().filter(h => h !== numero.trim())
  const next = [numero.trim(), ...prev].slice(0, MAX_HIST)
  try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
}

function estadoDisplay(p) {
  if (p.sorteo_estado === 'cerrado' && p.estado === 'confirmado') {
    return { label: 'FINALIZADO', cls: 'bg-surface2 text-muted border-muted/20', icon: <IconCheck cls="text-muted" /> }
  }
  switch (p.estado) {
    case 'confirmado': return { label: 'CONFIRMADO', cls: 'bg-success/10 text-success border-success/30', icon: <IconCheck cls="text-success" /> }
    case 'pendiente':  return { label: 'PENDIENTE',  cls: 'bg-gold/10 text-gold border-gold/30',         icon: <IconClock cls="text-gold" /> }
    case 'rechazado':  return { label: 'RECHAZADO',  cls: 'bg-danger/10 text-danger border-danger/30',   icon: <IconX cls="text-danger" /> }
    default:           return { label: 'FINALIZADO', cls: 'bg-surface2 text-muted border-muted/20',      icon: <IconCheck cls="text-muted" /> }
  }
}

export default function MiParticipacionClient({ resultados, busqueda }) {
  const router = useRouter()
  const [valor, setValor]       = useState(busqueda ?? '')
  const [loading, setLoading]   = useState(false)
  const [historial, setHistorial] = useState([])

  useEffect(() => { setHistorial(loadHistory()) }, [])

  function submit(e) {
    e.preventDefault()
    if (!valor.trim()) return
    saveHistory(valor.trim())
    setHistorial(loadHistory())
    setLoading(true)
    router.push(`/mi-participacion?whatsapp=${encodeURIComponent(valor.trim())}`)
  }

  function buscarHistorial(num) {
    setValor(num)
    saveHistory(num)
    setHistorial(loadHistory())
    setLoading(true)
    router.push(`/mi-participacion?whatsapp=${encodeURIComponent(num)}`)
  }

  // Reset loading when results arrive (URL changed)
  useEffect(() => { setLoading(false) }, [busqueda])

  const buscado = busqueda !== '' && busqueda != null

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <h1 className="border-l-4 border-gold pl-4 font-display text-5xl text-cream">MI PARTICIPACIÓN</h1>
        <p className="mt-3 pl-5 text-sm text-muted">
          Ingresa tu número de WhatsApp para consultar el estado de tus registros.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
      >
        <form onSubmit={submit} noValidate>
          <div className="flex">
            <input
              type="tel" value={valor} onChange={e => setValor(e.target.value)}
              placeholder="999 999 999" maxLength={30}
              className="flex-1 border border-gold/20 bg-surface2 px-4 py-3 text-sm text-cream placeholder-muted outline-none transition-colors focus:border-gold"
            />
            <button type="submit" disabled={loading}
              className="bg-gold px-6 py-3 text-sm font-bold uppercase tracking-widest text-bg transition-colors hover:bg-gold-light disabled:opacity-50">
              {loading ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
        </form>

        {historial.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-widest text-muted/50">Recientes:</span>
            {historial.map(num => (
              <button key={num} type="button" onClick={() => buscarHistorial(num)}
                className="rounded-full border border-gold/20 bg-surface2 px-3 py-0.5 text-xs text-muted transition-colors hover:border-gold/40 hover:text-cream">
                {num}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Resultados */}
      {buscado && (
        <div className="mt-8">
          {resultados.length === 0 ? (
            <>
              <EmptyResult whatsapp={busqueda} />
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
                className="mt-6 border border-gold/20 bg-surface p-5 text-center"
              >
                <p className="font-display text-2xl text-gold">¿AÚN NO PARTICIPAS?</p>
                <p className="mt-2 text-sm text-muted">Únete a nuestros sorteos en vivo y gana increíbles premios.</p>
                <button type="button" onClick={() => router.push('/sorteos')}
                  className="mt-4 bg-danger px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-danger-dark">
                  Ver sorteos activos
                </button>
              </motion.div>
            </>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted">
                {resultados.length} registro{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''} para{' '}
                <span className="text-content">{busqueda}</span>
              </p>
              <motion.div className="space-y-3"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
                initial="hidden" animate="visible"
              >
                {resultados.map(p => (
                  <motion.div key={p.id}
                    variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }}>
                    <ResultadoCard participante={p} />
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ResultadoCard({ participante }) {
  const { label, cls, icon } = estadoDisplay(participante)
  return (
    <div className="flex items-start gap-4 border border-gold/20 bg-surface px-5 py-4 transition-colors hover:border-gold/40">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-3xl leading-none text-gold">
              {participante.numero_registro ?? '—'}
            </p>
            <p className="mt-1 text-xs text-muted">{participante.nombres} {participante.apellidos}</p>
            <p className="mt-2 truncate text-sm font-semibold text-cream">{participante.sorteo_nombre ?? '—'}</p>
            {participante.sorteo_fecha && (
              <p className="mt-0.5 text-xs text-muted">{participante.sorteo_fecha}</p>
            )}
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${cls}`}>
            {label}
          </span>
        </div>
        {participante.estado === 'rechazado' && participante.nota_interna && (
          <div className="mt-3 border-t border-danger/20 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-danger">Motivo del rechazo</p>
            <p className="mt-1 text-sm text-muted">{participante.nota_interna}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyResult({ whatsapp }) {
  const router = useRouter()
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}
      className="border border-gold/10 bg-surface px-6 py-14 text-center">
      <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="mx-auto mb-4 flex size-16 items-center justify-center border border-gold/20 bg-gold/5 text-gold/30">
        <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </motion.div>
      <p className="text-sm font-semibold text-muted">Sin resultados</p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
        No encontramos registros para <span className="text-content">{whatsapp}</span>.
        Verifica que sea el mismo número con el que te registraste.
      </p>
      <button type="button" onClick={() => router.push('/')}
        className="mt-6 border border-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/10">
        Ver sorteos activos
      </button>
    </motion.div>
  )
}

function IconCheck({ cls }) {
  return (
    <svg className={`size-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function IconClock({ cls }) {
  return (
    <svg className={`size-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function IconX({ cls }) {
  return (
    <svg className={`size-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
