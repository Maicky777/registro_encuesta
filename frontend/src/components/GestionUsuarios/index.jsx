import { useState, useEffect, useCallback } from 'react'
import { getUsers, deleteUser } from '../../services/authService'
import { useModal } from '../../hooks/useModal'
import FormularioUsuario from './FormularioUsuario'
import TablaUsuarios from './TablaUsuarios'
import ModalAlert from '../ui/ModalAlert'
import ModalConfirm from '../ui/ModalConfirm'

export default function GestionUsuarios({ currentUserId }) {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  const {
    alertModal,
    confirmModal,
    showAlert,
    closeAlert,
    showConfirm,
    confirmAction,
  } = useModal()

  const cargarUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsuarios(data)
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al cargar usuarios'
      showAlert(msg, 'error')
    } finally {
      setLoading(false)
    }
  }, [showAlert])

  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  const handleEliminar = useCallback(async (user) => {
    const confirmado = await showConfirm(
      `¿Está seguro de eliminar al usuario "${user.username}"? Esta acción no se puede deshacer.`,
    )
    if (!confirmado) return

    try {
      await deleteUser(user.id)
      showAlert(`Usuario "${user.username}" eliminado correctamente.`, 'success')
      cargarUsuarios()
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al eliminar el usuario'
      showAlert(msg, 'error')
    }
  }, [showConfirm, showAlert, cargarUsuarios])

  return (
    <div>
      <FormularioUsuario
        onUsuarioCreado={cargarUsuarios}
        showAlert={showAlert}
      />

      <TablaUsuarios
        usuarios={usuarios}
        loading={loading}
        currentUserId={currentUserId}
        onEliminar={handleEliminar}
      />

      <ModalAlert
        show={alertModal.show}
        message={alertModal.message}
        type={alertModal.type}
        onClose={closeAlert}
      />

      <ModalConfirm
        show={confirmModal.show}
        message={confirmModal.message}
        onConfirm={() => confirmAction(true)}
        onCancel={() => confirmAction(false)}
      />
    </div>
  )
}
