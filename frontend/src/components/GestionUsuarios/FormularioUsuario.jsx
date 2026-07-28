import { useState, useEffect } from 'react'
import { register, updateUser } from '../../services/authService'
import { getDepartamentos, getBrigadas } from '../../services/brigadaService'

const inputClass = 'w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed'

const INITIAL_STATE = {
  username: '',
  password: '',
  departamento: '',
  brigadas: [],
  rol: 'usuarios',
}

export default function FormularioUsuario({ onUsuarioCreado, showAlert, usuarioEditar, onCancelarEdicion }) {
  const [formData, setFormData] = useState(INITIAL_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [departamentos, setDepartamentos] = useState([])
  const [brigadasDisponibles, setBrigadasDisponibles] = useState([])

  const editando = !!usuarioEditar

  useEffect(() => {
    if (usuarioEditar) {
      setFormData({
        username: usuarioEditar.username,
        password: '',
        departamento: usuarioEditar.departamento || '',
        brigadas: usuarioEditar.brigadas || [],
        rol: usuarioEditar.rol || 'usuarios',
      })
    } else {
      setFormData(INITIAL_STATE)
    }
  }, [usuarioEditar])

  useEffect(() => {
    getDepartamentos()
      .then(setDepartamentos)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!formData.departamento) {
      setBrigadasDisponibles([])
      return
    }
    if (!editando) {
      setFormData((prev) => ({ ...prev, brigadas: [] }))
    }
    getBrigadas(formData.departamento)
      .then((data) => setBrigadasDisponibles(data.map((b) => b.nombre)))
      .catch(() => setBrigadasDisponibles([]))
  }, [formData.departamento])

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

    if (formData.rol !== 'administrador' && formData.brigadas.length === 0) {
      showAlert('Debe seleccionar al menos una brigada.', 'warning')
      return
    }

    if (!editando && formData.password.length < 6) {
      showAlert('La contraseña debe tener al menos 6 caracteres.', 'warning')
      return
    }

    if (editando && formData.password && formData.password.length < 6) {
      showAlert('La contraseña debe tener al menos 6 caracteres.', 'warning')
      return
    }

    if (formData.username.trim().length < 3) {
      showAlert('El nombre de usuario debe tener al menos 3 caracteres.', 'warning')
      return
    }

    setSubmitting(true)
    try {
      if (editando) {
        const dataToSend = { ...formData }
        if (!dataToSend.password) delete dataToSend.password
        await updateUser(usuarioEditar.id, dataToSend)
        showAlert(`Usuario "${formData.username}" actualizado correctamente.`, 'success')
      } else {
        await register(formData)
        showAlert(`Usuario "${formData.username}" creado correctamente.`, 'success')
      }
      setFormData(INITIAL_STATE)
      if (onUsuarioCreado) onUsuarioCreado()
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al guardar el usuario'
      showAlert(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto my-5 bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-800 flex justify-between items-center">
        <span>
          {editando ? `Editando Usuario: ${usuarioEditar.username}` : 'Registrar Nuevo Usuario'}
        </span>
        {editando && (
          <button
            type="button"
            className="bg-slate-500 text-white border-none px-4 py-2 rounded cursor-pointer text-xs hover:bg-slate-600 transition-colors"
            onClick={onCancelarEdicion}
            disabled={submitting}
          >
            Cancelar Edición
          </button>
        )}
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
                required={!editando}
                placeholder={editando ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            />
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

          {formData.rol !== 'administrador' && (
            <>
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
                  <option value="">-- Seleccionar Departamento --</option>
                  {departamentos.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>


              <div className="flex flex-col col-span-full">
                <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest">
                  Brigadas Asignadas
                </label>
                {!formData.departamento ? (
                  <span className="text-[0.82rem] text-slate-400 mt-1">Seleccione un departamento primero</span>
                ) : brigadasDisponibles.length === 0 ? (
                  <span className="text-[0.82rem] text-slate-400 mt-1">No hay brigadas disponibles para este departamento</span>
                ) : (
                  <div className="flex flex-wrap gap-3 mt-1">
                    {brigadasDisponibles.map((brigada) => (
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
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-5 mt-5 justify-center">
          <button
            type="submit"
            className="bg-slate-900 text-white border-none px-4 py-2 rounded font-semibold cursor-pointer text-xs w-[30%] hover:bg-slate-700 transition-colors"
            disabled={submitting}
          >
            {submitting ? (editando ? 'Actualizando...' : 'Creando...') : (editando ? 'Actualizar Usuario' : 'Crear Usuario')}
          </button>
          <button
            type="button"
            className="bg-slate-500 text-white border-none px-4 py-2 rounded cursor-pointer text-xs w-[30%] hover:bg-slate-600 transition-colors"
            onClick={() => { setFormData(INITIAL_STATE); if (editando && onCancelarEdicion) onCancelarEdicion() }}
            disabled={submitting}
          >
            Limpiar Campos
          </button>
        </div>
      </form>
    </div>
  )
}
