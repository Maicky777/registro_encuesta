import { useState, useEffect, Suspense, lazy } from 'react'
import Login from './Login'
import { logout as apiLogout, getMe } from './services/authService'

const FormularioBoleta = lazy(() => import('./components/FormularioBoleta'))
const GestionUsuarios = lazy(() => import('./components/GestionUsuarios'))
const GestionBrigadas = lazy(() => import('./components/GestionBrigadas'))
const GestionEncuestadores = lazy(() => import('./components/GestionEncuestadores'))
const AsignacionBrigadas = lazy(() => import('./components/AsignacionBrigadas'))
const ReporteAsistencia = lazy(() => import('./components/ReporteAsistencia'))
const DiagramaIncidencias = lazy(() => import('./components/DiagramaIncidencias'))

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState('boletas')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getMe()
        setCurrentUser({
          id: user.id,
          user: user.username,
          departamento: user.departamento,
          brigadas: user.brigadas,
          rol: user.rol,
        })
      } catch {
        setCurrentUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      await apiLogout()
    } catch {
      // Ignore logout errors
    }
    setCurrentUser(null)
  }

  const adminTabs = [
    { key: 'boletas', label: 'Boletas' },
    { key: 'usuarios', label: 'Gestion de Usuarios' },
    { key: 'brigadas', label: 'Brigadas' },
    { key: 'encuestadores', label: 'Encuestadores' },
    { key: 'asignacion', label: 'Asignacion Brigadas' },
    { key: 'asistencia', label: 'Reporte de Asistencia' },
    { key: 'incidencias', label: 'Diagrama de Incidencias' },
  ]

  const userTabs = [
    { key: 'boletas', label: 'Boletas' },
    { key: 'brigadas', label: 'Mis Brigadas' },
    { key: 'asistencia', label: 'Reporte de Asistencia' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        Cargando...
      </div>
    )
  }

  return (
    <div>
      {!currentUser ? (
        <Login onLogin={(user) => { setCurrentUser(user); setActiveTab('boletas') }} />
      ) : (
        <div>
          <header className="bg-slate-900 text-white py-3 px-6 shadow-md">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-200">
                Usuario: <strong className="text-sky-400">{currentUser.user}</strong> | Rol:{' '}
                <strong className="text-sky-400">{currentUser.rol === 'administrador' ? 'Administrador' : 'Usuario'}</strong> | Asignación:{' '}
                <strong className="text-sky-400">{currentUser.departamento}</strong>
              </span>
              <button
                className="bg-slate-800 text-white border border-slate-700 px-3 py-1 rounded text-xs font-semibold cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </button>
            </div>

            {currentUser.rol === 'administrador' && (
              <div className="flex flex-wrap gap-2 mt-3">
                {adminTabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`px-4 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors border-none ${
                      activeTab === tab.key
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            {currentUser.rol !== 'administrador' && (
              <div className="flex flex-wrap gap-2 mt-3">
                {userTabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`px-4 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors border-none ${
                      activeTab === tab.key
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </header>

          <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400">Cargando...</div>}>
            {activeTab === 'boletas' && <FormularioBoleta sessionUser={currentUser} />}
            {activeTab === 'usuarios' && currentUser.rol === 'administrador' && <GestionUsuarios currentUserId={currentUser.id} />}
            {activeTab === 'brigadas' && <GestionBrigadas sessionUser={currentUser} />}
            {activeTab === 'encuestadores' && currentUser.rol === 'administrador' && <GestionEncuestadores />}
            {activeTab === 'asignacion' && currentUser.rol === 'administrador' && <AsignacionBrigadas />}
            {activeTab === 'asistencia' && <ReporteAsistencia sessionUser={currentUser} />}
            {activeTab === 'incidencias' && currentUser.rol === 'administrador' && (
              <DiagramaIncidencias sessionUser={currentUser} />
            )}
          </Suspense>
        </div>
      )}
    </div>
  )
}
