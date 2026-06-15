import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import SorteoForm from '../../../_components/SorteoForm'

export const metadata = { title: 'Editar Sorteo — Bingos Pao' }

export default async function EditSorteoPage({ params }) {
  const { id } = await params

  const supabase = createAdminClient()
  const { data: sorteo } = await supabase
    .from('sorteos')
    .select('id, nombre, tipo, fecha_sorteo, precio_participacion, descripcion, estado')
    .eq('id', id)
    .single()

  if (!sorteo) notFound()

  return <SorteoForm sorteo={sorteo} />
}
