'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const TIPO_LABEL = {
  sorteo: 'SORTEO', pozito: 'POZITO', especial: 'ESPECIAL', aniversario: 'ANIVERSARIO',
}

const TIPO_GRADIENT = {
  sorteo:      ['#0A1A08', '#152A12'],
  pozito:      ['#080A1A', '#10122A'],
  especial:    ['#1A0808', '#2A1010'],
  aniversario: ['#1A1408', '#2A2010'],
}

export default function LandingClient({ config, sorteos, ganadores, fechas_sorteos }) {
  const [lightboxUrl, setLightboxUrl] = useState(null)

  return (
    <>
      <HeroSection
        config={config}
        fechas_sorteos={fechas_sorteos}
        sorteos={sorteos}
        onZoomImage={setLightboxUrl}
      />
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

      {lightboxUrl && (
        <LightboxModal imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </>
  )
}

function Divider() { return <div className="h-px bg-gold/10" /> }

/* ─── Fade animation helper ──────────────────────────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}
function FadeUp({ children, className, delay }) {
  return (
    <motion.div
      variants={delay != null
        ? { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', delay } } }
        : fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function HeroSection({ config, fechas_sorteos, sorteos, onZoomImage }) {
  const countdown  = useCountdown(fechas_sorteos)
  const hasSorteos = sorteos.length > 0
  const router     = useRouter()

  return (
    <section className="relative overflow-hidden bg-bg">
      {/* Banner background with blur */}
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
      {/* Dark overlay */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'rgba(10,10,10,0.78)' }} />
      {/* Dot pattern */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(212,175,55,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Gold vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(212,175,55,0.09), transparent 70%)' }}
      />

      {hasSorteos ? (
        /* ── Two-column layout ── */
        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16 lg:py-20">
          <div className="flex flex-col gap-10 md:grid md:grid-cols-[1fr_380px] md:items-center md:gap-10 lg:grid-cols-[1fr_420px] lg:gap-16">

            {/* Left: Hero info */}
            <motion.div
              className="flex flex-col"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
              initial="hidden" animate="visible"
            >
              <FadeUp>
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] text-muted">
                  Sorteos en vivo · Facebook Live
                </p>
              </FadeUp>

              <FadeUp>
                <h1 className="font-display leading-none">
                  <span className="block text-[clamp(3.5rem,8vw,6rem)] text-cream">GANA</span>
                  <span
                    className="block text-[clamp(3.5rem,8vw,6rem)]"
                    style={{
                      background: 'linear-gradient(135deg, #B8960C 0%, #D4AF37 40%, #F0D060 70%, #D4AF37 100%)',
                      WebkitBackgroundClip: 'text', backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent', color: 'transparent',
                      filter: 'drop-shadow(0 0 18px rgba(212,175,55,0.22))',
                    }}
                  >
                    PREMIOS
                  </span>
                </h1>
              </FadeUp>

              <FadeUp>
                <p className="mt-5 max-w-md text-base leading-relaxed text-cream/75">
                  Participa en nuestros sorteos y bingos en vivo por Facebook.
                  Registra tu comprobante y espera el resultado en directo.
                </p>
              </FadeUp>

              {countdown && !countdown.expired && (
                <FadeUp className="mt-8">
                  <CountdownDisplay countdown={countdown} />
                </FadeUp>
              )}

              {countdown?.expired && (
                <FadeUp>
                  <p className="mt-6 font-display text-2xl tracking-widest text-gold">
                    ¡EL SORTEO ESTÁ EN CURSO!
                  </p>
                </FadeUp>
              )}

              {config.url_stream_live && (
                <FadeUp className="mt-8">
                  <a
                    href={config.url_stream_live}
                    target="_blank" rel="noreferrer"
                    className="border border-gold/50 px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/10"
                  >
                    Ver en vivo
                  </a>
                </FadeUp>
              )}

              {config.mensaje_destacado && (
                <FadeUp>
                  <p className="mt-6 text-sm text-muted">✦ {config.mensaje_destacado}</p>
                </FadeUp>
              )}
            </motion.div>

            {/* Right: Sorteos panel */}
            <SorteosHeroPanel sorteos={sorteos} router={router} onZoomImage={onZoomImage} />
          </div>
        </div>
      ) : (
        /* ── Centered layout (no sorteos) ── */
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
          <motion.div
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }}
            initial="hidden" animate="visible"
          >
            <FadeUp>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.3em] text-muted">
                Sorteos en vivo · Facebook Live
              </p>
            </FadeUp>

            <FadeUp>
              <h1 className="font-display leading-none">
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
              </h1>
            </FadeUp>

            <FadeUp>
              <p className="mx-auto mt-6 max-w-lg text-base text-cream/80">
                Participa en nuestros sorteos y bingos en vivo por Facebook. Registra tu
                comprobante y espera el resultado en directo.
              </p>
            </FadeUp>

            {countdown && !countdown.expired && (
              <FadeUp className="mt-10">
                <CountdownDisplay countdown={countdown} centered />
              </FadeUp>
            )}

            {countdown?.expired && (
              <FadeUp>
                <p className="mt-8 font-display text-3xl tracking-widest text-gold">
                  ¡EL SORTEO ESTÁ EN CURSO!
                </p>
              </FadeUp>
            )}

            <FadeUp className="mt-10 flex flex-wrap justify-center gap-4">
              <span className="border border-gold/30 px-8 py-4 text-sm font-bold uppercase tracking-widest text-muted">
                Próximamente
              </span>
              {config.url_stream_live && (
                <a
                  href={config.url_stream_live}
                  target="_blank" rel="noreferrer"
                  className="border border-gold/50 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/10"
                >
                  Ver en vivo
                </a>
              )}
            </FadeUp>

            {config.mensaje_destacado && (
              <FadeUp>
                <p className="mx-auto mt-8 max-w-lg text-sm text-muted">
                  ✦ {config.mensaje_destacado}
                </p>
              </FadeUp>
            )}
          </motion.div>
        </div>
      )}
    </section>
  )
}

/* ─── Sorteos panel (right column / mobile carousel) ────────────────────── */
function SorteosHeroPanel({ sorteos, router, onZoomImage }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.25 }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-block size-1.5 animate-pulse rounded-full bg-gold" />
        <p className="font-display text-xl tracking-widest text-gold">
          SORTEOS ACTIVOS
        </p>
        <span className="ml-auto border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-gold">
          {sorteos.length}
        </span>
      </div>

      {/*
        Mobile:  horizontal snap-scroll carousel
        Desktop: vertical stack with max-height + scroll
      */}
      <div className="
        flex gap-3 overflow-x-auto pb-2
        md:flex-col md:overflow-x-visible md:overflow-y-auto md:max-h-[520px] md:pb-0 md:gap-3 md:pr-1
        snap-x snap-mandatory md:snap-none
      ">
        {sorteos.slice(0, 6).map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.35 + i * 0.08 }}
            className="snap-start shrink-0 w-[72vw] max-w-[300px] md:w-full md:max-w-none md:shrink-0"
          >
            <HeroSorteoCard
              sorteo={s}
              onParticipate={() => router.push(`/sorteos/${s.id}`)}
              onZoomImage={onZoomImage}
            />
          </motion.div>
        ))}

        {/* Chip "+N más" cuando hay más de 6 */}
        {sorteos.length > 6 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.35 + 6 * 0.08 }}
            className="snap-start shrink-0 w-[72vw] max-w-[300px] md:w-full md:max-w-none md:shrink-0"
          >
            <div className="flex h-full min-h-[80px] items-center justify-center border border-gold/20 bg-surface/60 px-4 py-5 text-center md:min-h-[64px]">
              <p className="text-sm font-semibold text-gold">
                + {sorteos.length - 6} sorteos más disponibles
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Mobile scroll hint */}
      {sorteos.length > 1 && (
        <p className="mt-2 text-center text-[9px] uppercase tracking-widest text-muted/40 md:hidden">
          desliza para ver más
        </p>
      )}
    </motion.div>
  )
}

/* ─── Hero sorteo card ───────────────────────────────────────────────────── */
function HeroSorteoCard({ sorteo, onParticipate, onZoomImage }) {
  const diasRestantes = Math.max(0, Math.ceil((new Date(sorteo.fecha_sorteo) - Date.now()) / 86_400_000))
  const urgente      = diasRestantes <= 3 && !sorteo.cupo_lleno
  const tieneLimit   = sorteo.limite_participantes != null
  const pct          = tieneLimit ? Math.min(100, Math.round((sorteo.inscritos / sorteo.limite_participantes) * 100)) : 0
  const casiLleno    = tieneLimit && !sorteo.cupo_lleno && pct >= 80

  return (
    <div className={[
      'group flex flex-col border bg-surface transition-all duration-300',
      sorteo.cupo_lleno
        ? 'border-muted/20 opacity-70'
        : 'border-gold/20 hover:border-gold/50 hover:shadow-[0_0_28px_rgba(212,175,55,0.09)]',
    ].join(' ')}>

      {/* Image / gradient con blur back-layer */}
      <div className="relative h-40 shrink-0 overflow-hidden md:h-44 bg-surface2/50 flex items-center justify-center">
        {sorteo.imagen_url ? (
          <>
            {/* Capa background difuminada */}
            <img
              src={sorteo.imagen_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover blur-md opacity-35 scale-110 pointer-events-none select-none"
            />
            {/* Capa frontal contenida */}
            <img
              src={sorteo.imagen_url}
              alt={sorteo.nombre}
              className={[
                'relative z-10 max-h-full max-w-full object-contain transition-transform duration-500',
                sorteo.cupo_lleno ? 'grayscale' : 'group-hover:scale-105',
              ].join(' ')}
            />
            {/* Lupa overlay al hacer hover */}
            {onZoomImage && (
              <div
                className="absolute inset-0 bg-black/0 hover:bg-black/35 flex items-center justify-center transition-colors duration-300 z-20 cursor-zoom-in group/img"
                onClick={() => onZoomImage(sorteo.imagen_url)}
              >
                <svg
                  className="size-8 text-white/0 group-hover/img:text-white/80 transition-all duration-300 transform scale-75 group-hover/img:scale-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}
          </>
        ) : (
          <SorteoGradientBg tipo={sorteo.tipo} />
        )}

        {/* Cupo completo overlay */}
        {sorteo.cupo_lleno && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 pointer-events-none">
            <span className="border border-muted/40 bg-bg/80 px-3 py-1.5 font-display text-sm tracking-widest text-muted backdrop-blur-sm">
              CUPO COMPLETO
            </span>
          </div>
        )}

        {/* Badges top */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-2.5 pointer-events-none">
          <span className="border border-gold/30 bg-black/65 px-2 py-0.5 backdrop-blur-sm text-[9px] font-bold uppercase tracking-widest text-gold">
            {TIPO_LABEL[sorteo.tipo] ?? sorteo.tipo.toUpperCase()}
          </span>
          <span className="bg-gold px-2 py-0.5 text-[9px] font-bold text-bg">
            S/ {Number(sorteo.precio_participacion).toFixed(2)}
          </span>
        </div>

        {/* Ribbons bottom */}
        {urgente && (
          <div className="absolute inset-x-0 bottom-0 z-20 bg-danger/90 px-2 py-1 text-center pointer-events-none">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white">
              {diasRestantes === 0 ? '¡Hoy!' : `${diasRestantes}d restantes`}
            </span>
          </div>
        )}
        {casiLleno && (
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gold/90 px-2 py-1 text-center pointer-events-none">
            <span className="text-[9px] font-bold uppercase tracking-widest text-bg">
              ¡Últimos cupos!
            </span>
          </div>
        )}
        {!urgente && !casiLleno && (
          <div className="absolute inset-x-0 bottom-0 z-20 h-10 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="mb-0.5 text-sm font-semibold leading-tight text-cream">{sorteo.nombre}</h3>
        <p className="mb-3 text-[11px] text-muted">{sorteo.fecha_sorteo_fmt}</p>

        {sorteo.premios?.length > 0 && (
          <ul className="mb-3 flex-1 space-y-1.5">
            {sorteo.premios.slice(0, 2).map(p => (
              <li key={p.id} className="flex items-center gap-2 text-xs">
                <span className="shrink-0 text-[8px] text-gold">●</span>
                <span className="truncate text-content">{p.nombre}</span>
                {p.monto != null && (
                  <span className="ml-auto shrink-0 font-bold text-gold">
                    S/ {Number(p.monto).toFixed(2)}
                  </span>
                )}
              </li>
            ))}
            {sorteo.premios.length > 2 && (
              <li className="text-[10px] text-muted">+{sorteo.premios.length - 2} premios más</li>
            )}
          </ul>
        )}

        {/* Barra de cupos */}
        {tieneLimit && (
          <div className="mb-3 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted">
                {sorteo.cupo_lleno ? 'Cupo completado' : `${sorteo.inscritos} de ${sorteo.limite_participantes} cupos`}
              </span>
              <span className={sorteo.cupo_lleno ? 'text-muted' : casiLleno ? 'font-bold text-gold' : 'text-muted'}>
                {pct}%
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-surface2">
              <div
                className={[
                  'h-full rounded-full transition-all duration-500',
                  sorteo.cupo_lleno ? 'bg-muted/40' : casiLleno ? 'bg-gold animate-pulse' : 'bg-gold/60',
                ].join(' ')}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {sorteo.cupo_lleno ? (
          <div className="mt-auto w-full border border-muted/20 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-muted">
            Sin cupos disponibles
          </div>
        ) : (
          <button
            type="button"
            onClick={onParticipate}
            className="mt-auto w-full bg-danger py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-danger-dark"
          >
            Participar
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Gradient fallback when sorteo has no image ─────────────────────────── */
function SorteoGradientBg({ tipo, nombre }) {
  const [from, to] = TIPO_GRADIENT[tipo] ?? TIPO_GRADIENT.sorteo
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      <span
        className="select-none font-display text-5xl tracking-[0.15em]"
        style={{ color: 'rgba(212,175,55,0.12)' }}
      >
        {TIPO_LABEL[tipo] ?? 'SORTEO'}
      </span>
    </div>
  )
}

/* ─── Countdown display ──────────────────────────────────────────────────── */
function CountdownDisplay({ countdown, centered }) {
  return (
    <div className={centered ? 'text-center' : ''}>
      <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-muted">Próximo sorteo en</p>
      <style>{`
        @keyframes flip-in {
          0%   { transform: rotateX(90deg); opacity: 0; }
          100% { transform: rotateX(0deg);  opacity: 1; }
        }
        .flip-digit { animation: flip-in 0.3s ease-out; }
      `}</style>
      <div className={`inline-flex items-center gap-1.5 md:gap-2 ${centered ? '' : ''}`}>
        {[
          { v: countdown.days,    l: 'días' },
          { v: countdown.hours,   l: 'horas' },
          { v: countdown.minutes, l: 'min' },
          { v: countdown.seconds, l: 'seg' },
        ].map(({ v, l }, i) => (
          <div key={l} className="flex items-center gap-1.5 md:gap-2">
            <div
              className="flex flex-col items-center border border-gold/30 bg-surface2 px-2.5 py-2 md:px-4 md:py-3"
              style={{ perspective: '400px' }}
            >
              <span
                key={v}
                className="flip-digit font-display text-4xl leading-none text-gold md:text-5xl"
                style={{ display: 'inline-block', transformOrigin: 'center' }}
              >
                {String(v).padStart(2, '0')}
              </span>
              <span className="mt-1 text-[9px] uppercase tracking-widest text-muted">{l}</span>
            </div>
            {i < 3 && <span className="font-display text-2xl text-gold/50 md:text-3xl">:</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Aurora orb ─────────────────────────────────────────────────────────── */
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

/* ─── Stream ─────────────────────────────────────────────────────────────── */
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

/* ─── Ganadores recientes ────────────────────────────────────────────────── */
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
    { x: '5%',  color: '#D4AF37', r: 3,   dur: 7,  delay: 0 },
    { x: '12%', color: '#C0392B', r: 2,   dur: 9,  delay: -3 },
    { x: '88%', color: '#D4AF37', r: 4,   dur: 8,  delay: -1 },
    { x: '92%', color: '#27AE60', r: 2.5, dur: 11, delay: -5 },
    { x: '78%', color: '#D4AF37', r: 3,   dur: 6,  delay: -2 },
    { x: '20%', color: '#C0392B', r: 2,   dur: 10, delay: -7 },
    { x: '65%', color: '#27AE60', r: 3.5, dur: 8,  delay: -4 },
    { x: '45%', color: '#D4AF37', r: 2,   dur: 12, delay: -6 },
    { x: '33%', color: '#B8960C', r: 3,   dur: 9,  delay: -1.5 },
    { x: '72%', color: '#C0392B', r: 2.5, dur: 7,  delay: -8 },
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

/* ─── Seguridad ──────────────────────────────────────────────────────────── */
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

/* ─── Countdown hook ─────────────────────────────────────────────────────── */
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

/* ─── Lightbox Modal ─────────────────────────────────────────────────────── */
function LightboxModal({ imageUrl, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300"
      style={{ backgroundColor: 'rgba(5, 5, 5, 0.85)' }}
      onClick={onClose}
    >
      <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded border border-gold/20 shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-black/60 p-2 text-white/80 transition-colors hover:bg-black/90 hover:text-white"
          aria-label="Cerrar modal"
        >
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Imagen en tamaño real/ajustada */}
        <img
          src={imageUrl}
          alt="Flyer del sorteo en tamaño completo"
          className="max-h-[90vh] max-w-[90vw] object-contain"
        />
      </div>
    </div>
  )
}
