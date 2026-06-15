import { createClient } from '@/lib/supabase/server'
import GanadoresPublicoClient from './_components/GanadoresPublicoClient'

export const metadata = { title: 'Ganadores — Bingos Pao' }
export const revalidate = 60

export default async function GanadoresPage({ searchParams }) {
  const { sorteo_id: sorteoIdRaw } = await searchParams
  const sorteoId = sorteoIdRaw ? String(sorteoIdRaw) : null

  const supabase = await createClient()

  let ganadoresQuery = supabase
    .from('ganadores')
    .select('id, participante:participantes!ganadores_participante_id_fkey(nombres, apellidos), premio:premios!ganadores_premio_id_fkey(nombre, monto, descripcion_premio), sorteo:sorteos!ganadores_sorteo_id_fkey(id, nombre, tipo, fecha_sorteo)')
    .eq('publicado', true)
    .order('created_at', { ascending: false })

  if (sorteoId) {
    ganadoresQuery = ganadoresQuery.eq('sorteo_id', sorteoId)
  }

  const [{ data: ganadoresRows }, { data: sorteosRows }] = await Promise.all([
    ganadoresQuery,
    supabase.from('sorteos').select('id, nombre').order('fecha_sorteo', { ascending: false }).limit(50),
  ])

  const AVATAR_PALETTES = [
    { bg: '#D4AF37', text: '#0D0D0D' },
    { bg: '#C0392B', text: '#ffffff' },
    { bg: '#27AE60', text: '#ffffff' },
    { bg: '#B8960C', text: '#0D0D0D' },
    { bg: '#F5F0E8', text: '#0D0D0D' },
    { bg: '#888888', text: '#0D0D0D' },
  ]

  // Ofuscación del nombre: "Juan Pérez" → "Juan P***"
  function ofuscarNombre(nombres, apellidos) {
    const n = nombres?.trim() ?? ''
    const a = apellidos?.trim() ?? ''
    const primerNombre = n.split(' ')[0] ?? ''
    const primerApellido = a.split(' ')[0] ?? ''
    if (!primerApellido) return primerNombre
    const inicial = primerApellido.charAt(0)
    return `${primerNombre} ${inicial}${'*'.repeat(Math.max(2, primerApellido.length - 1))}`
  }

  const ganadores = (ganadoresRows ?? []).map((g, i) => {
    const palette = AVATAR_PALETTES[i % AVATAR_PALETTES.length]
    const nombreOfuscado = ofuscarNombre(g.participante?.nombres, g.participante?.apellidos)
    return {
      id: g.id,
      nombre: nombreOfuscado,
      inicial: (g.participante?.nombres ?? '?').charAt(0).toUpperCase(),
      palette,
      premio: g.premio?.nombre ?? '—',
      monto: g.premio?.monto ?? null,
      descripcion: g.premio?.descripcion_premio ?? null,
      sorteo: g.sorteo?.nombre ?? null,
      tipo_sorteo: g.sorteo?.tipo ?? null,
      fecha_sorteo: g.sorteo?.fecha_sorteo ?? null,
    }
  })

  const sorteos = (sorteosRows ?? [])

  return (
    <GanadoresPublicoClient
      ganadores={ganadores}
      sorteos={sorteos}
      filtroSorteoId={sorteoId}
    />
  )
}
