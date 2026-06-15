'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

function validate({ nombre, cantidad, monto }) {
  const errors = {}
  if (!nombre?.trim()) errors.nombre = 'El nombre es requerido'
  const qty = parseInt(cantidad)
  if (isNaN(qty) || qty < 1) errors.cantidad = 'La cantidad debe ser al menos 1'
  if (monto !== '' && monto != null && monto !== undefined) {
    const m = parseFloat(monto)
    if (isNaN(m) || m < 0) errors.monto = 'Debe ser un número positivo'
    else if (m > 99999999.99) errors.monto = 'El monto es demasiado alto'
  }
  return errors
}

function toRow(data) {
  return {
    nombre: data.nombre.trim(),
    cantidad: parseInt(data.cantidad),
    monto: data.monto !== '' && data.monto != null ? parseFloat(data.monto) : null,
    descripcion_premio: data.descripcion_premio?.trim() || null,
    visible: data.visible ?? true,
  }
}

export async function createPremio(sorteoId, data) {
  const errors = validate(data)
  if (Object.keys(errors).length) return { errors }

  const supabase = createAdminClient()

  const { data: maxRow } = await supabase
    .from('premios')
    .select('orden')
    .eq('sorteo_id', sorteoId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('premios').insert([{
    sorteo_id: sorteoId,
    ...toRow(data),
    orden: (maxRow?.orden ?? 0) + 1,
  }])

  if (error) return { errors: { _: error.message } }

  revalidatePath(`/dashboard/sorteos/${sorteoId}/premios`)
  revalidatePath(`/sorteos/${sorteoId}`)
  revalidatePath('/')
  return { ok: true }
}

export async function updatePremio(premioId, sorteoId, data) {
  const errors = validate(data)
  if (Object.keys(errors).length) return { errors }

  const supabase = createAdminClient()
  const { error } = await supabase.from('premios').update(toRow(data)).eq('id', premioId)

  if (error) return { errors: { _: error.message } }

  revalidatePath(`/dashboard/sorteos/${sorteoId}/premios`)
  revalidatePath(`/sorteos/${sorteoId}`)
  revalidatePath('/')
  return { ok: true }
}

export async function deletePremio(premioId, sorteoId) {
  const supabase = createAdminClient()
  await supabase.from('premios').delete().eq('id', premioId)
  revalidatePath(`/dashboard/sorteos/${sorteoId}/premios`)
  revalidatePath(`/sorteos/${sorteoId}`)
  revalidatePath('/')
  return { ok: true }
}

export async function togglePremioVisible(premioId, sorteoId, currentVisible) {
  const supabase = createAdminClient()
  await supabase.from('premios').update({ visible: !currentVisible }).eq('id', premioId)
  revalidatePath(`/dashboard/sorteos/${sorteoId}/premios`)
  revalidatePath(`/sorteos/${sorteoId}`)
  revalidatePath('/')
  return { ok: true }
}

export async function reordenarPremios(sorteoId, ordenIds) {
  const supabase = createAdminClient()
  await Promise.all(
    ordenIds.map((id, i) =>
      supabase.from('premios').update({ orden: i + 1 }).eq('id', id).eq('sorteo_id', sorteoId)
    )
  )
  revalidatePath(`/dashboard/sorteos/${sorteoId}/premios`)
  revalidatePath(`/sorteos/${sorteoId}`)
  revalidatePath('/')
  return { ok: true }
}
