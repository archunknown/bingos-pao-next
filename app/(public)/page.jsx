import { createClient } from '@/lib/supabase/server'
import LandingClient from './_components/LandingClient'

export const metadata = { title: 'Bingos Pao — Sorteos en vivo' }
export const revalidate = 60

export default async function LandingPage() {
  const supabase = await createClient()

  const [
    { data: configRows },
    { data: sorteosRows },
    { data: ganadoresRows },
  ] = await Promise.all([
    supabase.from('configuracion').select('clave, valor'),
    supabase
      .from('sorteos')
      .select('id, nombre, tipo, precio_participacion, fecha_sorteo, premios(id, nombre, monto, descripcion_premio, orden, visible)')
      .eq('estado', 'activo')
      .order('fecha_sorteo', { ascending: true }),
    supabase
      .from('ganadores')
      .select('id, participante:participantes!ganadores_participante_id_fkey(nombres, apellidos), premio:premios!ganadores_premio_id_fkey(nombre, monto, descripcion_premio), sorteo:sorteos!ganadores_sorteo_id_fkey(nombre, tipo, fecha_sorteo)')
      .eq('publicado', true)
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  const config = Object.fromEntries((configRows ?? []).map(r => [r.clave, r.valor]))

  // Generate QR & image public URLs
  const imageKeys = ['logo', 'qr_yape', 'qr_plin']
  for (const key of imageKeys) {
    const path = config[`${key}_path`]
    if (path) {
      const { data: { publicUrl } } = supabase.storage.from('configuracion').getPublicUrl(path)
      config[`${key}_url`] = publicUrl || null
    }
  }

  // Sort premios within each sorteo
  const sorteos = (sorteosRows ?? []).map(s => ({
    ...s,
    premios: (s.premios ?? []).filter(p => p.visible !== false).sort((a, b) => a.orden - b.orden),
    fecha_sorteo_fmt: new Date(s.fecha_sorteo).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'long', timeStyle: 'short' }),
  }))

  // Fechas de sorteos activos para el countdown
  const fechas_sorteos = sorteos.map(s => s.fecha_sorteo).filter(Boolean)

  // Pre-process ganadores for client
  const AVATAR_COLORS = ['bg-gold/20 text-gold', 'bg-danger/20 text-danger', 'bg-success/20 text-success', 'bg-cream/10 text-cream']
  const ganadores = (ganadoresRows ?? []).map((g, i) => {
    const nombreCompleto = `${g.participante?.nombres ?? ''} ${g.participante?.apellidos ?? ''}`.trim()
    return {
      id: g.id,
      nombre: nombreCompleto,
      inicial: nombreCompleto.charAt(0).toUpperCase() || '?',
      avatarCls: AVATAR_COLORS[i % AVATAR_COLORS.length],
      premio: g.premio?.nombre ?? '—',
      monto: g.premio?.monto ?? null,
      sorteo: g.sorteo?.nombre ?? null,
      tipo_sorteo: g.sorteo?.tipo ?? null,
      fecha_sorteo: g.sorteo?.fecha_sorteo ?? null,
    }
  })

  return (
    <LandingClient
      config={config}
      sorteos={sorteos}
      ganadores={ganadores}
      fechas_sorteos={fechas_sorteos}
    />
  )
}
