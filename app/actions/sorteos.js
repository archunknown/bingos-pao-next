'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

const TIPOS_VALIDOS = ['sorteo', 'pozito', 'especial', 'aniversario']
const IMAGEN_MAX_BYTES = 5 * 1024 * 1024 // 5 MB

function validate(data) {
  const errors = {}
  if (!data.nombre?.trim()) errors.nombre = 'El nombre es requerido'
  if (!data.tipo || !TIPOS_VALIDOS.includes(data.tipo)) errors.tipo = 'El tipo es requerido'
  if (!data.fecha_sorteo) {
    errors.fecha_sorteo = 'La fecha es requerida'
  } else {
    const fecha = new Date(data.fecha_sorteo)
    if (isNaN(fecha.getTime())) errors.fecha_sorteo = 'Fecha inválida'
    else if (fecha <= new Date()) errors.fecha_sorteo = 'La fecha debe ser posterior a hoy'
  }
  const precio = parseFloat(data.precio_participacion)
  if (data.precio_participacion === '' || data.precio_participacion == null || isNaN(precio)) {
    errors.precio_participacion = 'El precio es requerido'
  } else if (precio < 0) {
    errors.precio_participacion = 'El precio no puede ser negativo'
  } else if (precio > 9999999.99) {
    errors.precio_participacion = 'El precio es demasiado alto'
  }
  return errors
}

async function uploadSorteoImagen(supabase, id, file) {
  if (!(file instanceof Blob) || file.size === 0) return null
  if (!file.type.startsWith('image/')) return null
  if (file.size > IMAGEN_MAX_BYTES) return null

  const ext = (file.name || 'jpg').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${id}.${ext}`
  const buffer = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('sorteos')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  return error ? null : path
}

async function deleteSorteoImagen(supabase, path) {
  if (!path) return
  await supabase.storage.from('sorteos').remove([path])
}

export async function createSorteo(prevState, formData) {
  const supabase = createAdminClient()

  const raw = {
    nombre:               formData.get('nombre')?.trim() ?? '',
    tipo:                 formData.get('tipo') ?? '',
    fecha_sorteo:         formData.get('fecha_sorteo') ?? '',
    precio_participacion: formData.get('precio_participacion') ?? '',
    descripcion:          formData.get('descripcion')?.trim() || null,
    limite_participantes: formData.get('limite_participantes')?.trim() || null,
  }

  const errors = validate(raw)
  if (Object.keys(errors).length) return { errors, values: raw }

  const limiteVal = raw.limite_participantes ? parseInt(raw.limite_participantes, 10) : null

  const { data: nuevo, error } = await supabase
    .from('sorteos')
    .insert([{
      nombre:               raw.nombre,
      tipo:                 raw.tipo,
      fecha_sorteo:         raw.fecha_sorteo,
      precio_participacion: parseFloat(raw.precio_participacion),
      descripcion:          raw.descripcion,
      limite_participantes: limiteVal,
      estado:               'borrador',
    }])
    .select('id')
    .single()

  if (error) return { errors: { _: error.message }, values: raw }

  const imagen = formData.get('imagen')
  const imagenPath = await uploadSorteoImagen(supabase, nuevo.id, imagen)
  if (imagenPath) {
    await supabase.from('sorteos').update({ imagen_path: imagenPath }).eq('id', nuevo.id)
  }

  redirect('/dashboard/sorteos?success=Sorteo creado correctamente')
}

export async function updateSorteo(id, prevState, formData) {
  const supabase = createAdminClient()

  const raw = {
    nombre:               formData.get('nombre')?.trim() ?? '',
    tipo:                 formData.get('tipo') ?? '',
    fecha_sorteo:         formData.get('fecha_sorteo') ?? '',
    precio_participacion: formData.get('precio_participacion') ?? '',
    descripcion:          formData.get('descripcion')?.trim() || null,
    limite_participantes: formData.get('limite_participantes')?.trim() || null,
  }

  const errors = validate(raw)
  if (Object.keys(errors).length) return { errors, values: raw }

  const limiteVal = raw.limite_participantes ? parseInt(raw.limite_participantes, 10) : null

  const { data: current } = await supabase
    .from('sorteos')
    .select('imagen_path')
    .eq('id', id)
    .single()

  const imagenUpdate = {}
  const imagen = formData.get('imagen')
  const removeImagen = formData.get('remove_imagen') === '1'

  if (imagen instanceof Blob && imagen.size > 0) {
    await deleteSorteoImagen(supabase, current?.imagen_path)
    const newPath = await uploadSorteoImagen(supabase, id, imagen)
    if (newPath) imagenUpdate.imagen_path = newPath
  } else if (removeImagen && current?.imagen_path) {
    await deleteSorteoImagen(supabase, current.imagen_path)
    imagenUpdate.imagen_path = null
  }

  const { error } = await supabase
    .from('sorteos')
    .update({
      nombre:               raw.nombre,
      tipo:                 raw.tipo,
      fecha_sorteo:         raw.fecha_sorteo,
      precio_participacion: parseFloat(raw.precio_participacion),
      descripcion:          raw.descripcion,
      limite_participantes: limiteVal,
      ...imagenUpdate,
    })
    .eq('id', id)

  if (error) return { errors: { _: error.message }, values: raw }

  redirect('/dashboard/sorteos?success=Sorteo actualizado correctamente')
}

export async function deleteSorteo(id) {
  const supabase = createAdminClient()

  const { data: sorteo } = await supabase
    .from('sorteos')
    .select('estado, imagen_path')
    .eq('id', id)
    .single()

  const { count } = await supabase
    .from('participantes')
    .select('*', { count: 'exact', head: true })
    .eq('sorteo_id', id)
    .in('estado', ['pendiente', 'confirmado'])

  if (sorteo?.estado !== 'borrador' && (count ?? 0) > 0) {
    redirect('/dashboard/sorteos?error=No se puede eliminar un sorteo con participantes registrados')
  }

  if (sorteo?.imagen_path) {
    await deleteSorteoImagen(supabase, sorteo.imagen_path)
  }

  await supabase.from('sorteos').delete().eq('id', id)

  redirect('/dashboard/sorteos?success=Sorteo eliminado correctamente')
}

export async function toggleEstado(id) {
  const supabase = createAdminClient()

  const { data: sorteo } = await supabase
    .from('sorteos')
    .select('estado, imagen_path')
    .eq('id', id)
    .single()

  const transiciones = { borrador: 'activo', activo: 'cerrado' }
  const nuevoEstado = sorteo?.estado ? transiciones[sorteo.estado] : null

  if (!nuevoEstado) {
    redirect('/dashboard/sorteos?error=Este sorteo ya está cerrado y no puede cambiar de estado')
  }

  const updatePayload = { estado: nuevoEstado }

  if (nuevoEstado === 'cerrado') {
    // Purgar comprobantes de participantes
    const { data: files } = await supabase.storage.from('comprobantes').list(String(id), { limit: 1000 })
    if (files?.length) {
      const filePaths = files.map((f) => `${id}/${f.name}`)
      await supabase.storage.from('comprobantes').remove(filePaths)
    }
    // Purgar imagen del sorteo
    if (sorteo?.imagen_path) {
      await deleteSorteoImagen(supabase, sorteo.imagen_path)
      updatePayload.imagen_path = null
    }
  }

  await supabase.from('sorteos').update(updatePayload).eq('id', id)

  redirect(`/dashboard/sorteos?success=Estado actualizado a "${nuevoEstado}"`)
}
