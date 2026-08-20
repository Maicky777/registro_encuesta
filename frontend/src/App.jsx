import { useState, useEffect, Suspense, lazy } from 'react'
import Login from './Login'
import CambiarPasswordModal from './components/CambiarPasswordModal'
import UserMenu from './components/UserMenu'
import { logout as apiLogout, getMe } from './services/authService'

const FormularioBoleta = lazy(() => import('./components/FormularioBoleta'))
const GestionUsuarios = lazy(() => import('./components/GestionUsuarios'))
const GestionBrigadas = lazy(() => import('./components/GestionBrigadas'))
const GestionEncuestadores = lazy(() => import('./components/GestionEncuestadores'))
const AsignacionBrigadas = lazy(() => import('./components/AsignacionBrigadas'))
const ReporteAsistencia = lazy(() => import('./components/ReporteAsistencia'))
const DiagramaIncidencias = lazy(() => import('./components/DiagramaIncidencias'))
const GestionContraseñas = lazy(() => import('./components/GestionContraseñas'))

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState('boletas')
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [loginNotice, setLoginNotice] = useState(null)

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

  const handlePasswordChanged = () => {
    setShowPasswordModal(false)
    setLoginNotice('Contraseña actualizada correctamente. Por favor inicie sesión nuevamente.')
    handleLogout()
  }

  const adminTabs = [
    { key: 'boletas', label: 'Boletas' },
    { key: 'usuarios', label: 'Gestion de Usuarios' },
    { key: 'brigadas', label: 'Brigadas' },
    { key: 'encuestadores', label: 'Encuestadores' },
    { key: 'asignacion', label: 'Asignacion Brigadas' },
    { key: 'asistencia', label: 'Reporte de Asistencia' },
    { key: 'incidencias', label: 'Diagrama de Incidencias' },
    { key: 'contraseñas', label: 'Reset de Contraseñas' },
  ]

  const userTabs = [
    { key: 'boletas', label: 'Boletas' },
    { key: 'brigadas', label: 'Mis Brigadas' },
    { key: 'asistencia', label: 'Reporte de Asistencia' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-300 font-medium">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {!currentUser ? (
        <Login
          notice={loginNotice}
          onLogin={(user) => { setCurrentUser(user); setActiveTab('boletas'); setLoginNotice(null) }}
        />
      ) : (
        <div>
          <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-3 px-6 shadow-lg shadow-slate-900/30 border-b border-slate-700/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                  <span className="text-[0.8rem] text-slate-300">
                    <strong className="text-emerald-300">{Array.isArray(currentUser.departamento) ? currentUser.departamento.join(', ') : currentUser.departamento}</strong>
                  </span>
                </div>
              </div>
              <UserMenu
                username={currentUser.user}
                rol={currentUser.rol}
                onChangePassword={() => setShowPasswordModal(true)}
                onLogout={handleLogout}
              />
            </div>

            {currentUser.rol === 'administrador' && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-700/50">
                {adminTabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`px-4 py-1.5 rounded-lg text-[0.75rem] font-semibold cursor-pointer transition-all duration-200 border ${
                      activeTab === tab.key
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-indigo-400/50 shadow-md shadow-indigo-500/25'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-700/60 hover:text-slate-200'
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            {currentUser.rol !== 'administrador' && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-700/50">
                {userTabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`px-4 py-1.5 rounded-lg text-[0.75rem] font-semibold cursor-pointer transition-all duration-200 border ${
                      activeTab === tab.key
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-indigo-400/50 shadow-md shadow-indigo-500/25'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-700/60 hover:text-slate-200'
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </header>

          <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400"><div className="flex items-center gap-3"><div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /><span className="text-sm font-medium">Cargando...</span></div></div>}>
            {activeTab === 'boletas' && <FormularioBoleta sessionUser={currentUser} />}
            {activeTab === 'usuarios' && currentUser.rol === 'administrador' && <GestionUsuarios currentUserId={currentUser.id} />}
            {activeTab === 'brigadas' && <GestionBrigadas sessionUser={currentUser} />}
            {activeTab === 'encuestadores' && currentUser.rol === 'administrador' && <GestionEncuestadores />}
            {activeTab === 'asignacion' && currentUser.rol === 'administrador' && <AsignacionBrigadas />}
            {activeTab === 'asistencia' && <ReporteAsistencia sessionUser={currentUser} />}
            {activeTab === 'incidencias' && currentUser.rol === 'administrador' && (
              <DiagramaIncidencias sessionUser={currentUser} />
            )}
            {activeTab === 'contraseñas' && currentUser.rol === 'administrador' && (
              <GestionContraseñas currentUserId={currentUser.id} />
            )}
          </Suspense>
        </div>
      )}
      <CambiarPasswordModal
        show={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onPasswordChanged={handlePasswordChanged}
      />
    </div>
  )
}
