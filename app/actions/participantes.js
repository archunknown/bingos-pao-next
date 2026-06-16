'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function fetchDniParticipante(dni) {
  const token = process.env.DNI_API_TOKEN
  if (!token) return { error: 'config' }

  try {
    const res = await fetch(`https://miapi.cloud/v1/dni/${dni}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return { error: 'not_found' }

    const json = await res.json()
    const d = json.datos ?? json.data ?? json

    const domicilio    = d.domiciliado ?? d.ubigeo ?? d.direccion ?? {}
    const nombres      = d.nombres ?? d.nombre ?? ''
    const paterno      = d.ape_paterno ?? d.apellido_paterno ?? d.apellidoPaterno ?? d.paterno ?? ''
    const materno      = d.ape_materno ?? d.apellido_materno ?? d.apellidoMaterno ?? d.materno ?? ''
    const departamento = d.departamento ?? domicilio.departamento ?? ''
    const provincia    = d.provincia ?? domicilio.provincia ?? ''
    const distrito     = d.distrito ?? domicilio.distrito ?? ''
    const direccion    = domicilio.direccion ?? d.direccion ?? ''

    if (!nombres && !paterno) return { error: 'not_found' }

    return {
      ok: true,
      nombres,
      apellidos: [paterno, materno].filter(Boolean).join(' '),
      departamento,
      provincia,
      distrito,
      direccion,
    }
  } catch {
    return { error: 'server' }
  }
}

export async function registrarParticipante(formData) {
  // Honeypot — bots fill this field, humans never do
  if (formData.get('website')) return { errors: { _: 'Solicitud inválida.' } }

  const nombres    = formData.get('nombres')?.trim()    ?? ''
  const apellidos  = formData.get('apellidos')?.trim()  ?? ''
  const whatsapp   = (formData.get('whatsapp') ?? '').replace(/\D/g, '').slice(0, 15)
  const sorteoId   = formData.get('sorteo_id')
  const terminos   = formData.get('terminos')
  const comprobante = formData.get('comprobante')
  const dni         = formData.get('dni')?.replace(/\D/g, '').slice(0, 8) || null
  const departamento = formData.get('departamento')?.trim() || null
  const provincia   = formData.get('provincia')?.trim() || null
  const distrito    = formData.get('distrito')?.trim() || null
  const direccion   = formData.get('direccion')?.trim() || null

  const errors = {}
  if (!nombres   || nombres.length < 2)   errors.nombres    = 'Ingresa tu nombre (mínimo 2 caracteres).'
  if (!apellidos || apellidos.length < 2)  errors.apellidos  = 'Ingresa tus apellidos.'
  if (!whatsapp  || whatsapp.length < 9)   errors.whatsapp   = 'Ingresa un número de WhatsApp válido (9 dígitos).'
  if (!terminos  || terminos === 'false')   errors.terminos   = 'Debes aceptar los términos y condiciones.'
  if (!comprobante || !(comprobante instanceof Blob) || comprobante.size === 0) {
    errors.comprobante = 'Sube la foto de tu comprobante de pago.'
  } else if (!comprobante.type.startsWith('image/')) {
    errors.comprobante = 'El archivo debe ser una imagen (JPG, PNG, WEBP).'
  } else if (comprobante.size > 10 * 1024 * 1024) {
    errors.comprobante = 'La imagen no puede superar los 10 MB.'
  }
  if (Object.keys(errors).length) return { errors }

  const supabase = createAdminClient()

  // Rate limiting via DB: ≤5 registros por whatsapp+sorteo en los últimos 60 segundos
  const hace60s = new Date(Date.now() - 60_000).toISOString()
  const { count: recientes } = await supabase
    .from('participantes')
    .select('id', { count: 'exact', head: true })
    .eq('whatsapp', whatsapp)
    .eq('sorteo_id', sorteoId)
    .gte('created_at', hace60s)

  if ((recientes ?? 0) >= 5) {
    return { errors: { _: 'Demasiados intentos en poco tiempo. Espera un momento e inténtalo de nuevo.' } }
  }

  // Duplicate check: mismo whatsapp + mismo sorteo + estado activo
  const { count: duplicado } = await supabase
    .from('participantes')
    .select('id', { count: 'exact', head: true })
    .eq('whatsapp', whatsapp)
    .eq('sorteo_id', sorteoId)
    .in('estado', ['pendiente', 'confirmado'])

  if ((duplicado ?? 0) > 0) {
    return { errors: { whatsapp: 'Ya tienes una participación registrada en este sorteo con este número de WhatsApp.' } }
  }

  // Upload comprobante al bucket "comprobantes"
  const ext = (comprobante.name || 'jpg').split('.').pop().toLowerCase()
  const filePath = `${sorteoId}/${Date.now()}_${whatsapp}.${ext}`
  const buffer = await comprobante.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('comprobantes')
    .upload(filePath, buffer, { contentType: comprobante.type })

  if (uploadError) {
    return { errors: { comprobante: `Error al subir la imagen: ${uploadError.message}` } }
  }

  // Insert participante
  const { error: insertError } = await supabase.from('participantes').insert({
    nombres,
    apellidos,
    whatsapp,
    sorteo_id: sorteoId,
    comprobante_path: filePath,
    estado: 'pendiente',
    dni,
    departamento,
    provincia,
    distrito,
    direccion,
  })

  if (insertError) {
    await supabase.storage.from('comprobantes').remove([filePath])
    return { errors: { _: `Error al registrar: ${insertError.message}` } }
  }

  revalidatePath('/dashboard/participantes')
  return { ok: true }
}

export async function confirmarParticipante(id) {
  const supabase = createAdminClient()

  const { data: participante } = await supabase
    .from('participantes')
    .select('id, estado, sorteo_id')
    .eq('id', id)
    .single()

  if (!participante || participante.estado !== 'pendiente') {
    redirect(`/dashboard/participantes/${id}?error=Solo se pueden confirmar participantes pendientes`)
  }

  const { data: ultimo } = await supabase
    .from('participantes')
    .select('numero_registro')
    .eq('sorteo_id', participante.sorteo_id)
    .not('numero_registro', 'is', null)
    .order('numero_registro', { ascending: false })
    .limit(1)
    .maybeSingle()

  const n = ultimo?.numero_registro ? parseInt(ultimo.numero_registro.slice(1)) + 1 : 1
  const numero_registro = '#' + String(n).padStart(4, '0')

  await supabase.from('participantes').update({
    estado: 'confirmado',
    numero_registro,
  }).eq('id', id)

  redirect(`/dashboard/participantes?success=Participante confirmado con número ${numero_registro}`)
}

export async function rechazarParticipante(id, nota_interna) {
  if (!nota_interna?.trim()) {
    return { errors: { nota_interna: 'El motivo del rechazo es requerido' } }
  }

  const supabase = createAdminClient()

  const { data: participante } = await supabase
    .from('participantes')
    .select('id, estado')
    .eq('id', id)
    .single()

  if (!participante || participante.estado !== 'pendiente') {
    redirect(`/dashboard/participantes/${id}?error=Solo se pueden rechazar participantes pendientes`)
  }

  await supabase.from('participantes').update({
    estado: 'rechazado',
    nota_interna: nota_interna.trim(),
  }).eq('id', id)

  redirect('/dashboard/participantes?success=Participante rechazado')
}
