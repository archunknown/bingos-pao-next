'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const TIPO_LABEL = {
  sorteo: 'SORTEO', pozito: 'POZITO', especial: 'ESPECIAL', aniversario: 'ANIVERSARIO',
}

export default function LandingClient({ config, sorteos, ganadores, fechas_sorteos }) {
  return (
    <>
      <HeroSection config={config} fechas_sorteos={fechas_sorteos} hay_sorteos={sorteos.length > 0} />
      {sorteos.length > 0 && (
        <>
          <Divider />
          <SorteosSection sorteos={sorteos} />
        </>
      )}
      <Divider />
      <StreamSection config={config} />
      {ganadores.length > 0 && (
        <>
          <Divider />
          <GanadoresSection ganadores={ganadores} />
        </>
      )}
      <Divider />
      <SeguridadBanner config={config} />
    </>
  )
}

function Divider() { return <div className="h-px bg-gold/10" /> }

/* ── Hero ── */
function HeroSection({ config, fechas_sorteos, hay_sorteos }) {
  const countdown = useCountdown(fechas_sorteos)

  return (
    <section className="relative overflow-hidden bg-bg px-4 py-16 text-center md:py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'url(/banner.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(6px)',
          transform: 'scale(1.05)',
        }}
      />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'rgba(10,10,10,0.75)' }} />
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(212,175,55,0.07) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(212,175,55,0.10), transparent 70%)' }}
      />

      <motion.div
        className="relative mx-auto max-w-4xl"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }}
        initial="hidden" animate="visible"
      >
        <motion.p
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }}
          className="mb-4 text-[10px] font-medium uppercase tracking-[0.3em] text-muted"
        >
          Sorteos en vivo · Facebook Live
        </motion.p>

        <motion.h1
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }}
          className="font-display leading-none"
        >
          <span className="block text-7xl text-cream md:text-9xl">GANA</span>
          <span
            className="block text-7xl md:text-9xl"
            style={{
              background: 'linear-gradient(135deg, #B8960C 0%, #D4AF37 40%, #F0D060 70%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent', color: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.25))',
            }}
          >
            PREMIOS
          </span>
        </motion.h1>

        <motion.p
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }}
          className="mx-auto mt-6 max-w-lg text-base text-cream/80"
        >
          Participa en nuestros sorteos y bingos en vivo por Facebook. Registra tu
          comprobante y espera el resultado en directo.
        </motion.p>

        {/* Countdown */}
        {countdown && !countdown.expired && (
          <motion.div
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }}
            className="mt-10"
          >
            <p className="mb-5 text-[10px] uppercase tracking-[0.25em] text-muted">Próximo sorteo en</p>
            <style>{`
              @keyframes flip-in { 0% { transform: rotateX(90deg); opacity: 0; } 100% { transform: rotateX(0deg); opacity: 1; } }
              .flip-digit { animation: flip-in 0.3s ease-out; }
            `}</style>
            <div className="inline-flex items-center gap-1.5 md:gap-3">
              {[
                { v: countdown.days, l: 'días' },
                { v: countdown.hours, l: 'horas' },
                { v: countdown.minutes, l: 'min' },
                { v: countdown.seconds, l: 'seg' },
              ].map(({ v, l }, i) => (
                <div key={l} className="flex items-center gap-1.5 md:gap-3">
                  <div className="flex flex-col items-center border border-gold/30 bg-surface2 px-3 py-2.5 md:px-5 md:py-4" style={{ perspective: '400px' }}>
                    <span key={v} className="flip-digit font-display text-5xl leading-none text-gold md:text-6xl" style={{ display: 'inline-block', transformOrigin: 'center' }}>
                      {String(v).padStart(2, '0')}
                    </span>
                    <span className="mt-1.5 text-[9px] uppercase tracking-widest text-muted">{l}</span>
                  </div>
                  {i < 3 && <span className="font-display text-3xl text-gold/50 md:text-4xl">:</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {countdown?.expired && (
          <motion.p
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }}
            className="mt-8 font-display text-3xl tracking-widest text-gold"
          >
            ¡EL SORTEO ESTÁ EN CURSO!
          </motion.p>
        )}

        <motion.div
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          {hay_sorteos ? (
            <button
              type="button"
              onClick={() => document.getElementById('sorteos')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-danger px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-danger-dark"
            >
              Participar ahora
            </button>
          ) : (
            <span className="border border-gold/30 px-8 py-4 text-sm font-bold uppercase tracking-widest text-muted">
              Próximamente
            </span>
          )}
          {config.url_stream_live && (
            <a
              href={config.url_stream_live}
              target="_blank" rel="noreferrer"
              className="border border-gold/50 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/10"
            >
              Ver en vivo
            </a>
          )}
        </motion.div>

        {config.mensaje_destacado && (
          <motion.p
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }}
            className="mx-auto mt-8 max-w-lg text-sm text-muted"
          >
            ✦ {config.mensaje_destacado}
          </motion.p>
        )}
      </motion.div>
    </section>
  )
}

/* ── Aurora orb ── */
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

/* ── Stream ── */
function StreamSection({ config }) {
  const { estado_stream, url_stream_live, url_stream_grabado, nombre_negocio } = config
  if (!estado_stream || estado_stream === 'proximamente') return null
  const isLive = estado_stream === 'en_vivo'
  const url = isLive ? url_stream_live : url_stream_grabado
  if (!isLive && !url) return null

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <AuroraOrb
        color={isLive ? 'rgba(220,38,38,0.13)' : 'rgba(212,175,55,0.10)'}
        width="55%" height="90%" top="-20%" right="-10%"
        keyframes={{ x: [0, 25, -10, 0], y: [0, -35, 18, 0], scale: [1, 1.07, 0.95, 1] }} duration={16}
      />
      <AuroraOrb
        color="rgba(212,175,55,0.07)" width="45%" height="80%" bottom="-25%" left="-8%"
        keyframes={{ x: [0, -18, 22, 0], y: [0, 28, -12, 0], scale: [1, 0.94, 1.05, 1] }} duration={13} delay={-6}
      />
      <div className="relative mx-auto max-w-3xl">
        <div className="mb-5 flex items-center gap-3">
          {isLive && (
            <span className="animate-pulse bg-danger px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              ● EN VIVO
            </span>
          )}
          <h2 className="font-display text-2xl tracking-widest text-cream">
            {isLive ? 'TRANSMISIÓN EN VIVO' : 'ÚLTIMA TRANSMISIÓN'}
          </h2>
        </div>

        <motion.a
          href={url || '#'}
          target={url ? '_blank' : undefined}
          rel="noreferrer"
          className={['group relative block w-full overflow-hidden', isLive ? 'border-2 border-danger/60 animate-pulse' : 'border border-gold/20'].join(' ')}
          style={{ aspectRatio: '16/9' }}
          whileHover={url ? { scale: 1.01 } : {}}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="absolute inset-0" style={{ background: isLive ? 'linear-gradient(135deg, #1a0a0a 0%, #0d0d0d 40%, #1a1205 100%)' : 'linear-gradient(135deg, #0d0d0d 0%, #111111 50%, #0d0f1a 100%)' }} />
          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)', zIndex: 1 }} />
          <div className="absolute right-6 top-6 z-10 opacity-20"><SignalWaves active={isLive} /></div>
          <div className="absolute rounded-full blur-3xl" style={{ width: '45%', height: '70%', top: '15%', left: '28%', background: isLive ? 'radial-gradient(ellipse, rgba(220,38,38,0.12) 0%, transparent 70%)' : 'radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%)' }} />
          <div className="absolute left-5 top-5 z-10 flex items-center gap-2">
            <IconFacebook className="size-5 text-[#1877F2]" />
            <span className="text-xs font-semibold tracking-wide text-white/60">Facebook</span>
          </div>
          <div className="absolute right-5 top-5 z-10">
            {isLive ? (
              <span className="flex items-center gap-1.5 bg-danger px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                <span className="inline-block size-1.5 animate-ping rounded-full bg-white" /> En vivo
              </span>
            ) : (
              <span className="border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Grabación</span>
            )}
          </div>
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5">
            <div className="relative">
              {isLive && <div className="absolute inset-0 animate-ping rounded-full bg-danger/20" />}
              <div className={['flex size-16 items-center justify-center rounded-full transition-transform duration-200 md:size-20 group-hover:scale-110', isLive ? 'bg-danger shadow-[0_0_32px_rgba(220,38,38,0.5)]' : 'bg-white/10 shadow-[0_0_32px_rgba(255,255,255,0.08)] group-hover:bg-white/20'].join(' ')}>
                <svg className="ml-1 size-7 text-white md:size-9" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
            <div className="text-center">
              <p className="font-display text-xl tracking-widest text-white md:text-2xl">{isLive ? 'VER EN VIVO' : 'VER TRANSMISIÓN'}</p>
              {nombre_negocio && <p className="mt-1 text-xs tracking-widest text-white/40">{nombre_negocio}</p>}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t border-white/10 bg-black/30 px-5 py-2.5 backdrop-blur-sm">
            <span className="text-[10px] uppercase tracking-widest text-white/40">{isLive ? 'Toca para unirte al sorteo en vivo' : 'Revive el último sorteo'}</span>
            <span className="text-[10px] text-white/30">facebook.com</span>
          </div>
        </motion.a>
      </div>
    </section>
  )
}

function SignalWaves({ active }) {
  const color = active ? '#ef4444' : '#D4AF37'
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M18 28 a2 2 0 1 1 0.001 0Z" fill={color} />
      <path d="M12 22 a8 8 0 0 1 12 0" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7 17 a14 14 0 0 1 22 0" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M2 12 a20 20 0 0 1 32 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  )
}

function IconFacebook({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  )
}

/* ── Sorteos activos ── */
function SorteosSection({ sorteos }) {
  const router = useRouter()
  return (
    <section id="sorteos" className="relative overflow-hidden px-4 py-16 md:py-24">
      <AuroraOrb color="rgba(212,175,55,0.11)" width="50%" height="100%" top="-30%" left="-8%"
        keyframes={{ x: [0, 18, -12, 0], y: [0, -20, 30, 0], scale: [1, 1.06, 0.96, 1] }} duration={18} />
      <AuroraOrb color="rgba(184,150,12,0.08)" width="40%" height="80%" bottom="-20%" right="-5%"
        keyframes={{ x: [0, -22, 14, 0], y: [0, 32, -18, 0], scale: [1, 0.93, 1.04, 1] }} duration={14} delay={-7} />
      <div className="relative mx-auto max-w-5xl">
        <h2 className="mb-10 border-l-4 border-gold pl-5 font-display text-5xl text-cream">SORTEOS ACTIVOS</h2>
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          {sorteos.map(s => (
            <motion.div
              key={s.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }}
              whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <SorteoCard sorteo={s} onParticipate={() => router.push(`/sorteos/${s.id}`)} />
            </motion.div>
          ))}
        </motion.div>
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
            {sorteo.fecha_sorteo_fmt}
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
                {p.monto != null
                  ? <span className="ml-auto shrink-0 font-bold text-gold">S/ {Number(p.monto).toFixed(2)}</span>
                  : p.descripcion_premio
                    ? <span className="ml-auto shrink-0 text-muted">{p.descripcion_premio}</span>
                    : null
                }
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

/* ── Ganadores recientes ── */
function GanadoresSection({ ganadores }) {
  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <AuroraOrb color="rgba(212,175,55,0.09)" width="60%" height="90%" top="-20%" right="-15%"
        keyframes={{ x: [0, 20, -12, 0], y: [0, -25, 14, 0], scale: [1, 1.05, 0.96, 1] }} duration={17} />
      <AuroraOrb color="rgba(39,174,96,0.07)" width="45%" height="75%" bottom="-20%" left="-10%"
        keyframes={{ x: [0, -14, 18, 0], y: [0, 22, -10, 0], scale: [1, 0.94, 1.06, 1] }} duration={12} delay={-5} />
      <AnimatedConfetti />
      <div className="relative mx-auto max-w-5xl">
        <h2 className="mb-8 border-l-4 border-gold pl-5 font-display text-5xl text-cream">GANADORES RECIENTES</h2>
        <motion.div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          {ganadores.map(g => (
            <motion.div
              key={g.id}
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } }}
              className="flex flex-col items-center gap-2 border border-gold/30 bg-surface p-3 text-center"
            >
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${g.avatarCls}`}>
                {g.inicial}
              </div>
              <div className="w-full min-w-0">
                <p className="truncate text-sm font-semibold text-cream">{g.nombre}</p>
                <p className="truncate text-xs font-bold text-gold">{g.premio}</p>
                <p className="truncate text-[10px] text-muted">{g.sorteo}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function AnimatedConfetti() {
  const particles = [
    { x: '5%', color: '#D4AF37', r: 3, dur: 7, delay: 0 },
    { x: '12%', color: '#C0392B', r: 2, dur: 9, delay: -3 },
    { x: '88%', color: '#D4AF37', r: 4, dur: 8, delay: -1 },
    { x: '92%', color: '#27AE60', r: 2.5, dur: 11, delay: -5 },
    { x: '78%', color: '#D4AF37', r: 3, dur: 6, delay: -2 },
    { x: '20%', color: '#C0392B', r: 2, dur: 10, delay: -7 },
    { x: '65%', color: '#27AE60', r: 3.5, dur: 8, delay: -4 },
    { x: '45%', color: '#D4AF37', r: 2, dur: 12, delay: -6 },
    { x: '33%', color: '#B8960C', r: 3, dur: 9, delay: -1.5 },
    { x: '72%', color: '#C0392B', r: 2.5, dur: 7, delay: -8 },
  ]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map(({ x, color, r, dur, delay }, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ left: x, bottom: 0, width: r * 2, height: r * 2, backgroundColor: color }}
          animate={{ y: [0, -700], opacity: [0, 0.55, 0.4, 0] }}
          transition={{ duration: dur, repeat: Infinity, ease: 'linear', delay }} />
      ))}
    </div>
  )
}

/* ── Seguridad ── */
function SeguridadBanner({ config }) {
  const { titular_pago: titular } = config
  if (!titular) return null
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl border-l-4 border-danger bg-danger/10 p-6">
        <div className="flex items-start gap-4">
          <span className="shrink-0 text-xl text-danger">⚠</span>
          <div>
            <p className="font-display text-2xl tracking-widest text-danger">AVISO DE SEGURIDAD</p>
            <p className="mt-3 text-sm text-muted">
              Solo realizamos cobros por Yape y Plin. Nunca por transferencia bancaria directa ni por otras plataformas.
            </p>
            <p className="mt-2 text-xs text-muted">
              Titular verificado: <span className="font-semibold text-cream">{titular}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Countdown hook ── */
function calcNextDiff(fechas) {
  if (!fechas?.length) return null
  const now = Date.now()
  const proxima = fechas.map(f => new Date(f).getTime()).find(t => t > now)
  if (!proxima) return { expired: true }
  const remaining = proxima - now
  return {
    expired: false,
    days:    Math.floor(remaining / 86_400_000),
    hours:   Math.floor((remaining % 86_400_000) / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    seconds: Math.floor((remaining % 60_000) / 1000),
  }
}

function useCountdown(fechas) {
  const [diff, setDiff] = useState(null)
  const ref = useRef(fechas)
  ref.current = fechas
  useEffect(() => {
    setDiff(calcNextDiff(ref.current))
    const id = setInterval(() => setDiff(calcNextDiff(ref.current)), 1000)
    return () => clearInterval(id)
  }, [])
  return diff
}
