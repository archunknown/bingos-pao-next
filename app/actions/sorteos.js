'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

const TIPOS_VALIDOS = ['sorteo', 'pozito', 'especial', 'aniversario']

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

export async function createSorteo(prevState, formData) {
  const supabase = createAdminClient()

  const raw = {
    nombre: formData.get('nombre')?.trim() ?? '',
    tipo: formData.get('tipo') ?? '',
    fecha_sorteo: formData.get('fecha_sorteo') ?? '',
    precio_participacion: formData.get('precio_participacion') ?? '',
    descripcion: formData.get('descripcion')?.trim() || null,
    estado: 'borrador',
  }

  const errors = validate(raw)
  if (Object.keys(errors).length) return { errors, values: raw }

  const { error } = await supabase.from('sorteos').insert([{
    nombre: raw.nombre,
    tipo: raw.tipo,
    fecha_sorteo: raw.fecha_sorteo,
    precio_participacion: parseFloat(raw.precio_participacion),
    descripcion: raw.descripcion,
    estado: 'borrador',
  }])

  if (error) return { errors: { _: error.message }, values: raw }

  redirect('/dashboard/sorteos?success=Sorteo creado correctamente')
}

export async function updateSorteo(id, prevState, formData) {
  const supabase = createAdminClient()

  const raw = {
    nombre: formData.get('nombre')?.trim() ?? '',
    tipo: formData.get('tipo') ?? '',
    fecha_sorteo: formData.get('fecha_sorteo') ?? '',
    precio_participacion: formData.get('precio_participacion') ?? '',
    descripcion: formData.get('descripcion')?.trim() || null,
  }

  const errors = validate(raw)
  if (Object.keys(errors).length) return { errors, values: raw }

  const { error } = await supabase
    .from('sorteos')
    .update({
      nombre: raw.nombre,
      tipo: raw.tipo,
      fecha_sorteo: raw.fecha_sorteo,
      precio_participacion: parseFloat(raw.precio_participacion),
      descripcion: raw.descripcion,
    })
    .eq('id', id)

  if (error) return { errors: { _: error.message }, values: raw }

  redirect('/dashboard/sorteos?success=Sorteo actualizado correctamente')
}

export async function deleteSorteo(id) {
  const supabase = createAdminClient()

  const { data: sorteo } = await supabase
    .from('sorteos')
    .select('estado')
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

  await supabase.from('sorteos').delete().eq('id', id)

  redirect('/dashboard/sorteos?success=Sorteo eliminado correctamente')
}

export async function toggleEstado(id) {
  const supabase = createAdminClient()

  const { data: sorteo } = await supabase
    .from('sorteos')
    .select('estado')
    .eq('id', id)
    .single()

  const transiciones = { borrador: 'activo', activo: 'cerrado' }
  const nuevoEstado = sorteo?.estado ? transiciones[sorteo.estado] : null

  if (!nuevoEstado) {
    redirect('/dashboard/sorteos?error=Este sorteo ya está cerrado y no puede cambiar de estado')
  }

  if (nuevoEstado === 'cerrado') {
    const { data: files } = await supabase.storage.from('comprobantes').list(String(id), { limit: 1000 })
    if (files?.length) {
      const filePaths = files.map((f) => `${id}/${f.name}`)
      await supabase.storage.from('comprobantes').remove(filePaths)
    }
  }

  await supabase.from('sorteos').update({ estado: nuevoEstado }).eq('id', id)

  redirect(`/dashboard/sorteos?success=Estado actualizado a "${nuevoEstado}"`)
}
