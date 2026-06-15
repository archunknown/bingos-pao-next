import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import PremiosClient from './PremiosClient'

export const metadata = { title: 'Premios — Bingos Pao' }

export default async function PremiosPage({ params }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: sorteo }, { data: premios }] = await Promise.all([
    supabase.from('sorteos').select('id, nombre, estado').eq('id', id).single(),
    supabase.from('premios').select('*').eq('sorteo_id', id).order('orden'),
  ])

  if (!sorteo) notFound()

  return <PremiosClient sorteo={sorteo} premios={premios ?? []} />
}
