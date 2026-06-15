import { createAdminClient } from '@/lib/supabase/admin'
import ParticipantesClient from './ParticipantesClient'

export const metadata = { title: 'Participantes — Bingos Pao' }

export default async function ParticipantesPage({ searchParams }) {
  const { sorteo_id, estado } = await searchParams
  const supabase = createAdminClient()

  const { data: sorteos } = await supabase
    .from('sorteos')
    .select('id, nombre')
    .order('created_at', { ascending: false })

  let query = supabase
    .from('participantes')
    .select('id, nombres, apellidos, whatsapp, numero_registro, estado, created_at, sorteo_id, sorteos(nombre)')
    .order('created_at', { ascending: false })

  if (sorteo_id) query = query.eq('sorteo_id', sorteo_id)

  const { data: raw } = await query

  const fmt = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Lima',
  })

  const participantes = (raw ?? []).map((p) => ({
    ...p,
    created_at_fmt: fmt.format(new Date(p.created_at)),
  }))

  return (
    <ParticipantesClient
      sorteos={sorteos ?? []}
      participantes={participantes}
      currentSorteoId={sorteo_id ?? ''}
      currentEstado={estado ?? ''}
    />
  )
}
