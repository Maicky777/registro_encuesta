import { useState } from 'react'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username.toLowerCase() === 'mcayo') {
      onLogin({
        user: 'mcayo',
        departamento: 'SANTA CRUZ',
        brigadas: ['Brigada 1', 'Brigada 2', 'Brigada 7'],
      })
    } else {
      alert('Usuario no reconocido. Utilice "mcayo"')
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
            <label>Usuario</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. mcayo"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-submit"
            style={{ width: '100%' }}
          >
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  )
}
