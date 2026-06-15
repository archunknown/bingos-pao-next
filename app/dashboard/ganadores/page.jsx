import { createAdminClient } from '@/lib/supabase/admin'
import GanadoresClient from './GanadoresClient'

export const metadata = { title: 'Ganadores — Bingos Pao' }
export const dynamic = 'force-dynamic'

export default async function GanadoresPage() {
  const supabase = createAdminClient()

  const [{ data: sorteos }, { data: ganadores }] = await Promise.all([
    supabase
      .from('sorteos')
      .select('id, nombre')
      .order('created_at', { ascending: false }),
    supabase
      .from('ganadores')
      .select('id, publicado, created_at, participante:participantes!ganadores_participante_id_fkey(id, nombres, apellidos), premio:premios!ganadores_premio_id_fkey(id, nombre), sorteo:sorteos!ganadores_sorteo_id_fkey(id, nombre)')
      .order('created_at', { ascending: false }),
  ])

  return <GanadoresClient sorteos={sorteos ?? []} ganadores={ganadores ?? []} />
}
