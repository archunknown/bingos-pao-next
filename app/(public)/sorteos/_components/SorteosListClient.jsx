'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const TIPO_LABEL = {
  sorteo: 'SORTEO', pozito: 'POZITO', especial: 'ESPECIAL', aniversario: 'ANIVERSARIO',
}

function AuroraOrb({ color, width, height, top, left, right, bottom, keyframes, duration = 14, delay = 0 }) {
  return (
    <motion.div
      className="pointer-events-none absolute rounded-full"
      animate={keyframes}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{ width, height, top, left, right, bottom, background: `radial-gradient(ellipse, ${color} 0%, transparent 70%)`, filter: 'blur(60px)' }}
    />
  )
}

export default function SorteosListClient({ sorteos, config }) {
  const router = useRouter()

  return (
    <section id="sorteos" className="relative overflow-hidden px-4 py-16 md:py-24">
      <AuroraOrb color="rgba(212,175,55,0.11)" width="50%" height="100%" top="-30%" left="-8%"
        keyframes={{ x: [0, 18, -12, 0], y: [0, -20, 30, 0], scale: [1, 1.06, 0.96, 1] }} duration={18} />
      <AuroraOrb color="rgba(184,150,12,0.08)" width="40%" height="80%" bottom="-20%" right="-5%"
        keyframes={{ x: [0, -22, 14, 0], y: [0, 32, -18, 0], scale: [1, 0.93, 1.04, 1] }} duration={14} delay={-7} />

      <div className="relative mx-auto max-w-5xl">
        <h2 className="mb-10 border-l-4 border-gold pl-5 font-display text-5xl text-cream">SORTEOS ACTIVOS</h2>

        {sorteos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="border border-gold/10 bg-surface px-6 py-20 text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto mb-6 flex size-20 items-center justify-center border border-gold/20 bg-gold/5"
            >
              <svg className="size-10 text-gold/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <p className="font-display text-3xl text-muted">No hay sorteos activos</p>
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
              Próximamente nuevos sorteos en vivo. Síguenos en Facebook para no perderte nada.
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            initial="hidden" whileInView="visible" viewport={{ once: true }}
          >
            {sorteos.map(s => (
              <motion.div
                key={s.id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }}
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <SorteoCard sorteo={s} onParticipate={() => router.push(`/sorteos/${s.id}`)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}

function SorteoCard({ sorteo, onParticipate }) {
  const diasRestantes = Math.max(0, Math.ceil((new Date(sorteo.fecha_sorteo) - Date.now()) / 86_400_000))
  const barPct = Math.min(100, Math.round((diasRestantes / 30) * 100))
  const barColor = diasRestantes <= 3 ? 'bg-danger' : diasRestantes <= 7 ? 'bg-gold' : 'bg-success'

  return (
    <div className="flex h-full flex-col border border-gold/20 bg-surface transition-colors hover:border-gold/60">
      <div className="flex items-center justify-between gap-2 border-b border-gold/10 bg-surface2 px-4 py-3">
        <span className="font-display text-xl tracking-widest text-gold">
          {TIPO_LABEL[sorteo.tipo] ?? sorteo.tipo.toUpperCase()}
        </span>
        <span className="bg-gold px-2 py-0.5 text-[10px] font-bold uppercase text-bg">
          S/ {Number(sorteo.precio_participacion).toFixed(2)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 text-sm font-semibold text-cream">{sorteo.nombre}</h3>
        <div className="mb-4">
          <p className="text-xs text-muted">
            {new Date(sorteo.fecha_sorteo).toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface2">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${barPct}%` }} />
            </div>
            <span className={`text-[10px] font-bold ${diasRestantes <= 3 ? 'text-danger' : 'text-muted'}`}>
              {diasRestantes === 0 ? '¡Hoy!' : `${diasRestantes}d`}
            </span>
          </div>
        </div>

        {sorteo.premios?.length > 0 && (
          <ul className="mb-5 flex-1 space-y-2">
            {sorteo.premios.slice(0, 4).map(p => (
              <li key={p.id} className="flex items-baseline gap-2 text-xs">
                <span className="shrink-0 text-gold">●</span>
                <span className="text-content">{p.nombre}</span>
                {p.monto != null && <span className="ml-auto font-bold text-gold">S/ {Number(p.monto).toFixed(2)}</span>}
              </li>
            ))}
            {sorteo.premios.length > 4 && (
              <li className="text-[11px] text-muted">+{sorteo.premios.length - 4} premios más</li>
            )}
          </ul>
        )}

        <RippleButton onClick={onParticipate} className="mt-auto w-full bg-danger py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-danger-dark">
          Participar
        </RippleButton>
      </div>
    </div>
  )
}

function RippleButton({ onClick, className, children }) {
  const [ripples, setRipples] = useState([])
  function handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const id = Date.now()
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600)
    onClick?.()
  }
  return (
    <button type="button" onClick={handleClick} className={`relative overflow-hidden ${className}`}>
      {children}
      {ripples.map(({ id, x, y }) => (
        <span key={id} className="pointer-events-none absolute rounded-full bg-white/30"
          style={{ left: x - 40, top: y - 40, width: 80, height: 80, animation: 'ripple-expand 0.6s ease-out forwards' }} />
      ))}
      <style>{`@keyframes ripple-expand { 0% { transform: scale(0); opacity: 0.5; } 100% { transform: scale(4); opacity: 0; } }`}</style>
    </button>
  )
}
