import { useState } from 'react'
import { resetPassword } from '../../services/authService'
import ModalAlert from '../ui/ModalAlert'

const inputClass = 'w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15'

function generarAleatoria(longitud = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*'
  const bytes = new Uint8Array(longitud)
  crypto.getRandomValues(bytes)
  let password = ''
  for (let i = 0; i < longitud; i++) {
    password += chars[bytes[i] % chars.length]
  }
  return password
}

export default function ModalResetPassword({ user, onClose, onResetSuccess }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [alertModal, setAlertModal] = useState({ show: false, message: '', type: 'info' })

  if (!user) return null

  const showAlert = (message, type = 'info') => setAlertModal({ show: true, message, type })

  const handleGenerar = () => {
    const nueva = generarAleatoria()
    setPassword(nueva)
    setConfirmPassword(nueva)
    showAlert('Contraseña aleatoria generada. Puede modificarla antes de guardar.', 'info')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (password.length < 6) {
      showAlert('La contraseña debe tener al menos 6 caracteres.', 'warning')
      return
    }
    if (password !== confirmPassword) {
      showAlert('Las contraseñas no coinciden.', 'warning')
      return
    }

    setSubmitting(true)
    try {
      const data = await resetPassword(user.id, password)
      setPassword('')
      setConfirmPassword('')
      if (onResetSuccess) onResetSuccess(data)
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al restablecer la contraseña'
      showAlert(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-[420px] w-[90%] shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-800">
          Resetear Contraseña
        </h2>
        <p className="text-[0.82rem] text-slate-500 mb-4">
          Usuario: <strong className="text-slate-800">{user.username}</strong>
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="rp-password">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="rp-password"
                  className={`${inputClass} pr-16`}
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[0.7rem] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer bg-transparent border-none"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="rp-confirmar">
                Confirmar contraseña
              </label>
              <input
                id="rp-confirmar"
                className={inputClass}
                type={showPassword ? 'text' : 'password'}
                minLength={6}
                required
                autoComplete="new-password"
                placeholder="Repita la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="self-start bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded text-[0.78rem] font-semibold cursor-pointer hover:bg-amber-100 transition-colors"
              onClick={handleGenerar}
              disabled={submitting}
            >
              Generar aleatoria
            </button>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              type="submit"
              className="flex-1 py-2.5 border-none rounded-md bg-slate-900 text-white text-[0.9rem] font-semibold cursor-pointer hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              className="flex-1 py-2.5 border border-slate-300 rounded-md bg-white text-slate-600 text-[0.9rem] font-semibold cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <ModalAlert
        show={alertModal.show}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ show: false, message: '', type: 'info' })}
      />
    </div>
  )
}
