import { useState } from 'react'
import { changePassword } from '../services/authService'
import ModalAlert from './ui/ModalAlert'

const inputClass = 'w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15'

export default function CambiarPasswordModal({ show, onClose, onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [alertModal, setAlertModal] = useState({ show: false, message: '', type: 'info' })

  if (!show) return null

  const showAlert = (message, type = 'info') => setAlertModal({ show: true, message, type })

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (newPassword.length < 6) {
      showAlert('La nueva contraseña debe tener al menos 6 caracteres.', 'warning')
      return
    }
    if (newPassword !== confirmPassword) {
      showAlert('Las contraseñas nuevas no coinciden.', 'warning')
      return
    }

    setSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword, confirmPassword)
      resetForm()
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al cambiar la contraseña'
      showAlert(msg, 'error')
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    onClose()
    onPasswordChanged?.()
  }

  const handleClose = () => {
    if (submitting) return
    resetForm()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={handleClose}>
      <div className="bg-white rounded-lg max-w-[400px] w-[90%] shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-800">
          Cambiar Contraseña
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cp-actual">
                Contraseña actual
              </label>
              <input
                id="cp-actual"
                className={inputClass}
                type="password"
                required
                autoComplete="current-password"
                placeholder="Ingrese su contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cp-nueva">
                Nueva contraseña
              </label>
              <input
                id="cp-nueva"
                className={inputClass}
                type="password"
                minLength={6}
                required
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cp-confirmar">
                Confirmar nueva contraseña
              </label>
              <input
                id="cp-confirmar"
                className={inputClass}
                type="password"
                minLength={6}
                required
                autoComplete="new-password"
                placeholder="Repita la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
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
              onClick={handleClose}
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
