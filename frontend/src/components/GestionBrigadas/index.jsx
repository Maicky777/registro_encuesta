import { useState, useEffect, useCallback } from 'react'
import { getBrigadas, deleteBrigada } from '../../services/brigadaService'
import { useModal } from '../../hooks/useModal'
import FormularioBrigada from './FormularioBrigada'
import TablaBrigadas from './TablaBrigadas'
import ModalAlert from '../ui/ModalAlert'
import ModalConfirm from '../ui/ModalConfirm'

export default function GestionBrigadas() {
  const [brigadas, setBrigadas] = useState([])
  const [loading, setLoading] = useState(true)
  const [brigadaEditando, setBrigadaEditando] = useState(null)

  const {
    alertModal,
    confirmModal,
    showAlert,
    closeAlert,
    showConfirm,
    confirmAction,
  } = useModal()

  const cargarBrigadas = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBrigadas()
      setBrigadas(data)
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al cargar brigadas'
      showAlert(msg, 'error')
    } finally {
      setLoading(false)
    }
  }, [showAlert])

  useEffect(() => {
    cargarBrigadas()
  }, [cargarBrigadas])

  const handleEliminar = useCallback(async (brigada) => {
    const confirmado = await showConfirm(
      `¿Está seguro de eliminar la brigada "${brigada.nombre}" de ${brigada.departamento}? Esta acción no se puede deshacer.`
    )
    if (!confirmado) return

    try {
      await deleteBrigada(brigada.id)
      showAlert(`Brigada "${brigada.nombre}" eliminada correctamente.`, 'success')
      cargarBrigadas()
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al eliminar la brigada'
      showAlert(msg, 'error')
    }
  }, [showConfirm, showAlert, cargarBrigadas])

  const handleEditar = useCallback((brigada) => {
    setBrigadaEditando(brigada)
  }, [])

  const handleBrigadaEditada = useCallback(() => {
    setBrigadaEditando(null)
    cargarBrigadas()
  }, [cargarBrigadas])

  const handleCancelarEdicion = useCallback(() => {
    setBrigadaEditando(null)
  }, [])

  return (
    <div>
      <FormularioBrigada
        onBrigadaCreada={cargarBrigadas}
        onBrigadaEditada={handleBrigadaEditada}
        brigadaEditando={brigadaEditando}
        onCancelarEdicion={handleCancelarEdicion}
        showAlert={showAlert}
      />

      <TablaBrigadas
        brigadas={brigadas}
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
