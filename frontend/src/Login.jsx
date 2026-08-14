import { useState, useEffect } from 'react'
import { login } from './services/authService'
import ModalAlert from './components/ui/ModalAlert'
import { useModal } from './hooks/useModal'

export default function Login({ onLogin, notice }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { alertModal, showAlert, closeAlert } = useModal()

  useEffect(() => {
    if (notice) showAlert(notice, 'success')
  }, [notice, showAlert])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await login(username, password)
      onLogin({
        id: data.user.id,
        user: data.user.username,
        departamento: data.user.departamento,
        brigadas: data.user.brigadas,
        rol: data.user.rol,
      })
    } catch (err) {
      const message = err.response?.data?.error || 'Error al conectar con el servidor'
      showAlert(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm px-8 py-8 bg-white rounded-lg shadow-xl">
        <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-800 text-center">
          Monitoreo & Encuestas
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col mb-4">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="inicio-usuario">
              Usuario
            </label>
            <input
              id="inicio-usuario"
              type="text"
              className="w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. mcayo"
              required
            />
          </div>
          <div className="flex flex-col mb-4">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="inicio-password">
              Contraseña
            </label>
            <input
              id="inicio-password"
              type="password"
              className="w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              required
            />
          </div>
          <button
            type="submit"
            className="col-span-full w-full bg-slate-900 text-white py-2.5 px-5 text-sm font-semibold border-none rounded cursor-pointer mt-2 hover:bg-slate-800 transition-colors"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>

      <ModalAlert
        show={alertModal.show}
        message={alertModal.message}
        type={alertModal.type}
        onClose={closeAlert}
      />
    </div>
  )
}
