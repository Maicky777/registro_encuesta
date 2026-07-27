import { useState, useEffect } from 'react'
import { createBrigada, updateBrigada } from '../../services/brigadaService'

const DEPARTAMENTOS = [
  'BENI', 'CHUQUISACA', 'COCHABAMBA', 'LA PAZ', 'ORURO', 'PANDO', 'POTOSÍ', 'SANTA CRUZ', 'TARIJA',
]

const inputClass = 'w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15'

const INITIAL_STATE = {
  nombre: '',
  departamento: 'SANTA CRUZ',
}

export default function FormularioBrigada({ onBrigadaCreada, onBrigadaEditada, brigadaEditando, onCancelarEdicion, showAlert }) {
  const [formData, setFormData] = useState(INITIAL_STATE)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (brigadaEditando) {
      setFormData({
        nombre: brigadaEditando.nombre,
        departamento: brigadaEditando.departamento,
      })
    } else {
      setFormData(INITIAL_STATE)
    }
  }, [brigadaEditando])

  const esEdicion = !!brigadaEditando

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (!formData.nombre.trim()) {
      showAlert('El nombre de la brigada es requerido.', 'warning')
      return
    }

    setSubmitting(true)
    try {
      if (esEdicion) {
        await updateBrigada(brigadaEditando.id, formData)
        showAlert(`Brigada "${formData.nombre}" actualizada correctamente.`, 'success')
        if (onBrigadaEditada) onBrigadaEditada()
      } else {
        await createBrigada(formData)
        showAlert(`Brigada "${formData.nombre}" creada correctamente.`, 'success')
        setFormData(INITIAL_STATE)
        if (onBrigadaCreada) onBrigadaCreada()
      }
    } catch (err) {
      const msg = err.response?.data?.error || `Error al ${esEdicion ? 'actualizar' : 'crear'} la brigada`
      showAlert(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelar = () => {
    setFormData(INITIAL_STATE)
    if (onCancelarEdicion) onCancelarEdicion()
  }

  return (
    <div className="max-w-6xl mx-auto my-5 bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-800">
        {esEdicion ? 'Editar Brigada' : 'Crear Nueva Brigada'}
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="brig-nombre">
              Nombre de Brigada
            </label>
            <input
              id="brig-nombre"
              className={inputClass}
              type="text"
              required
              placeholder="Ej. Brigada 10"
              value={formData.nombre}
              onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="brig-departamento">
              Departamento
            </label>
            <select
              id="brig-departamento"
              className={inputClass}
              required
              value={formData.departamento}
              onChange={(e) => setFormData((prev) => ({ ...prev, departamento: e.target.value }))}
            >
              {DEPARTAMENTOS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-5 mt-5 justify-center">
          <button
            type="submit"
            className="bg-slate-900 text-white border-none px-4 py-2 rounded font-semibold cursor-pointer text-xs w-[30%] hover:bg-slate-700 transition-colors"
            disabled={submitting}
          >
            {submitting
              ? (esEdicion ? 'Guardando...' : 'Creando...')
              : (esEdicion ? 'Guardar Cambios' : 'Crear Brigada')}
          </button>
          <button
            type="button"
            className="bg-slate-500 text-white border-none px-4 py-2 rounded cursor-pointer text-xs w-[30%] hover:bg-slate-600 transition-colors"
            onClick={esEdicion ? handleCancelar : () => setFormData(INITIAL_STATE)}
            disabled={submitting}
          >
            {esEdicion ? 'Cancelar' : 'Limpiar Campos'}
          </button>
        </div>
      </form>
    </div>
  )
}
