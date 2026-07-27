import { useState, useEffect } from 'react'
import { createEncuestador, updateEncuestador } from '../../services/encuestadorService'

const inputClass = 'w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15'

const INITIAL_STATE = {
  nombre: '',
  rol: 'encuestador',
  codigo: '',
  telefono: '',
}

export default function FormularioEncuestador({ onEncuestadorCreado, onEncuestadorEditado, encuestadorEditando, onCancelarEdicion, showAlert }) {
  const [formData, setFormData] = useState(INITIAL_STATE)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (encuestadorEditando) {
      setFormData({
        nombre: encuestadorEditando.nombre,
        rol: encuestadorEditando.rol,
        codigo: encuestadorEditando.codigo,
        telefono: encuestadorEditando.telefono || '',
      })
    } else {
      setFormData(INITIAL_STATE)
    }
  }, [encuestadorEditando])

  const esEdicion = !!encuestadorEditando

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (!formData.nombre.trim()) {
      showAlert('El nombre es requerido.', 'warning')
      return
    }

    if (!formData.codigo.trim()) {
      showAlert('El código es requerido.', 'warning')
      return
    }

    setSubmitting(true)
    try {
      if (esEdicion) {
        await updateEncuestador(encuestadorEditando.id, formData)
        showAlert(`Encuestador "${formData.nombre}" actualizado correctamente.`, 'success')
        if (onEncuestadorEditado) onEncuestadorEditado()
      } else {
        await createEncuestador(formData)
        showAlert(`Encuestador "${formData.nombre}" creado correctamente.`, 'success')
        setFormData(INITIAL_STATE)
        if (onEncuestadorCreado) onEncuestadorCreado()
      }
    } catch (err) {
      const msg = err.response?.data?.error || `Error al ${esEdicion ? 'actualizar' : 'crear'} el encuestador`
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
        {esEdicion ? 'Editar Encuestador' : 'Registrar Nuevo Encuestador'}
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="enc-nombre">
              Nombre Completo
            </label>
            <input
              id="enc-nombre"
              className={inputClass}
              type="text"
              required
              placeholder="Ej. Juan Pérez"
              value={formData.nombre}
              onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="enc-rol">
              Rol
            </label>
            <select
              id="enc-rol"
              className={inputClass}
              required
              value={formData.rol}
              onChange={(e) => setFormData((prev) => ({ ...prev, rol: e.target.value }))}
            >
              <option value="encuestador">Encuestador</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="enc-codigo">
              Código de Usuario
            </label>
            <input
              id="enc-codigo"
              className={inputClass}
              type="text"
              required
              placeholder="Ej. ece70101"
              value={formData.codigo}
              onChange={(e) => setFormData((prev) => ({ ...prev, codigo: e.target.value.trim() }))}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="enc-telefono">
              Teléfono
            </label>
            <input
              id="enc-telefono"
              className={inputClass}
              type="text"
              placeholder="Ej. 70123456"
              value={formData.telefono}
              onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
            />
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
              : (esEdicion ? 'Guardar Cambios' : 'Crear Encuestador')}
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
