import { useState, useEffect, useCallback } from 'react'
import { getEncuestadores, deleteEncuestador } from '../../services/encuestadorService'
import { useModal } from '../../hooks/useModal'
import FormularioEncuestador from './FormularioEncuestador'
import TablaEncuestadores from './TablaEncuestadores'
import ModalAlert from '../ui/ModalAlert'
import ModalConfirm from '../ui/ModalConfirm'

export default function GestionEncuestadores() {
  const [encuestadores, setEncuestadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [encuestadorEditando, setEncuestadorEditando] = useState(null)

  const {
    alertModal,
    confirmModal,
    showAlert,
    closeAlert,
    showConfirm,
    confirmAction,
  } = useModal()

  const cargarEncuestadores = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getEncuestadores()
      setEncuestadores(data)
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al cargar encuestadores'
      showAlert(msg, 'error')
    } finally {
      setLoading(false)
    }
  }, [showAlert])

  useEffect(() => {
    cargarEncuestadores()
  }, [cargarEncuestadores])

  const handleEliminar = useCallback(async (enc) => {
    const confirmado = await showConfirm(
      `¿Está seguro de eliminar al encuestador "${enc.nombre}" (${enc.codigo})? Esta acción no se puede deshacer.`
    )
    if (!confirmado) return

    try {
      await deleteEncuestador(enc.id)
      showAlert(`Encuestador "${enc.nombre}" eliminado correctamente.`, 'success')
      cargarEncuestadores()
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al eliminar el encuestador'
      showAlert(msg, 'error')
    }
  }, [showConfirm, showAlert, cargarEncuestadores])

  const handleEditar = useCallback((enc) => {
    setEncuestadorEditando(enc)
  }, [])

  const handleEncuestadorEditado = useCallback(() => {
    setEncuestadorEditando(null)
    cargarEncuestadores()
  }, [cargarEncuestadores])

  const handleCancelarEdicion = useCallback(() => {
    setEncuestadorEditando(null)
  }, [])

  return (
    <div>
      <FormularioEncuestador
        onEncuestadorCreado={cargarEncuestadores}
        onEncuestadorEditado={handleEncuestadorEditado}
        encuestadorEditando={encuestadorEditando}
        onCancelarEdicion={handleCancelarEdicion}
        showAlert={showAlert}
      />

      <TablaEncuestadores
        encuestadores={encuestadores}
        loading={loading}
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
