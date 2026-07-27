import { useState, useEffect, useCallback, useRef } from 'react'

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

  const confirmResolveRef = useRef(null)

  const showAlert = useCallback((message, type = 'info') => {
    setAlertModal({ show: true, message, type })
  }, [])

  const closeAlert = useCallback(() => {
    setAlertModal({ show: false, message: '', type: 'info' })
  }, [])

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve
      setConfirmModal({ show: true, message, onConfirm: resolve })
    })
  }, [])

  const confirmAction = useCallback((value) => {
    confirmResolveRef.current?.(value)
    confirmResolveRef.current = null
    setConfirmModal({ show: false, message: '', onConfirm: null })
  }, [])

  useEffect(() => {
    return () => {
      if (confirmResolveRef.current) {
        confirmResolveRef.current(false)
        confirmResolveRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (alertModal.show) {
          closeAlert()
        } else if (confirmModal.show) {
          confirmAction(false)
        }
      }
      if (e.key === 'Enter') {
        if (alertModal.show) {
          closeAlert()
        } else if (confirmModal.show) {
          confirmAction(true)
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
