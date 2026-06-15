import { createAdminClient } from '@/lib/supabase/admin'
import ExportarClient from './ExportarClient'

export const metadata = { title: 'Exportar — Bingos Pao' }

export default async function ExportarPage() {
  const supabase = createAdminClient()

  const { data: sorteos } = await supabase
    .from('sorteos')
    .select('id, nombre, estado')
    .order('fecha_sorteo', { ascending: false })

  return <ExportarClient sorteos={sorteos ?? []} />
}
