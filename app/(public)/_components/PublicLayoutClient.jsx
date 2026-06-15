'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const NAV = [
  { label: 'Inicio',           href: '/' },
  { label: 'Sorteo Activo',    href: '/sorteos' },
  { label: 'Ganadores',        href: '/ganadores' },
  { label: 'Mi Participación', href: '/mi-participacion' },
]

const ALERTAS = [
  '📲 Recuerda que nuestros únicos métodos de pago habilitados son Yape y Plin; envía tu comprobante una vez realizada la transferencia. 💸✅',
  '⚠️ Nunca compartas tus datos personales con terceros. Solo nos comunicamos por nuestros canales oficiales de WhatsApp y Facebook.',
  '🏆 Todos nuestros sorteos se realizan en vivo por Facebook. Desconfía de quienes ofrezcan números o premios fuera de estos canales.',
]

const navUnderline = {
  rest:  { scaleX: 0 },
  hover: { scaleX: 1, transition: { duration: 0.2, ease: 'easeOut' } },
}

const mobileMenu = {
  hidden:  { opacity: 0, y: -6, transition: { duration: 0.15, ease: 'easeIn' } },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.2, ease: 'easeOut', staggerChildren: 0.06 } },
}
const mobileItem = {
  hidden:  { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
}

function waLink(raw) {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits.length === 9 ? `51${digits}` : digits}`
}

export default function PublicLayoutClient({ children, nombre, logoUrl, titular, whatsapp }) {
  const pathname = usePathname()
  const [menuOpen, setMenu] = useState(false)

  const waHref = waLink(whatsapp)

  useEffect(() => { setMenu(false) }, [pathname])

  function isActive(href) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg font-sans text-content">
      {/* Ticker de alertas */}
      <div className="overflow-hidden border-b border-danger/30 bg-danger/10 py-2">
        <div className="ticker-scroll flex whitespace-nowrap">
          {[...ALERTAS, ...ALERTAS].map((text, i) => (
            <span key={i} className="shrink-0 text-xs font-medium text-cream">
              <span className="px-12">{text}</span>
              <span className="text-danger/50">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Navbar — slide down al montar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="sticky top-0 z-30 border-b border-gold/20 bg-bg/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={nombre} className="h-9 w-9 rounded-full object-cover ring-2 ring-gold/50" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-sm font-bold text-bg">
                {nombre.charAt(0)}
              </div>
            )}
            <span className="font-display text-xl tracking-widest text-gold">{nombre}</span>
          </Link>

          {/* Nav desktop con underline animado */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(({ label, href }) => {
              const active = isActive(href)
              if (active) {
                return (
                  <Link
                    key={href}
                    href={href}
                    className="relative px-3 py-1.5 text-sm text-gold after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:rounded-full after:bg-gold after:content-['']"
                  >
                    {label}
                  </Link>
                )
              }
              return (
                <motion.div
                  key={href}
                  initial="rest"
                  whileHover="hover"
                  animate="rest"
                  className="relative"
                >
                  <Link href={href} className="block px-3 py-1.5 text-sm text-muted transition-colors hover:text-cream">
                    {label}
                  </Link>
                  <motion.span
                    variants={navUnderline}
                    className="pointer-events-none absolute bottom-0 left-3 right-3 h-[2px] origin-left rounded-full bg-gold/60"
                  />
                </motion.div>
              )
            })}
          </nav>

          {/* Acciones desktop */}
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/sorteos"
              className="rounded-lg bg-gold px-5 py-1.5 text-sm font-bold text-bg transition-colors hover:bg-gold-light"
            >
              Participar
            </Link>
          </div>

          {/* Hamburguesa */}
          <button
            type="button"
            onClick={() => setMenu(o => !o)}
            className="rounded-md p-2 text-muted hover:text-cream md:hidden"
            aria-label="Menú"
          >
            {menuOpen ? <IconX /> : <IconMenu />}
          </button>
        </div>

        {/* Menú móvil con AnimatePresence */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              variants={mobileMenu}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="border-t border-gold/20 bg-surface px-4 pb-4 md:hidden"
            >
              <nav className="flex flex-col gap-1 pt-2">
                {NAV.map(({ label, href }) => (
                  <motion.div key={href} variants={mobileItem}>
                    <Link
                      href={href}
                      onClick={() => setMenu(false)}
                      className={[
                        'block rounded-lg px-3 py-2.5 text-sm transition-colors',
                        isActive(href)
                          ? 'bg-surface2 text-gold'
                          : 'text-muted hover:bg-surface2 hover:text-cream',
                      ].join(' ')}
                    >
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <motion.div variants={mobileItem}>
                <Link
                  href="/sorteos"
                  onClick={() => setMenu(false)}
                  className="mt-3 block w-full rounded-lg bg-gold py-2.5 text-center text-sm font-bold text-bg hover:bg-gold-light"
                >
                  Participar ahora
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Contenido */}
      <main className="flex-1">{children}</main>

      {/* Botón WhatsApp flotante */}
      {waHref && <WhatsAppBoton href={waHref} />}

      {/* Footer */}
      <footer className="border-t border-gold/20 bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="font-display text-lg tracking-widest text-gold">{nombre}</span>
            <p className="text-xs text-muted">
              Pagos únicamente por Yape / Plin
              {titular && (
                <> · Titular: <span className="text-content">{titular}</span></>
              )}
            </p>
            <nav className="flex flex-wrap justify-center gap-4 text-xs text-muted">
              {NAV.map(({ label, href }) => (
                <Link key={href} href={href} className="transition-colors hover:text-gold">
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-1 border-t border-gold/10 pt-4">
              <a
                href="https://www.archadrian.tech/"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-1.5 text-[11px] text-muted/50 transition-colors hover:text-muted"
              >
                <svg className="size-3 transition-colors group-hover:text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Desarrollado por{' '}
                <span className="transition-colors group-hover:text-gold/80">Arch Adrian</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function WhatsAppBoton({ href }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false))
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      <motion.span
        initial={{ opacity: 0, x: 20, scale: 0.9 }}
        animate={visible ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 20, scale: 0.9 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="pointer-events-none whitespace-nowrap rounded-full bg-surface px-4 py-2 text-sm font-medium text-cream shadow-lg ring-1 ring-gold/20"
      >
        ¿Tienes dudas? ¡Escríbenos!
      </motion.span>
      <motion.a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar por WhatsApp"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#25D366] shadow-lg"
        onHoverStart={() => setVisible(true)}
        onHoverEnd={() => setVisible(false)}
      >
        <IconWhatsApp />
      </motion.a>
    </div>
  )
}

function IconWhatsApp() {
  return (
    <svg className="size-7" fill="white" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function IconMenu() {
  return (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
function IconX() {
  return (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
