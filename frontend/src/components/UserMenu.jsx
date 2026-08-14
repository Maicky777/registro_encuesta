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
        className="flex items-center gap-2 bg-slate-800 text-white border border-slate-700 pl-1.5 pr-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-700 transition-colors"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-[0.7rem] font-bold uppercase">
          {username.charAt(0)}
        </span>
        <span>{username}</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
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
          className="absolute right-0 top-full mt-1.5 min-w-[210px] bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-[50]"
          role="menu"
        >
          <div className="px-3.5 py-2 text-[0.68rem] text-slate-500 uppercase tracking-widest border-b border-slate-100 mb-1">
            {rol === 'administrador' ? 'Administrador' : 'Usuario'}
          </div>
          <button
            role="menuitem"
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[0.82rem] text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            onClick={() => handleSelect(onChangePassword)}
          >
            <svg
              className="w-4 h-4 text-slate-500"
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
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[0.82rem] text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
            onClick={() => handleSelect(onLogout)}
          >
            <svg
              className="w-4 h-4 text-red-500"
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
