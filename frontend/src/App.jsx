import { useState } from 'react'
import Login from './Login'
import FormularioBoleta from './FormularioBoleta'
import './App.css'

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)

  return (
    <div>
      {!currentUser ? (
        <Login onLogin={(user) => setCurrentUser(user)} />
      ) : (
        <div>
          <header className="app-header">
            <span className="user-badge">
              Usuario: <strong>{currentUser.user}</strong> | Asignación:{' '}
              <strong>{currentUser.departamento}</strong>
            </span>
            <button className="btn-logout" onClick={() => setCurrentUser(null)}>
              Cerrar Sesión
            </button>
          </header>
          <FormularioBoleta sessionUser={currentUser} />
        </div>
      )}
    </div>
  )
}
