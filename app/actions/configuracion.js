'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function saveTransmision(data) {
  const supabase = createAdminClient()

  const rows = [
    { clave: 'url_stream_live',    valor: data.url_stream_live    ?? '' },
    { clave: 'url_stream_grabado', valor: data.url_stream_grabado ?? '' },
    { clave: 'estado_stream',      valor: data.estado_stream      ?? 'sin_transmision' },
    { clave: 'mensaje_destacado',  valor: data.mensaje_destacado  ?? '' },
  ]

  const { error } = await supabase
    .from('configuracion')
    .upsert(rows, { onConflict: 'clave' })

  if (error) return { errors: { _: error.message } }

  revalidatePath('/dashboard/transmision')
  return { ok: true }
}

export async function saveConfiguracion(formData) {
  const supabase = createAdminClient()

  // Fetch current paths to delete orphans
  const { data: rows } = await supabase
    .from('configuracion')
    .select('clave, valor')

  const current = Object.fromEntries((rows ?? []).map(r => [r.clave, r.valor]))

  const textKeys = [
    'nombre_negocio', 'titular_pago', 'whatsapp_contacto',
    'url_facebook', 'url_instagram', 'url_tiktok', 'terminos_condiciones',
  ]
  const upserts = textKeys.map(key => ({ clave: key, valor: formData.get(key) ?? '' }))

  // Handle image uploads
  const imageKeys = ['logo', 'qr_yape', 'qr_plin']
  const errors = {}

  for (const key of imageKeys) {
    const file = formData.get(key)
    if (!file || !(file instanceof Blob) || file.size === 0) continue

    if (!file.type.startsWith('image/')) {
      errors[key] = 'El archivo debe ser una imagen'
      continue
    }

    const ext = (file.name ?? 'jpg').split('.').pop().toLowerCase()
    const newPath = `${key}.${ext}`
    const oldPath = current[`${key}_path`] ?? null

    if (oldPath && oldPath !== newPath) {
      await supabase.storage.from('configuracion').remove([oldPath])
    }

    const buffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('configuracion')
      .upload(newPath, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      errors[key] = uploadError.message
    } else {
      upserts.push({ clave: `${key}_path`, valor: newPath })
    }
  }

  if (Object.keys(errors).length) return { errors }

  const { error } = await supabase
    .from('configuracion')
    .upsert(upserts, { onConflict: 'clave' })

  if (error) return { errors: { _: error.message } }

  revalidatePath('/dashboard/configuracion')
  return { ok: true }
}
