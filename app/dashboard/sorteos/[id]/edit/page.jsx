import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import SorteoForm from '../../../_components/SorteoForm'

export const metadata = { title: 'Editar Sorteo — Bingos Pao' }

export default async function EditSorteoPage({ params }) {
  const { id } = await params

  const supabase = createAdminClient()
  const { data: sorteo } = await supabase
    .from('sorteos')
    .select('id, nombre, tipo, fecha_sorteo, precio_participacion, descripcion, estado, imagen_path, limite_participantes')
    .eq('id', id)
    .single()

  if (!sorteo) notFound()

  let imagenUrl = null
  if (sorteo.imagen_path) {
    const { data: { publicUrl } } = supabase.storage.from('sorteos').getPublicUrl(sorteo.imagen_path)
    imagenUrl = publicUrl || null
  }

  return <SorteoForm sorteo={sorteo} imagenUrl={imagenUrl} />
}
