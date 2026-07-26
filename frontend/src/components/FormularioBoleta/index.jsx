import { useState, useRef, useCallback } from 'react'
import { BRIGADAS_DATA, INCIDENCIAS } from '../../utils/constants'
import { calcularPanel, calcularUPM, calcularVOE } from '../../utils/helpers'
import { useBoletas } from '../../hooks/useBoletas'
import { useFiltros } from '../../hooks/useFiltros'
import { useModal } from '../../hooks/useModal'
import Formulario from './Formulario'
import TablaRegistros from './TablaRegistros'
import ReporteAvance from './ReporteAvance'
import ToolbarArchivos from './ToolbarArchivos'
import ModalReporte from './ModalReporte'
import ModalAlert from '../ui/ModalAlert'
import ModalConfirm from '../ui/ModalConfirm'

const INITIAL_FORM_STATE = {
  departamento: '',
  brigada: 'Brigada 1',
  folio: '',
  upm: '',
  upmReemplazo: '',
  upmAdicional: '',
  semana: 3,
  visita: '',
  panel: '',
  numeroCorrelativo: 1,
  voe: '',
  usuarioEncuestador: 'ece70101',
  nombreEncuestador: 'Griselda',
  incidencia: INCIDENCIAS[0],
  detalleObservaciones: '',
  totalObservaciones: 0,
  boletaObservada: 'NO',
  estadoBoleta: 'SIN OBSERVACION',
  observacionBoleta: '',
  consolidada: 'SI',
}

export default function FormularioBoleta({ sessionUser }) {
  const [editandoId, setEditandoId] = useState(null)
  const [folioDuplicado, setFolioDuplicado] = useState(false)
  const [modalData, setModalData] = useState(null)
  const brigadaRef = useRef(null)

  const {
    registros,
    loading,
    crearRegistro,
    actualizarRegistro,
    eliminarRegistro,
    verificarFolio,
    cargarBatch,
  } = useBoletas()

  const { filtroGeneral, setFiltroGeneral, registrosFiltrados } = useFiltros(registros)

  const {
    alertModal,
    confirmModal,
    showAlert,
    closeAlert,
    showConfirm,
    confirmAction,
  } = useModal()

  const getFormState = () => ({
    ...INITIAL_FORM_STATE,
    departamento: sessionUser.departamento,
    brigada: sessionUser.brigadas[0] || 'Brigada 1',
  })

  const [formData, setFormData] = useState(getFormState)

  const limpiarFormulario = useCallback(() => {
    setFormData(getFormState())
    setEditandoId(null)
    setFolioDuplicado(false)
  }, [sessionUser])

  const handleFolioChange = useCallback(async (val) => {
    const conteoUpmPrevias = registros.filter(
      (r) => r.upm === calcularUPM(val) && r.id !== editandoId,
    ).length

    setFormData((prev) => ({
      ...prev,
      numeroCorrelativo: conteoUpmPrevias + 1,
    }))

    if (val.trim() === '') {
      setFolioDuplicado(false)
      return
    }

    const existe = await verificarFolio(val, editandoId)
    setFolioDuplicado(existe)
  }, [registros, editandoId, verificarFolio])

  const handleVisitaChange = useCallback((val) => {
    const panelResultante = calcularPanel(val)
    setFormData((prev) => ({ ...prev, visita: val, panel: panelResultante }))
  }, [])

  const handleUsuarioEncuestadorChange = useCallback((userSel) => {
    setFormData((prev) => ({
      ...prev,
      usuarioEncuestador: userSel,
      nombreEncuestador: BRIGADAS_DATA[prev.brigada]?.[userSel] || '',
    }))
  }, [])

  const handleObservacionesChange = useCallback((texto) => {
    const frases = texto.split(';').filter((f) => f.trim().length > 0)
    const total = frases.length
    setFormData((prev) => ({
      ...prev,
      detalleObservaciones: texto,
      totalObservaciones: total,
      estadoBoleta: total > 0 ? 'OBSERVADO' : 'SIN OBSERVACION',
      boletaObservada: total > 0 ? 'SI' : 'NO',
      observacionBoleta: total > 0 ? 'NO ENVIADO' : '',
    }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (folioDuplicado) {
      showAlert(
        `El folio "${formData.folio}" ya existe. No se puede guardar un folio duplicado.`,
        'error',
      )
      return
    }

    try {
      if (editandoId) {
        await actualizarRegistro(editandoId, formData)
        showAlert('Registro actualizado correctamente.', 'success')
      } else {
        await crearRegistro(formData)
        showAlert('Registro guardado en SQLite.', 'success')
      }
      limpiarFormulario()
      setTimeout(() => brigadaRef.current?.focus(), 100)
    } catch (err) {
      showAlert('Error al guardar datos: ' + err.message, 'error')
    }
  }

  const handleEditar = useCallback((reg) => {
    setEditandoId(reg.id)
    setFormData({ ...reg, semana: parseInt(reg.semana, 10) || 0 })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleEliminar = useCallback(async (id) => {
    const confirmado = await showConfirm(
      '¿Está seguro de eliminar este registro de la base de datos?',
    )
    if (confirmado) {
      try {
        await eliminarRegistro(id)
      } catch (err) {
        showAlert('Error al eliminar: ' + err.message, 'error')
      }
    }
  }, [showConfirm, eliminarRegistro, showAlert])

  const handleDoubleClickCorregir = useCallback(async (reg) => {
    if (reg.estadoBoleta !== 'OBSERVADO') return
    const confirmado = await showConfirm(
      `¿Marcar el folio "${reg.folio}" como CORREGIDO?`,
    )
    if (!confirmado) return
    try {
      await actualizarRegistro(reg.id, {
        ...reg,
        estadoBoleta: 'CORREGIDO',
      })
      showAlert('Boleta marcada como CORREGIDA.', 'success')
    } catch (err) {
      showAlert('Error al actualizar estado: ' + err.message, 'error')
    }
  }, [showConfirm, actualizarRegistro, showAlert])

  const handleReporte = useCallback(async (reg) => {
    const grupo = registros.filter(
      (r) =>
        r.brigada === reg.brigada &&
        String(r.semana) === String(reg.semana) &&
        r.estadoBoleta === 'OBSERVADO',
    )
    if (grupo.length === 0) return

    setModalData({
      brigada: reg.brigada,
      semana: reg.semana,
      registros: grupo,
      registroSeleccionado: reg,
    })

    try {
      await actualizarRegistro(reg.id, {
        ...reg,
        observacionBoleta: 'ENVIADO',
      })
    } catch (err) {
      showAlert('Error al marcar boleta como enviada: ' + err.message, 'error')
    }
  }, [registros, actualizarRegistro, showAlert])

  const handleCargarJSON = useCallback(async (e) => {
    const fileReader = new FileReader()
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8')
      fileReader.onload = async (event) => {
        try {
          const parsedData = JSON.parse(event.target.result)
          if (Array.isArray(parsedData)) {
            if (parsedData.length === 0) {
              showAlert('El archivo JSON no contiene registros.', 'warning')
              return
            }
            const result = await cargarBatch(parsedData)
            const msg = result
              ? `Importación completada: ${result.insertados} insertados, ${result.omitidos} omitidos (duplicados).`
              : 'Datos del archivo JSON importados correctamente.'
            showAlert(msg, 'success')
          } else {
            showAlert(
              'El archivo JSON debe contener una lista de registros.',
              'warning',
            )
          }
        } catch (err) {
          const msg = err.response?.data?.error || err.message
          showAlert('Error al importar: ' + msg, 'error')
        }
      }
    }
  }, [cargarBatch, showAlert])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '2rem',
        color: '#64748b'
      }}>
        Cargando registros...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
      <Formulario
        formData={formData}
        setFormData={setFormData}
        editandoId={editandoId}
        sessionUser={sessionUser}
        folioDuplicado={folioDuplicado}
        onFolioChange={handleFolioChange}
        onVisitaChange={handleVisitaChange}
        onUsuarioEncuestadorChange={handleUsuarioEncuestadorChange}
        onObservacionesChange={handleObservacionesChange}
        onSubmit={handleSubmit}
        onLimpiar={limpiarFormulario}
      />

      <ReporteAvance registros={registros} semana={formData.semana} />

      <TablaRegistros
        registrosFiltrados={registrosFiltrados}
        filtroGeneral={filtroGeneral}
        onFiltroChange={setFiltroGeneral}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
        onDoubleClickCorregir={handleDoubleClickCorregir}
        onReporte={handleReporte}
        rol={sessionUser.rol}
      />

      <ToolbarArchivos
        registros={registros}
        showAlert={showAlert}
        onCargarJSON={handleCargarJSON}
      />

      {modalData && (
        <ModalReporte
          modalData={modalData}
          onClose={() => setModalData(null)}
        />
      )}

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
