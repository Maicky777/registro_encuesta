import { useState, useEffect, useRef } from 'react'

export default function UserMenu({ username, rol, onChangePassword, onLogout }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleSelect = (action) => {
    setOpen(false)
    action()
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center gap-2.5 bg-gradient-to-r from-slate-800 to-slate-700 text-white border border-slate-600/50 pl-1.5 pr-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer hover:from-slate-700 hover:to-slate-600 transition-all duration-200 shadow-md shadow-slate-900/30"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[0.75rem] font-bold uppercase shadow-sm shadow-indigo-500/30">
          {username.charAt(0)}
        </span>
        <span className="text-slate-200">{username}</span>
        <span className="text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
          {rol === 'administrador' ? 'Admin' : 'User'}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 min-w-[220px] bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-[50] overflow-hidden"
          role="menu"
        >
          <div className="px-4 py-2.5 border-b border-slate-100 mb-1 bg-gradient-to-r from-slate-50 to-white">
            <p className="text-[0.85rem] font-bold text-slate-800">{username}</p>
            <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">
              {rol === 'administrador' ? 'Administrador' : 'Usuario'}
            </p>
          </div>
          <button
            role="menuitem"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[0.82rem] text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors duration-150"
            onClick={() => handleSelect(onChangePassword)}
          >
            <svg
              className="w-4 h-4 text-slate-400 group-hover:text-indigo-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Cambiar Contraseña
          </button>
          <button
            role="menuitem"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[0.82rem] text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors duration-150"
            onClick={() => handleSelect(onLogout)}
          >
            <svg
              className="w-4 h-4 text-rose-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  )
}
