'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function registrarGanador(sorteo_id, participante_id, premio_id) {
  if (!sorteo_id || !participante_id || !premio_id) {
    return { errors: { _: 'Todos los campos son requeridos' } }
  }

  const supabase = createAdminClient()

  const { data: participante } = await supabase
    .from('participantes')
    .select('id, estado, sorteo_id')
    .eq('id', participante_id)
    .single()

  if (
    !participante ||
    participante.estado !== 'confirmado' ||
    String(participante.sorteo_id) !== String(sorteo_id)
  ) {
    return { errors: { _: 'El participante debe estar confirmado y pertenecer al sorteo seleccionado' } }
  }

  const { data: premio } = await supabase
    .from('premios')
    .select('id, sorteo_id')
    .eq('id', premio_id)
    .single()

  if (!premio || String(premio.sorteo_id) !== String(sorteo_id)) {
    return { errors: { _: 'El premio no pertenece al sorteo seleccionado' } }
  }

  const { count } = await supabase
    .from('ganadores')
    .select('*', { count: 'exact', head: true })
    .eq('participante_id', participante_id)
    .eq('sorteo_id', sorteo_id)

  if ((count ?? 0) > 0) {
    return { errors: { _: 'Este participante ya fue registrado como ganador en este sorteo' } }
  }

  const { error } = await supabase.from('ganadores').insert([{
    sorteo_id,
    participante_id,
    premio_id,
    publicado: false,
  }])

  if (error) return { errors: { _: error.message } }

  revalidatePath('/dashboard/ganadores')
  revalidatePath('/ganadores')
  redirect('/dashboard/ganadores?success=Ganador registrado correctamente')
}

export async function toggleGanadorPublicado(id, currentPublicado) {
  const supabase = createAdminClient()
  await supabase.from('ganadores').update({ publicado: !currentPublicado }).eq('id', id)
  revalidatePath('/dashboard/ganadores')
  revalidatePath('/ganadores')
  return { ok: true }
}
