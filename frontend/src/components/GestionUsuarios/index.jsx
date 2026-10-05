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
  const [usuarioEditar, setUsuarioEditar] = useState(null)

  const {
    alertModal,
    confirmModal,
    showAlert,
    closeAlert,
    showConfirm,
    confirmAction,
  } = useModal()

  const cargarUsuarios = useCallback(
    async (isActivo = () => true) => {
      setLoading(true)
      try {
        const data = await getUsers()
        if (!isActivo()) return
        setUsuarios(data)
      } catch (err) {
        if (!isActivo()) return
        const msg = err.response?.data?.error || 'Error al cargar usuarios'
        showAlert(msg, 'error')
      } finally {
        if (isActivo()) setLoading(false)
      }
    },
    [showAlert],
  )

  useEffect(() => {
    let activo = true
    const inicial = async () => {
      await cargarUsuarios(() => activo)
    }
    inicial()
    return () => { activo = false }
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

  const handleEditar = useCallback((user) => {
    setUsuarioEditar(user)
  }, [])

  const handleCancelarEdicion = useCallback(() => {
    setUsuarioEditar(null)
  }, [])

  return (
    <div>
      <FormularioUsuario
        onUsuarioCreado={() => { cargarUsuarios(); setUsuarioEditar(null) }}
        showAlert={showAlert}
        usuarioEditar={usuarioEditar}
        onCancelarEdicion={handleCancelarEdicion}
      />

      <TablaUsuarios
        usuarios={usuarios}
        loading={loading}
        currentUserId={currentUserId}
        onEliminar={handleEliminar}
        onEditar={handleEditar}
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
