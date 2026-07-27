import  { useState } from 'react'
import { register } from '../../services/authService'

const DEPARTAMENTOS = [
  'BENI',
  'CHUQUISACA',
  'COCHABAMBA',
  'LA PAZ',
  'ORURO',
  'PANDO',
  'POTOSÍ',
  'SANTA CRUZ',
  'TARIJA',
]

const BRIGADAS_DISPONIBLES = [
  'Brigada 1',
  'Brigada 2',
  'Brigada 3',
  'Brigada 4',
  'Brigada 5',
  'Brigada 6',
  'Brigada 7',
  'Brigada 8',
  'Brigada 9',
]

const inputClass = 'w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed'

const INITIAL_STATE = {
  username: '',
  password: '',
  departamento: '',
  brigadas: [],
  rol: 'usuarios',
}

export default function FormularioUsuario({ onUsuarioCreado, showAlert }) {
  const [formData, setFormData] = useState(INITIAL_STATE)
  const [submitting, setSubmitting] = useState(false)

  const toggleBrigada = (brigada) => {
    setFormData((prev) => {
      const existe = prev.brigadas.includes(brigada)
      return {
        ...prev,
        brigadas: existe
          ? prev.brigadas.filter((b) => b !== brigada)
          : [...prev.brigadas, brigada],
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (formData.brigadas.length === 0) {
      showAlert('Debe seleccionar al menos una brigada.', 'warning')
      return
    }

    if (formData.password.length < 6) {
      showAlert('La contraseña debe tener al menos 6 caracteres.', 'warning')
      return
    }

    if (formData.username.trim().length < 3) {
      showAlert('El nombre de usuario debe tener al menos 3 caracteres.', 'warning')
      return
    }

    setSubmitting(true)
    try {
      await register(formData)
      showAlert(`Usuario "${formData.username}" creado correctamente.`, 'success')
      setFormData(INITIAL_STATE)
      if (onUsuarioCreado) onUsuarioCreado()
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al crear el usuario'
      showAlert(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto my-5 bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-800">
        Registrar Nuevo Usuario
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="usr-username">
              Usuario
            </label>
            <input
              id="usr-username"
              className={inputClass}
              type="text"
              minLength={3}
              maxLength={30}
              required
              placeholder="Ej. mcayo"
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value.trim() }))}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="usr-password">
              Contraseña
            </label>
            <input
              id="usr-password"
              className={inputClass}
              type="password"
              minLength={6}
              required
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="usr-departamento">
              Departamento
            </label>
            <select
              id="usr-departamento"
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

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="usr-rol">
              Rol
            </label>
            <select
              id="usr-rol"
              className={inputClass}
              required
              value={formData.rol}
              onChange={(e) => setFormData((prev) => ({ ...prev, rol: e.target.value }))}
            >
              <option value="usuarios">Usuario</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          <div className="flex flex-col col-span-full">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest">
              Brigadas Asignadas
            </label>
            <div className="flex flex-wrap gap-3 mt-1">
              {BRIGADAS_DISPONIBLES.map((brigada) => (
                <label
                  key={brigada}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer text-[0.82rem] font-medium transition-colors ${
                    formData.brigadas.includes(brigada)
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.brigadas.includes(brigada)}
                    onChange={() => toggleBrigada(brigada)}
                  />
                  {brigada}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-5 mt-5 justify-center">
          <button
            type="submit"
            className="bg-slate-900 text-white border-none px-4 py-2 rounded font-semibold cursor-pointer text-xs w-[30%] hover:bg-slate-700 transition-colors"
            disabled={submitting}
          >
            {submitting ? 'Creando...' : 'Crear Usuario'}
          </button>
          <button
            type="button"
            className="bg-slate-500 text-white border-none px-4 py-2 rounded cursor-pointer text-xs w-[30%] hover:bg-slate-600 transition-colors"
            onClick={() => setFormData(INITIAL_STATE)}
            disabled={submitting}
          >
            Limpiar Campos
          </button>
        </div>
      </form>
    </div>
  )
}
