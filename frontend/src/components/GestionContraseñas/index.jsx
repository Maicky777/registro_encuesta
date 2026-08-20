import { useState, useEffect, useCallback, useMemo } from 'react'
import { getUsers } from '../../services/authService'
import { useModal } from '../../hooks/useModal'
import ModalResetPassword from './ModalResetPassword'
import ModalAlert from '../ui/ModalAlert'

const inputClass = 'w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15'

export default function GestionContraseñas({ currentUserId }) {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [usuarioReset, setUsuarioReset] = useState(null)
  const [filtro, setFiltro] = useState('')
  const [pagina, setPagina] = useState(0)
  const porPagina = 25

  const { alertModal, showAlert, closeAlert } = useModal()

  const cargarUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsuarios(data)
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al cargar usuarios'
      showAlert(msg, 'error')
    } finally {
      setLoading(false)
    }
  }, [showAlert])

  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  const usuariosFiltrados = useMemo(() => {
    if (!filtro.trim()) return usuarios
    const term = filtro.toLowerCase()
    return usuarios.filter(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        (Array.isArray(u.departamento) ? u.departamento.some((d) => d.toLowerCase().includes(term)) : u.departamento?.toLowerCase().includes(term)) ||
        u.rol.toLowerCase().includes(term),
    )
  }, [usuarios, filtro])

  const totalPaginas = Math.ceil(usuariosFiltrados.length / porPagina)
  const paginados = usuariosFiltrados.slice(pagina * porPagina, (pagina + 1) * porPagina)

  const handleFiltroChange = (val) => {
    setFiltro(val)
    setPagina(0)
  }

  const handleResetSuccess = (data) => {
    setUsuarioReset(null)
    const msg = data?.generada
      ? `Contraseña de "${data.username}" restablecida. Nueva contraseña: ${data.password}`
      : `Contraseña de "${data.username}" restablecida correctamente.`
    showAlert(msg, 'success')
  }

  return (
    <div className="max-w-6xl mx-auto my-5 bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-1 pb-2 border-b-2 border-slate-800">
        Reset de Contraseñas
      </h2>
      <p className="text-[0.82rem] text-slate-500 mb-4">
        Seleccione un usuario para restablecer su contraseña (puede escribir una nueva o generar una aleatoria).
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <input
            className={inputClass}
            type="text"
            placeholder="Buscar por usuario, departamento o rol..."
            value={filtro}
            onChange={(e) => handleFiltroChange(e.target.value)}
          />
        </div>
        <span className="text-[0.75rem] text-slate-400">
          {usuariosFiltrados.length} usuario(s)
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8 text-slate-400">
          Cargando usuarios...
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-[0.82rem] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">Usuario</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">Departamento</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">Rol</th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {paginados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  paginados.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 text-slate-500">{u.id}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {u.username}
                        {u.id === currentUserId && (
                          <span className="ml-2 text-[0.7rem] text-slate-400 italic">(Tú)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {(Array.isArray(u.departamento) ? u.departamento : [u.departamento].filter(Boolean)).join(', ')}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[0.7rem] font-bold px-2 py-0.5 rounded ${
                          u.rol === 'administrador'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {u.rol === 'administrador' ? 'Admin' : 'Usuario'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded text-[0.7rem] font-semibold cursor-pointer hover:bg-amber-100 transition-colors"
                          onClick={() => setUsuarioReset(u)}
                        >
                          Resetear Contraseña
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <span className="text-[0.75rem] text-slate-400">
                Página {pagina + 1} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                <button
                  className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded text-[0.75rem] font-medium cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => setPagina((p) => Math.max(0, p - 1))}
                  disabled={pagina === 0}
                >
                  Anterior
                </button>
                <button
                  className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded text-[0.75rem] font-medium cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                  disabled={pagina >= totalPaginas - 1}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ModalResetPassword
        user={usuarioReset}
        onClose={() => setUsuarioReset(null)}
        onResetSuccess={handleResetSuccess}
      />

      <ModalAlert
        show={alertModal.show}
        message={alertModal.message}
        type={alertModal.type}
        onClose={closeAlert}
      />
    </div>
  )
}
