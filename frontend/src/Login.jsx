import { useState } from 'react'
import { login, saveToken } from './services/authService'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [alertModal, setAlertModal] = useState({ show: false, message: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const data = await login(username, password)
      saveToken(data.token)
      onLogin({
        user: data.user.username,
        departamento: data.user.departamento,
        brigadas: data.user.brigadas,
        rol: data.user.rol,
      })
    } catch (err) {
      const message = err.response?.data?.error || 'Error al conectar con el servidor'
      setAlertModal({ show: true, message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2
          className="card-title"
          style={{ textAlign: 'center', justifyContent: 'center' }}
        >
          Monitoreo & Encuestas
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="inicio-usuario">Usuario</label>
            <input
              id="inicio-usuario"
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. mcayo"
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="inicio-password">Contraseña</label>
            <input
              id="inicio-password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-submit"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>

      {alertModal.show && (
        <div className="modal-overlay" onClick={() => setAlertModal({ show: false, message: '' })}>
          <div className="modal-content alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="alert-icon alert-icon-error">✕</div>
            <p className="alert-message">{alertModal.message}</p>
            <button
              className="btn-alert-error"
              onClick={() => setAlertModal({ show: false, message: '' })}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
