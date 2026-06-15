'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import {
  createPremio, updatePremio, deletePremio, togglePremioVisible, reordenarPremios,
} from '@/app/actions/premios'

export default function PremiosClient({ sorteo, premios: premiosInit }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [premios, setPremios] = useState(premiosInit)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setPremios(premiosInit) }, [premiosInit])
  useEffect(() => { setMounted(true) }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIdx = premios.findIndex((p) => p.id === active.id)
    const newIdx = premios.findIndex((p) => p.id === over.id)
    const newList = arrayMove(premios, oldIdx, newIdx)
    setPremios(newList)
    startTransition(async () => {
      await reordenarPremios(sorteo.id, newList.map((p) => p.id))
      router.refresh()
    })
  }

  function handleToggleVisible(p) {
    startTransition(async () => {
      await togglePremioVisible(p.id, sorteo.id, p.visible)
      router.refresh()
    })
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    startTransition(async () => {
      await deletePremio(target.id, sorteo.id)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/sorteos"
            className="mb-1 flex items-center gap-1 text-sm text-muted transition hover:text-cream"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Sorteos
          </Link>
          <h1 className="font-display text-4xl tracking-wide text-cream">PREMIOS</h1>
          <p className="mt-0.5 text-sm text-muted">{sorteo.nombre}</p>
        </div>
        <button
          type="button"
          onClick={() => setModal('create')}
          className="flex items-center gap-2 bg-gold px-4 py-2 text-sm font-bold uppercase tracking-wider text-bg transition hover:bg-gold-light"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Agregar premio
        </button>
      </div>

      {/* Lista */}
      {premios.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-gold/10 bg-surface px-6 py-16 text-center">
          <svg className="size-12 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m-5-8H5a2 2 0 01-2-2V7h18v4a2 2 0 01-2 2h-2m-8 0h8m-8 0a5 5 0 0010 0" />
          </svg>
          <p className="text-sm font-medium text-muted">No hay premios aún</p>
          <p className="text-xs text-muted/60">Agrega el primero con el botón de arriba</p>
        </div>
      ) : (
        <>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Arrastra el handle para reordenar
          </p>
          {mounted ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={premios.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {premios.map((p, i) => (
                    <SortableCard
                      key={p.id}
                      premio={p}
                      posicion={i + 1}
                      onEdit={() => setModal(p)}
                      onDelete={() => setDeleteTarget(p)}
                      onToggleVisible={() => handleToggleVisible(p)}
                      disabled={isPending}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="space-y-2">
              {premios.map((p, i) => (
                <SortableCard
                  key={p.id}
                  premio={p}
                  posicion={i + 1}
                  onEdit={() => setModal(p)}
                  onDelete={() => setDeleteTarget(p)}
                  onToggleVisible={() => handleToggleVisible(p)}
                  disabled={isPending}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal create/edit */}
      <AnimatePresence>
        {modal !== null && (
          <PremioModal
            sorteoId={sorteo.id}
            premio={modal === 'create' ? null : modal}
            onClose={() => setModal(null)}
            onSuccess={() => { setModal(null); router.refresh() }}
          />
        )}
      </AnimatePresence>

      {/* Modal eliminar */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              className="relative w-full max-w-sm border border-danger/30 bg-surface p-6 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.2 }}
            >
              <h3 className="text-base font-semibold text-content">¿Eliminar premio?</h3>
              <p className="mt-2 text-sm text-muted">
                Se eliminará permanentemente{' '}
                <strong className="text-content">{deleteTarget.nombre}</strong>.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="border border-gold/20 px-4 py-2 text-sm text-muted transition hover:text-cream"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isPending}
                  className="bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:bg-danger-dark disabled:opacity-60"
                >
                  Sí, eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sortable Card ────────────────────────────────────────────────────────────

function SortableCard({ premio, posicion, onEdit, onDelete, onToggleVisible, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: premio.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 10 : 'auto' }}
      className={[
        'flex items-center gap-3 border border-gold/20 bg-surface px-3 py-3 transition-all duration-150',
        isDragging ? 'border-gold/50 opacity-90 shadow-2xl shadow-black/50' : 'hover:border-gold/40',
      ].join(' ')}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex shrink-0 cursor-grab touch-none items-center justify-center rounded p-2 text-gold/30 transition hover:bg-gold/10 hover:text-gold/70 active:cursor-grabbing"
        title="Arrastrar para reordenar"
      >
        <svg className="size-5" fill="currentColor" viewBox="0 0 16 16">
          <circle cx="5" cy="4" r="1.3" /><circle cx="11" cy="4" r="1.3" />
          <circle cx="5" cy="8" r="1.3" /><circle cx="11" cy="8" r="1.3" />
          <circle cx="5" cy="12" r="1.3" /><circle cx="11" cy="12" r="1.3" />
        </svg>
      </button>

      <span className="w-5 shrink-0 text-center text-xs text-muted/40">{posicion}</span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-cream">{premio.nombre}</p>
        <p className="text-xs text-muted">
          ×{premio.cantidad}
          {premio.monto != null
            ? ` · S/ ${Number(premio.monto).toFixed(2)}`
            : premio.descripcion_premio
            ? ` · ${premio.descripcion_premio}`
            : ''}
        </p>
      </div>

      <button
        type="button"
        onClick={onToggleVisible}
        disabled={disabled}
        className="flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition duration-150 disabled:opacity-50"
        style={premio.visible
          ? { borderColor: 'rgba(39,174,96,0.35)', color: '#27AE60', background: 'rgba(39,174,96,0.08)' }
          : { borderColor: 'rgba(136,136,136,0.2)', color: '#888', background: 'rgba(36,36,36,0.8)' }}
      >
        <span className={`size-2 rounded-full ${premio.visible ? 'bg-success' : 'bg-muted/40'}`} />
        {premio.visible ? 'Visible' : 'Oculto'}
      </button>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="border border-gold/30 px-2.5 py-1 text-xs font-medium text-muted transition hover:border-gold hover:text-cream"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="border border-danger/30 bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger transition hover:bg-danger hover:text-white"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

// ─── Modal Premio ─────────────────────────────────────────────────────────────

function PremioModal({ sorteoId, premio, onClose, onSuccess }) {
  const isEditing = !!premio
  const overlayRef = useRef(null)
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState({})
  const [nombre, setNombre] = useState(premio?.nombre ?? '')
  const [cantidad, setCantidad] = useState(String(premio?.cantidad ?? 1))
  const [monto, setMonto] = useState(premio?.monto != null ? String(premio.monto) : '')
  const [descripcion, setDescripcion] = useState(premio?.descripcion_premio ?? '')
  const [visible, setVisible] = useState(premio?.visible ?? true)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    const data = { nombre, cantidad, monto, descripcion_premio: descripcion, visible }
    startTransition(async () => {
      const result = isEditing
        ? await updatePremio(premio.id, sorteoId, data)
        : await createPremio(sorteoId, data)
      if (result?.errors) { setErrors(result.errors); return }
      onSuccess()
    })
  }

  return (
    <motion.div
      ref={overlayRef}
      className="fixed inset-0 z-40 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <motion.div
        className="w-full max-w-md border border-gold/20 bg-surface p-6 shadow-2xl"
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-5 font-display text-2xl text-cream">
          {isEditing ? 'EDITAR PREMIO' : 'NUEVO PREMIO'}
        </h2>

        {errors._ && (
          <p className="mb-4 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {errors._}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <MField label="Nombre" error={errors.nombre}>
            <input
              type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
              maxLength={100} autoFocus className={iCls(errors.nombre)}
            />
          </MField>

          <MField label="Cantidad" error={errors.cantidad}>
            <input
              type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
              className={iCls(errors.cantidad)}
            />
          </MField>

          <MField label="Monto S/ (opcional)" error={errors.monto}>
            <input
              type="number" min="0" step="0.01" value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00" className={iCls(errors.monto)}
            />
          </MField>

          <MField label="Descripción (si no hay monto)" error={errors.descripcion_premio}>
            <input
              type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              maxLength={200} placeholder="Ej. Canasta navideña" className={iCls(errors.descripcion_premio)}
            />
          </MField>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)}
              className="size-4 accent-gold"
            />
            <span className="text-sm text-muted">Visible en la página pública</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="border border-gold/30 px-4 py-2 text-sm font-medium text-muted transition hover:border-gold hover:text-cream"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={isPending}
              className="bg-gold px-5 py-2 text-sm font-bold uppercase tracking-wider text-bg transition hover:bg-gold-light disabled:opacity-50"
            >
              {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function MField({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-medium uppercase tracking-widest text-muted">{label}</label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

function iCls(error) {
  return [
    'w-full border bg-surface2 px-3 py-2.5 text-sm text-cream placeholder-muted outline-none transition-colors',
    error ? 'border-danger' : 'border-gold/20 focus:border-gold',
  ].join(' ')
}
