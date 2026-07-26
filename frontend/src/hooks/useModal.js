import { useState, useEffect, useCallback } from 'react'

export const useModal = () => {
  const [alertModal, setAlertModal] = useState({
    show: false,
    message: '',
    type: 'info',
  })
  
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    message: '',
    onConfirm: null,
  })

  const showAlert = useCallback((message, type = 'info') => {
    setAlertModal({ show: true, message, type })
  }, [])

  const closeAlert = useCallback(() => {
    setAlertModal({ show: false, message: '', type: 'info' })
  }, [])

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmModal({ show: true, message, onConfirm: resolve })
    })
  }, [])

  const confirmAction = useCallback((value) => {
    confirmModal.onConfirm?.(value)
    setConfirmModal({ show: false, message: '', onConfirm: null })
  }, [confirmModal.onConfirm])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        if (alertModal.show) {
          closeAlert()
        }
        if (confirmModal.show) {
          confirmAction(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [alertModal.show, confirmModal.show, closeAlert, confirmAction])

  return {
    alertModal,
    confirmModal,
    showAlert,
    closeAlert,
    showConfirm,
    confirmAction,
  }
}
