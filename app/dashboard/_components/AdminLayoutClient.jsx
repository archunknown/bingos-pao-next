'use client'

import { useState, Suspense } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import FlashToast from './FlashToast'

const NAV_MAIN = [
  { label: 'Dashboard',     href: '/dashboard',               Icon: IconGrid },
  { label: 'Sorteos',       href: '/dashboard/sorteos',        Icon: IconTicket },
  { label: 'Nuevo Sorteo',  href: '/dashboard/sorteos/create', Icon: IconPlus },
  { label: 'Participantes', href: '/dashboard/participantes',  Icon: IconUsers },
  { label: 'Ganadores',     href: '/dashboard/ganadores',      Icon: IconTrophy },
]

const NAV_CONFIG = [
  { label: 'Transmisión',   href: '/dashboard/transmision',   Icon: IconVideo },
  { label: 'Configuración', href: '/dashboard/configuracion', Icon: IconSettings },
  { label: 'Exportar',      href: '/dashboard/exportar',      Icon: IconDownload },
]

function isNavActive(href, pathname) {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}

function NavItem({ label, href, Icon, pathname, pendientesCount, onNavigate }) {
  const active = isNavActive(href, pathname)
  const showBadge = label === 'Participantes' && pendientesCount > 0
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={[
        'flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm font-medium transition-colors duration-150',
        active
          ? 'border-l-gold bg-gold/10 text-gold'
          : 'border-l-transparent text-muted hover:bg-surface2 hover:text-cream',
      ].join(' ')}
    >
      <Icon className="size-5 shrink-0" />
      <span className="flex-1">{label}</span>
      {showBadge && (
        <span className="animate-pulse rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {pendientesCount > 99 ? '99+' : pendientesCount}
        </span>
      )}
    </Link>
  )
}

export default function AdminLayoutClient({ config, pendientesCount, user, children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const negocio = config?.nombre_negocio || 'Bingos Pao'
  const logoUrl = config?.logo_url

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function closeSidebar() { setSidebarOpen(false) }

  const sidebarContent = (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV_MAIN.map((item) => (
        <NavItem key={item.href} {...item} pathname={pathname} pendientesCount={pendientesCount} onNavigate={closeSidebar} />
      ))}
      <div className="my-2 border-t border-gold/10" />
      <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted/50">
        Configuración
      </p>
      {NAV_CONFIG.map((item) => (
        <NavItem key={item.href} {...item} pathname={pathname} pendientesCount={pendientesCount} onNavigate={closeSidebar} />
      ))}
    </nav>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-bg font-sans">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={[
        'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gold/20 bg-surface transition-transform duration-300 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>
        {/* Marca */}
        <div className="flex shrink-0 flex-col items-center justify-center gap-2 border-b border-gold/20 py-6 px-4">
          {logoUrl ? (
            <div className="flex size-14 items-center justify-center rounded-full border-2 border-gold/60 bg-surface2 p-1 ring-4 ring-gold/20">
              <img src={logoUrl} alt={negocio} className="size-full rounded-full object-cover" />
            </div>
          ) : (
            <div className="flex size-14 items-center justify-center rounded-xl bg-gold text-2xl font-bold text-bg shadow-lg shadow-gold/30">
              {negocio.charAt(0)}
            </div>
          )}
          <span className="mt-1 font-display text-lg tracking-widest text-gold">{negocio}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted/50">Panel Admin</span>
        </div>

        <div className="flex-1 overflow-y-auto py-2">{sidebarContent}</div>

        {/* Perfil en la parte inferior */}
        <div className="shrink-0 border-t border-gold/10 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-surface2 px-3 py-2.5">
            <div className="flex size-7 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
              {(user?.email ?? 'A').charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate text-xs text-muted">{user?.email ?? 'Admin'}</span>
            <button
              type="button"
              onClick={logout}
              title="Cerrar sesión"
              className="shrink-0 text-muted transition hover:text-danger"
            >
              <IconLogout className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Área principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-gold/20 bg-surface px-4 lg:px-6">
          <button
            type="button"
            className="rounded-md p-1.5 text-muted transition hover:text-cream lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <IconMenu className="size-5" />
          </button>

          <span className="font-display text-base tracking-widest text-gold lg:hidden">
            {negocio}
          </span>

          <div className="flex flex-1 items-center justify-end gap-3">
            {pendientesCount > 0 && (
              <span className="hidden text-xs text-muted sm:block">
                <span className="font-semibold text-gold">{pendientesCount}</span> pendiente{pendientesCount !== 1 ? 's' : ''}
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-md border border-gold/20 px-3 py-1.5 text-xs text-muted transition hover:border-gold/50 hover:text-cream"
            >
              <IconLogout className="size-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Toast de flash messages */}
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
    </div>
  )
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconGrid({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconTicket({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  )
}

function IconPlus({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function IconUsers({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function IconTrophy({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  )
}

function IconVideo({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function IconSettings({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function IconLogout({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

function IconMenu({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function IconDownload({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}
